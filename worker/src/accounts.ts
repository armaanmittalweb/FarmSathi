/**
 * Optional accounts: sign-up and sign-in with a mobile number or an email and a password (no OTP, no
 * SMS: the number is only a username), the profile, saved chats and the guest-history import.
 */
import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { ChatTurn, Lang, Me, Profile, Source } from './contract'
import {
  clearCookie, clientIp, COOKIE, fail, hitLimiter, iso, langOf, readJson, setLang, startSession,
  type App, type AppEnv, type Ctx, type Deps,
} from './http'
import { isLang } from './i18n'
import { DUMMY_HASH, hashPassword, sha256hex, verifyPassword } from './keys'

export const CHATS_PAGE = 50
export const MAX_IMPORT = 200
export const MAX_QUESTION = 1000
export const MAX_ANSWER = 8000

/**
 * A login as stored: `+91XXXXXXXXXX` for an Indian mobile number (10 digits starting 6-9, written
 * with or without +91, 91 or a leading 0, spaces or dashes), or a trimmed lower-cased email.
 */
export function normLogin(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (s.includes('@')) {
    const e = s.toLowerCase()
    return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
  }
  const m = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(s.replace(/[\s().-]/g, ''))
  return m ? '+91' + m[1] : null
}

export interface UserRow {
  id: string; login: string; pass_hash: string; created_at: number
  name: string | null; lang: string; state: string | null; district: string | null
  lat: number | null; lon: number | null; crops: string; farm_size_acres: number | null
}

export function profileOf(u: UserRow): Profile {
  let crops: string[] = []
  try {
    const v = JSON.parse(u.crops) as unknown
    if (Array.isArray(v)) crops = v.filter((x): x is string => typeof x === 'string')
  } catch {
    // keep []
  }
  return {
    name: u.name, lang: isLang(u.lang) ? u.lang : 'en', state: u.state, district: u.district,
    lat: u.lat === null ? null : Number(u.lat), lon: u.lon === null ? null : Number(u.lon),
    crops, farmSizeAcres: u.farm_size_acres === null ? null : Number(u.farm_size_acres),
  }
}

export const meOf = (u: UserRow): Me => ({ user: { id: u.id, login: u.login, createdAt: iso(u.created_at) }, profile: profileOf(u) })

const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\u0000-\u001f<>]/.test(v)
const nullableText = (v: unknown, max: number): string | null | undefined => (v === null || v === '' ? null : text(v, max) ? (v as string).trim() : undefined)
const nullableNum = (v: unknown, lo: number, hi: number): number | null | undefined =>
  v === null ? null : typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined

/** The profile fields present in `b`, checked; null when any present field is wrong. Unknown keys are ignored. */
export function profilePatch(b: Record<string, unknown>): Partial<Profile> | null {
  const out: Partial<Profile> = {}
  if ('name' in b) { const v = nullableText(b.name, 80); if (v === undefined) return null; out.name = v }
  if ('lang' in b) { if (!isLang(b.lang)) return null; out.lang = b.lang }
  if ('state' in b) { const v = nullableText(b.state, 60); if (v === undefined) return null; out.state = v }
  if ('district' in b) { const v = nullableText(b.district, 60); if (v === undefined) return null; out.district = v }
  if ('lat' in b) { const v = nullableNum(b.lat, -90, 90); if (v === undefined) return null; out.lat = v }
  if ('lon' in b) { const v = nullableNum(b.lon, -180, 180); if (v === undefined) return null; out.lon = v }
  if ('farmSizeAcres' in b) { const v = nullableNum(b.farmSizeAcres, 0, 100_000); if (v === undefined) return null; out.farmSizeAcres = v }
  if ('crops' in b) {
    if (!Array.isArray(b.crops) || b.crops.length > 20 || !b.crops.every(c => text(c, 40))) return null
    out.crops = [...new Set((b.crops as string[]).map(c => c.trim()))]
  }
  return out
}

