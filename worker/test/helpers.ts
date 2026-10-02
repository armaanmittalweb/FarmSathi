import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { createApp, type Bindings } from '../src/app'
import type { AiRunner, SpeakCache } from '../src/http'
import type { Sql } from '../src/sql'

/** node:sqlite behind the same interface as D1, loaded with the real schema. */
export function sqliteSql(): Sql & { db: DatabaseSync } {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON') // D1 enforces foreign keys
  db.exec(readFileSync(fileURLToPath(new URL('../schema.sql', import.meta.url).href), 'utf8'))
  const args = (p: unknown[]) => p.map(v => (v === undefined ? null : v)) as (string | number | null)[]
  return {
    db,
    async all<T>(query: string, ...params: unknown[]) {
      return db.prepare(query).all(...args(params)) as T[]
    },
    async run(query, ...params) {
      return Number(db.prepare(query).run(...args(params)).changes)
    },
    async batch(statements) {
      db.exec('BEGIN')
      try {
        const out = statements.map(([q, ...p]) => db.prepare(q).all(...args(p)) as Record<string, unknown>[])
        db.exec('COMMIT')
        return out
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    },
    async size() {
      return 4096
    },
  }
}

export const ORIGIN = 'https://farmsaathi.amittal.dev'
export const API = 'https://farmsaathi-api.amittal.dev'
/** 2026-09-30 12:00 UTC = 17:30 in India. */
export const T0 = Date.UTC(2026, 8, 30, 12, 0, 0)
export const DAY = 86_400_000

// ---- Fake Workers AI -----------------------------------------------------------------------------

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'is', 'are', 'on', 'with', 'by', 'at', 'as', 'it', 'be', 'from', 'like', 'up', 'can', 'my', 'what', 'when', 'will', 'how', 'do', 'i'])
const DIM = 2048

/** A bag-of-words embedder: shared words → similar vectors. Enough to test retrieval offline. */
export function fakeEmbed(text: string): number[] {
  const v = new Array<number>(DIM).fill(0)
  for (const raw of text.toLowerCase().split(/[^a-z0-9ऀ-੿]+/)) {
    if (!raw || STOP.has(raw)) continue
    const w = raw.length > 3 ? raw.replace(/s$/, '') : raw // installments ~ installment
    let h = 2166136261
    for (const ch of w) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0
    v[h % DIM] += 1
  }
  return v
}

export interface AiCall { model: string; inputs: Record<string, unknown> }
export interface FakeAi extends AiRunner {
  calls: AiCall[]
  /** What the chat model answers (or throws). Default: a Hindi-free English answer. */
  chat: (inputs: Record<string, unknown>) => unknown
  whisper: (inputs: Record<string, unknown>) => unknown
  embedFails: boolean
}

export function fakeAi(): FakeAi {
  const ai: FakeAi = {
    calls: [],
    chat: () => ({ response: 'Workers AI answer about your crop.' }),
    whisper: () => ({ text: 'workers ai heard this' }),
    embedFails: false,
    async run(model, inputs) {
      ai.calls.push({ model, inputs })
      if (model.includes('bge')) {
        if (ai.embedFails) throw new Error('embed down')
        return { shape: [0, DIM], data: (inputs.text as string[]).map(fakeEmbed) }
      }
      if (model.includes('whisper')) return ai.whisper(inputs)
      return ai.chat(inputs)
    },
  }
  return ai
}

// ---- Fake fetch ----------------------------------------------------------------------------------

export interface Captured { url: string; host: string; headers: Headers; body: unknown; raw: string }
type Answer = (req: Captured, init?: RequestInit) => Response | Promise<Response>

/** A fetch that answers per host and records every request (JSON bodies parsed, form bodies as entries). */
export function fakeFetch(answers: Record<string, Answer> = {}) {
  const calls: Captured[] = []
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input), host = new URL(url).hostname
    let body: unknown = null, raw = ''
    if (typeof init?.body === 'string') {
      raw = init.body
      try { body = JSON.parse(raw) } catch { body = raw }
    } else if (init?.body instanceof FormData) {
      const entries: Record<string, unknown> = {}
      for (const [k, v] of init.body.entries()) entries[k] = typeof v === 'string' ? v : { name: (v as File).name, size: (v as File).size, type: (v as File).type }
      body = entries
      raw = JSON.stringify(entries)
    } else if (init?.body instanceof Uint8Array) {
      body = init.body
    }
    const captured = { url, host, headers: new Headers(init?.headers), body, raw }
    calls.push(captured)
    const answer = answers[host]
    if (!answer) throw new Error('unreachable ' + host)
    return answer(captured, init)
  }) as typeof fetch & { calls: Captured[] }
  fn.calls = calls
  return fn
}

