/**
 * Shared pieces of the HTTP layer: bindings, injectable dependencies, the localised error shape, body
 * parsing, cookie sessions and the daily counters.
 */
import type { Context, Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Lang } from './contract'
import { isLang, langFromHeader, MESSAGES, type MessageKey } from './i18n'
import { newToken, sha256hex } from './keys'
import type { Sql } from './sql'

/** The Workers rate limiting binding (declared in wrangler.jsonc). */
export interface Limiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/** The part of the Workers AI binding this Worker uses. */
export interface AiRunner {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>
}

/** The part of the Cache API the speak route uses (caches.default in production). */
export interface SpeakCache {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

export interface Bindings {
  DB: D1Database
  AI?: AiRunner
  LOGIN_LIMITER?: Limiter
  API_LIMITER?: Limiter
  /** Comma-separated exact origins allowed to call /api with credentials. */
  ALLOWED_ORIGINS?: string
  /** Shared with the Switchboard; unlocks /internal/*. Unset = those routes 404. */
  INTERNAL_KEY?: string
  /** The Hugging Face Space, e.g. https://armaanmittalweb-farmsaathi-voice.hf.space */
  VOICE_URL?: string
  /** Sent to the Space as x-voice-key. */
  VOICE_KEY?: string
  GROQ_API_KEY?: string
  GEMINI_API_KEY?: string
  OPENROUTER_API_KEY?: string
  // Model names (vars, so they change without a code change).
  GROQ_MODEL?: string
  GEMINI_MODEL?: string
  OPENROUTER_MODEL?: string
  WORKERS_AI_MODEL?: string
  EMBED_MODEL?: string
  GROQ_STT_MODEL?: string
  WORKERS_AI_STT_MODEL?: string
  // Global daily caps per provider (calls per India day). Unset = the defaults in chain.ts / voice.ts.
  GROQ_DAILY_CAP?: string
  GEMINI_DAILY_CAP?: string
  OPENROUTER_DAILY_CAP?: string
  WORKERS_AI_DAILY_CAP?: string
  GROQ_STT_DAILY_CAP?: string
  WORKERS_AI_STT_DAILY_CAP?: string
  /** PBKDF2 rounds for new password hashes (default and maximum 100,000). */
  PASSWORD_ITERATIONS?: string
  /** Lowest cosine similarity for a passage to go into the prompt (default 0.4). */
  RAG_MIN_SCORE?: string
}

export interface Deps {
  sql(env: Bindings): Sql
  now?: () => number
  /** Provider and voice Space requests. */
  fetch?: typeof fetch
  /** Workers AI. Default: env.AI. */
  ai?: (env: Bindings) => AiRunner | undefined
  /** Default: caches.default. */
  cache?: () => SpeakCache | undefined
  /** Per chain step and per transcription provider (default 12 s). */
  stepTimeoutMs?: number
  /** For the voice Space (default 25 s: a 600-character answer takes a while on 2 free vCPUs). */
  voiceTimeoutMs?: number
}

export interface User { id: string; login: string; createdAt: number }
export type AppEnv = { Bindings: Bindings; Variables: { user: User | null; sessionId: string | null; lang: Lang } }
export type Ctx = Context<AppEnv>
export type App = Hono<AppEnv>

export const DEFAULT_ORIGINS = 'https://farmsaathi.amittal.dev,http://localhost:5176'
export const COOKIE = 'fs_session'
export const SESSION_MS = 30 * 86_400_000
/** last_seen_at (and the cookie's Max-Age) move forward at most this often, to save D1 writes. */
export const SLIDE_MS = 3_600_000
export const MAX_BODY_BYTES = 256 * 1024
export const CHAT_RETENTION_DAYS = 180

export type ErrorCode = 'bad_request' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'rate_limited' | 'too_large' | 'unavailable' | 'server'
type Status = 400 | 401 | 403 | 404 | 409 | 413 | 429 | 500 | 503

/** The request's language: set by a route from its body, else ?lang=, else Accept-Language, else en. */
export function langOf(c: Ctx): Lang {
  return c.get('lang') ?? 'en'
}
export function setLang(c: Ctx, v: unknown) {
  if (isLang(v)) c.set('lang', v)
}
export function initialLang(c: Ctx): Lang {
  const q = c.req.query('lang')
  return isLang(q) ? q : langFromHeader(c.req.header('accept-language')) ?? 'en'
}

export const msg = (c: Ctx, key: MessageKey) => MESSAGES[key][langOf(c)]

/** The contract's error body, with the message in the request's language. */
export const fail = (c: Ctx, status: Status, code: ErrorCode, key: MessageKey, extra: object = {}) =>
  c.json({ error: msg(c, key), code, ...extra }, status)

export const allowedOrigins = (env: Bindings) => (env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS).split(',').map(o => o.trim()).filter(Boolean)
export const clientIp = (c: Ctx) => c.req.header('cf-connecting-ip') ?? 'unknown'

/** The JSON body as an object, or null when it is missing, too large or not an object. */
export async function readJson(c: Ctx): Promise<Record<string, unknown> | null> {
  const text = await c.req.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null
  try {
    const v = JSON.parse(text) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export const iso = (ms: number) => new Date(Number(ms)).toISOString()

export async function hitLimiter(limiter: Limiter | undefined, key: string) {
  return !limiter || (await limiter.limit({ key })).success
}

// ---- Days and counters --------------------------------------------------------------------------

/** Daily limits reset at midnight India Standard Time (UTC+5:30), when the farmer's day starts. */
const IST_OFFSET_MS = 19_800_000
export const istDay = (now: number) => Math.floor((now + IST_OFFSET_MS) / 86_400_000)
/** Seconds until the next India midnight (the retryAfter of a daily limit). */
export const secondsToNextDay = (now: number) => Math.max(1, Math.ceil(((istDay(now) + 1) * 86_400_000 - IST_OFFSET_MS - now) / 1000))

/** Adds `by` to today's counter `key` and returns the new value. */
export async function bump(sql: Sql, now: number, key: string, by = 1) {
  const [row] = await sql.all<{ n: number }>(
    'INSERT INTO usage (day, key, n) VALUES (?, ?, ?) ON CONFLICT (day, key) DO UPDATE SET n = n + excluded.n RETURNING n', istDay(now), key, by)
  return Number(row?.n ?? 0)
}

/** Sets today's counter `key` to `n`. */
export async function setCounter(sql: Sql, now: number, key: string, n: number) {
  await sql.run('INSERT INTO usage (day, key, n) VALUES (?, ?, ?) ON CONFLICT (day, key) DO UPDATE SET n = excluded.n', istDay(now), key, n)
}

export async function peek(sql: Sql, now: number, key: string) {
  const [row] = await sql.all<{ n: number }>('SELECT n FROM usage WHERE day = ? AND key = ?', istDay(now), key)
  return Number(row?.n ?? 0)
}

export type Kind = 'chat' | 'transcribe' | 'speak'
export const VISITOR_LIMITS: Record<Kind, number> = { chat: 30, transcribe: 30, speak: 60 }

/**
 * Counts one request of `kind` for this visitor (a hash of the day, the IP and the account, so it
 * changes every day and never stores an IP). False once the visitor is over the day's limit.
 */
export async function takeVisitor(c: Ctx, sql: Sql, now: number, kind: Kind) {
  const who = await sha256hex(`${istDay(now)}|${clientIp(c)}|${c.get('user')?.id ?? 'guest'}`)
  if ((await bump(sql, now, `v:${kind}:${who.slice(0, 32)}`)) > VISITOR_LIMITS[kind]) return false
  await bump(sql, now, `all:${kind}`)
  return true
}

export const capOf = (v: string | undefined, fallback: number) => {
  const n = Number(v)
  return v !== undefined && v.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : fallback
}

/** Reserves one call to a provider under its global daily cap. False (and nothing counted) at the cap. */
export async function takeProvider(sql: Sql, now: number, provider: string, cap: number) {
  if (cap <= 0) return false
  if ((await peek(sql, now, `p:${provider}`)) >= cap) return false
  return (await bump(sql, now, `p:${provider}`)) <= cap
}

// ---- Sessions -----------------------------------------------------------------------------------

const cookieOpts = (c: Ctx) => ({
  httpOnly: true,
  // Production is HTTPS only. `wrangler dev` on http://localhost drops Secure.
  secure: new URL(c.req.url).protocol === 'https:',
  sameSite: 'Lax' as const,
  path: '/',
})

function sendCookie(c: Ctx, token: string) {
  setCookie(c, COOKIE, token, { ...cookieOpts(c), maxAge: SESSION_MS / 1000 })
}

export function clearCookie(c: Ctx) {
  deleteCookie(c, COOKIE, cookieOpts(c))
}

/** Starts a session for the user: a new token in the cookie, its SHA-256 in D1. */
export async function startSession(c: Ctx, sql: Sql, userId: string, now: number) {
  const token = newToken(), id = await sha256hex(token)
  await sql.run('INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)', id, userId, now, now, now + SESSION_MS)
  sendCookie(c, token)
  return id
}

/** The signed-in user for this request, sliding the session forward; null when there is none. */
export async function currentSession(c: Ctx, sql: Sql, now: number): Promise<{ user: User; sessionId: string } | null> {
  const token = getCookie(c, COOKIE)
  if (!token || token.length > 100) return null
  const id = await sha256hex(token)
  const [row] = await sql.all<{ user_id: string; last_seen_at: number; login: string; created_at: number }>(
    `SELECT s.user_id, s.last_seen_at, u.login, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`, id, now)
  if (!row) return null
  if (now - Number(row.last_seen_at) > SLIDE_MS) {
    await sql.run('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?', now, now + SESSION_MS, id)
    sendCookie(c, token)
  }
  return { user: { id: row.user_id, login: row.login, createdAt: Number(row.created_at) }, sessionId: id }
}

/** Runs `p` after the response when the runtime allows it (waitUntil), else lets it run unawaited. */
export function background(c: Ctx, p: Promise<unknown>) {
  const safe = p.catch(e => console.error('background', e))
  try {
    c.executionCtx.waitUntil(safe)
  } catch {
    // no execution context (some tests): the promise still runs
  }
}