const COLUMNS: Record<keyof Profile, string> = {
  name: 'name', lang: 'lang', state: 'state', district: 'district', lat: 'lat', lon: 'lon', crops: 'crops', farmSizeAcres: 'farm_size_acres',
}

/** A Source as stored or sent by the app; null when it is not one. */
export function sourceOf(v: unknown): Source | null {
  const s = v as Partial<Source> | null
  if (!s || typeof s !== 'object' || !text(s.id, 64) || (s.kind !== 'scheme' && s.kind !== 'note') || !text(s.title, 200)) return null
  return { id: s.id!, kind: s.kind, title: s.title! }
}

/** A ChatTurn from the phone (guest history); null when anything is off. */
export function turnOf(v: unknown): (ChatTurn & { atMs: number }) | null {
  const t = v as Partial<ChatTurn> | null
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(t.id) || !isLang(t.lang)) return null
  const atMs = typeof t.at === 'string' ? Date.parse(t.at) : NaN
  if (!Number.isFinite(atMs)) return null
  if (typeof t.question !== 'string' || !t.question.trim() || t.question.length > MAX_QUESTION) return null
  if (typeof t.answer !== 'string' || !t.answer.trim() || t.answer.length > MAX_ANSWER) return null
  if (!Array.isArray(t.sources) || t.sources.length > 5) return null
  const sources = t.sources.map(sourceOf)
  if (sources.some(s => !s)) return null
  return { id: t.id, at: iso(atMs), atMs, lang: t.lang, question: t.question, answer: t.answer, sources: sources as Source[] }
}

interface ChatRow { id: string; at: number; lang: string; question: string; answer: string; sources: string }
const turnFromRow = (r: ChatRow): ChatTurn => ({
  id: r.id, at: iso(r.at), lang: (isLang(r.lang) ? r.lang : 'en') as Lang, question: r.question, answer: r.answer, sources: JSON.parse(r.sources) as Source[],
})