/** Never answers; rejects when aborted (a provider that hangs). */
export const hang: Answer = (_req, init) => new Promise((_resolve, reject) => {
  init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
})

export const openAi = (text: string) => () => Response.json({ choices: [{ message: { content: text } }] })
export const gemini = (text: string) => () => Response.json({ candidates: [{ content: { parts: [{ text }] } }] })
export const status = (code: number) => () => new Response('nope', { status: code })

// ---- Fake Cache API ------------------------------------------------------------------------------

export function memoryCache(): SpeakCache & { store: Map<string, { body: ArrayBuffer; headers: Headers }> } {
  const store = new Map<string, { body: ArrayBuffer; headers: Headers }>()
  return {
    store,
    async match(req) {
      const hit = store.get(req.url)
      return hit ? new Response(hit.body.slice(0), { headers: hit.headers }) : undefined
    },
    async put(req, res) {
      store.set(req.url, { body: await res.arrayBuffer(), headers: new Headers(res.headers) })
    },
  }
}

// ---- The app under test --------------------------------------------------------------------------

type CallOpts = {
  body?: unknown; form?: FormData; cookie?: string; origin?: string | null; type?: string | null
  headers?: Record<string, string>; ip?: string
}

export interface SetupOpts { fetch?: typeof fetch; ai?: FakeAi | null; cache?: SpeakCache; stepTimeoutMs?: number; voiceTimeoutMs?: number }

/** A fresh API on node:sqlite with a controllable clock, fetch, Workers AI and cache. */
export function setup(extra: Partial<Bindings> = {}, opts: SetupOpts = {}) {
  const sql = sqliteSql(), clock = { t: T0 }
  const ai = opts.ai === undefined ? fakeAi() : opts.ai
  const fetcher = opts.fetch ?? fakeFetch()
  const cache = opts.cache ?? memoryCache()
  const app = createApp({
    sql: () => sql, now: () => clock.t, fetch: fetcher, ai: () => ai ?? undefined, cache: () => cache,
    stepTimeoutMs: opts.stepTimeoutMs ?? 50, voiceTimeoutMs: opts.voiceTimeoutMs ?? 50,
  })
  const env = { DB: {} as D1Database, INTERNAL_KEY: 'internal-key', RAG_MIN_SCORE: '0.05', ...extra } as Bindings
  const pending: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p), passThroughOnException() {}, props: {} } as unknown as ExecutionContext

  async function call(method: string, path: string, o: CallOpts = {}) {
    const headers: Record<string, string> = { 'cf-connecting-ip': o.ip ?? '203.0.113.7', ...o.headers }
    const origin = o.origin === undefined ? ORIGIN : o.origin
    if (origin) headers.origin = origin
    if (o.cookie) headers.cookie = o.cookie
    let body: BodyInit | undefined
    if (o.form) {
      body = o.form
      if (o.type) headers['content-type'] = o.type
    } else if (method !== 'GET' && method !== 'OPTIONS') {
      const type = o.type === undefined ? 'application/json' : o.type
      if (type) headers['content-type'] = type
      body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body ?? {})
    }
    const res = await app.request(API + path, { method, headers, body }, env, ctx)
    const isAudio = (res.headers.get('content-type') ?? '').startsWith('audio/')
    const bytes = isAudio ? new Uint8Array(await res.arrayBuffer()) : null
    const text = isAudio ? '' : await res.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { json = text }
    const setCookie = res.headers.get('set-cookie') ?? ''
    const cookie = /fs_session=([^;]*)/.exec(setCookie)?.[1]
    return { status: res.status, json, text, bytes, headers: res.headers, setCookie, cookie: cookie ? `fs_session=${cookie}` : undefined }
  }

  /** Signs up; returns the login, password and session cookie. */
  async function signup(login = '98765 43210', password = 'khet-ki-mitti', extraBody: Record<string, unknown> = {}) {
    const res = await call('POST', '/api/auth/signup', { body: { login, password, lang: 'en', ...extraBody } })
    if (res.status !== 201) throw new Error('signup failed ' + JSON.stringify(res.json))
    return { login: res.json.user.login as string, password, cookie: res.cookie!, id: res.json.user.id as string }
  }

  const settle = async () => { await Promise.all(pending.splice(0)) }

  return { sql, clock, app, env, ai, fetch: fetcher, cache, call, signup, settle }
}

/** A tiny valid WAV (44-byte header + a few samples). */
export function wav(samples = 800) {
  const buf = new ArrayBuffer(44 + samples * 2), v = new DataView(buf)
  const ascii = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)))
  ascii(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true)
  v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ascii(36, 'data'); v.setUint32(40, samples * 2, true)
  return new Uint8Array(buf)
}