export function accountRoutes(app: App, deps: Deps, requireUser: MiddlewareHandler<AppEnv>) {
  const now = deps.now ?? Date.now
  const sqlOf = (c: Ctx) => deps.sql(c.env)
  const userBy = async (c: Ctx, column: 'id' | 'login', v: string) =>
    (await sqlOf(c).all<UserRow>(`SELECT * FROM users WHERE ${column} = ?`, v))[0] ?? null
  const tooMany = (c: Ctx) => fail(c, 429, 'rate_limited', 'too_many_tries', { retryAfter: 60 })

  app.post('/api/auth/signup', async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    if (!(await hitLimiter(c.env.LOGIN_LIMITER, clientIp(c)))) return tooMany(c)
    if (!b) return fail(c, 400, 'bad_request', 'bad_request')
    const login = normLogin(b.login)
    if (!login) return fail(c, 400, 'bad_request', 'bad_login')
    if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) return fail(c, 400, 'bad_request', 'short_password')
    const name = b.name === undefined ? null : nullableText(b.name, 80)
    if (name === undefined) return fail(c, 400, 'bad_request', 'bad_profile')
    if (await userBy(c, 'login', login)) return fail(c, 409, 'conflict', 'login_taken')
    const id = crypto.randomUUID(), t = now(), sql = sqlOf(c)
    try {
      await sql.run('INSERT INTO users (id, login, pass_hash, created_at, name, lang) VALUES (?, ?, ?, ?, ?, ?)',
        id, login, await hashPassword(b.password), t, name, langOf(c))
    } catch (e) {
      if (/UNIQUE/i.test(String(e))) return fail(c, 409, 'conflict', 'login_taken')
      throw e
    }
    await startSession(c, sql, id, t)
    return c.json(meOf((await userBy(c, 'id', id))!), 201)
  })

  app.post('/api/auth/login', async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    if (!(await hitLimiter(c.env.LOGIN_LIMITER, clientIp(c)))) return tooMany(c)
    const login = normLogin(b?.login)
    const password = typeof b?.password === 'string' && b.password.length <= 200 ? b.password : ''
    const user = login ? await userBy(c, 'login', login) : null
    // Unknown logins still pay for one hash, so timing does not tell them apart.
    const ok = await verifyPassword(password, user?.pass_hash ?? DUMMY_HASH)
    if (!user || !ok) return fail(c, 401, 'unauthenticated', 'bad_credentials')
    await startSession(c, sqlOf(c), user.id, now())
    return c.json(meOf(user))
  })

  app.post('/api/auth/logout', async c => {
    const token = getCookie(c, COOKIE)
    if (token && token.length <= 100) await sqlOf(c).run('DELETE FROM sessions WHERE id = ?', await sha256hex(token))
    clearCookie(c)
    return c.body(null, 204)
  })

  app.get('/api/auth/me', requireUser, async c => {
    const user = await userBy(c, 'id', c.get('user')!.id)
    if (!user) return fail(c, 401, 'unauthenticated', 'signed_out')
    return c.json(meOf(user))
  })

  app.patch('/api/me', requireUser, async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    const patch = b ? profilePatch(b) : null
    if (!patch) return fail(c, 400, 'bad_request', 'bad_profile')
    const keys = Object.keys(patch) as (keyof Profile)[]
    if (keys.length) {
      const values = keys.map(k => (k === 'crops' ? JSON.stringify(patch.crops) : patch[k]))
      await sqlOf(c).run(`UPDATE users SET ${keys.map(k => `${COLUMNS[k]} = ?`).join(', ')} WHERE id = ?`, ...values, c.get('user')!.id)
    }
    return c.json(meOf((await userBy(c, 'id', c.get('user')!.id))!))
  })

  app.delete('/api/me', requireUser, async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    if (!(await hitLimiter(c.env.LOGIN_LIMITER, clientIp(c)))) return tooMany(c)
    const user = await userBy(c, 'id', c.get('user')!.id)
    if (!user || typeof b?.password !== 'string' || !(await verifyPassword(b.password, user.pass_hash))) return fail(c, 403, 'forbidden', 'wrong_password')
    // Sessions and chats go with the user (ON DELETE CASCADE).
    await sqlOf(c).run('DELETE FROM users WHERE id = ?', user.id)
    clearCookie(c)
    return c.body(null, 204)
  })

  app.get('/api/me/chats', requireUser, async c => {
    const userId = c.get('user')!.id, before = c.req.query('before'), sql = sqlOf(c)
    let rows: ChatRow[]
    if (before) {
      const [cursor] = await sql.all<{ at: number }>('SELECT at FROM chats WHERE user_id = ? AND id = ?', userId, before)
      if (!cursor) return fail(c, 400, 'bad_request', 'bad_request')
      rows = await sql.all<ChatRow>(
        `SELECT id, at, lang, question, answer, sources FROM chats WHERE user_id = ? AND (at < ? OR (at = ? AND id < ?))
          ORDER BY at DESC, id DESC LIMIT ?`, userId, cursor.at, cursor.at, before, CHATS_PAGE + 1)
    } else {
      rows = await sql.all<ChatRow>('SELECT id, at, lang, question, answer, sources FROM chats WHERE user_id = ? ORDER BY at DESC, id DESC LIMIT ?', userId, CHATS_PAGE + 1)
    }
    return c.json({ chats: rows.slice(0, CHATS_PAGE).map(turnFromRow), more: rows.length > CHATS_PAGE })
  })

  app.post('/api/me/chats/import', requireUser, async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    if (!b || !Array.isArray(b.turns) || b.turns.length > MAX_IMPORT) return fail(c, 400, 'bad_request', 'bad_import')
    const turns = b.turns.map(turnOf)
    if (turns.some(t => !t)) return fail(c, 400, 'bad_request', 'bad_import')
    const userId = c.get('user')!.id
    // Idempotent: importing the same turn twice keeps one copy.
    await sqlOf(c).batch(turns.map(t => [
      'INSERT OR IGNORE INTO chats (user_id, id, at, lang, question, answer, sources) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId, t!.id, t!.atMs, t!.lang, t!.question, t!.answer, JSON.stringify(t!.sources),
    ]))
    return c.body(null, 204)
  })
}
