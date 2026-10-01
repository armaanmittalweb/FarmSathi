/**
 * The FarmSaathi API (farmsaathi-api.amittal.dev). See README.md and docs/live/contract.md.
 *
 * CSRF: every state-changing /api request needs an Origin from ALLOWED_ORIGINS and
 * Content-Type: application/json (multipart/form-data on /api/transcribe only); otherwise 403. The
 * session cookie is SameSite=Lax as well.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { accountRoutes } from './accounts'
import { chatRoutes } from './chat'
import {
  allowedOrigins, CHAT_RETENTION_DAYS, clientIp, currentSession, fail, hitLimiter, initialLang, istDay, langOf, peek,
  type AppEnv, type Deps,
} from './http'
import { isLang } from './i18n'
import { sameString } from './keys'
import { schemesFor } from './knowledge'
import type { Sql } from './sql'
import { voiceRoutes } from './voice'

export type { Bindings, Deps } from './http'

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])
/** Usage counters are kept this many days (the Switchboard reads today's). */
const USAGE_DAYS = 7

export function createApp(deps: Deps) {
  const now = deps.now ?? Date.now
  const app = new Hono<AppEnv>()

  app.use('*', async (c, next) => {
    c.set('lang', initialLang(c))
    c.set('user', null)
    c.set('sessionId', null)
    await next()
    if (!c.res.headers.has('Cache-Control')) c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'no-referrer')
  })

  app.use('/api/*', async (c, next) => {
    const allowed = allowedOrigins(c.env)
    return cors({
      origin: origin => (allowed.includes(origin) ? origin : null),
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      maxAge: 86400,
    })(c, next)
  })

  // CSRF: an allowed Origin and a JSON (or, for audio, multipart) body on anything that changes state.
  app.use('/api/*', async (c, next) => {
    if (SAFE.has(c.req.method)) return next()
    const type = (c.req.header('content-type') ?? '').split(';')[0].trim().toLowerCase()
    const want = c.req.path === '/api/transcribe' ? 'multipart/form-data' : 'application/json'
    if (type !== want || !allowedOrigins(c.env).includes(c.req.header('origin') ?? '')) return fail(c, 403, 'forbidden', 'forbidden')
    return next()
  })

  app.use('/api/*', async (c, next) => {
    if (c.req.method === 'OPTIONS' || c.req.path === '/api/test') return next()
    if (!(await hitLimiter(c.env.API_LIMITER, clientIp(c)))) return fail(c, 429, 'rate_limited', 'too_many_tries', { retryAfter: 60 })
    const s = await currentSession(c, deps.sql(c.env), now())
    if (s) {
      c.set('user', s.user)
      c.set('sessionId', s.sessionId)
    }
    return next()
  })

  const requireUser = createMiddleware<AppEnv>(async (c, next) => {
    if (!c.get('user')) return fail(c, 401, 'unauthenticated', 'signed_out')
    await next()
  })

  app.get('/api/test', c => c.json({ ok: true, service: 'farmsaathi-api' }))

  app.get('/api/schemes', c => {
    const q = c.req.query('lang')
    c.header('Cache-Control', 'public, max-age=86400')
    return c.json(schemesFor(isLang(q) ? q : langOf(c)))
  })

  accountRoutes(app, deps, requireUser)
  chatRoutes(app, deps)
  voiceRoutes(app, deps)

  // Private routes for the Switchboard's admin dashboard, reached through a service binding.
  app.use('/internal/*', async (c, next) => {
    const key = c.env.INTERNAL_KEY
    if (!key || !sameString(c.req.header('x-internal-key') ?? '', key)) return fail(c, 404, 'not_found', 'not_found')
    return next()
  })

  app.get('/internal/stats', async c => {
    const sql = deps.sql(c.env), t = now()
    const [row] = await sql.all<{ users: number; chats: number }>('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM chats) AS chats')
    const answers = await sql.all<{ key: string; n: number }>("SELECT key, n FROM usage WHERE day = ? AND key LIKE 'a:%' ORDER BY key", istDay(t))
    return c.json({
      users: Number(row?.users ?? 0),
      chats: Number(row?.chats ?? 0),
      dbBytes: await sql.size(),
      today: { chat: await peek(sql, t, 'all:chat'), transcribe: await peek(sql, t, 'all:transcribe'), speak: await peek(sql, t, 'all:speak') },
      byProvider: Object.fromEntries(answers.map(a => [a.key.slice(2), Number(a.n)])),
      lastStepToday: await peek(sql, t, 'last_step'),
    })
  })

  app.post('/internal/prune', async c => c.json(await prune(deps.sql(c.env), now())))

  app.notFound(c => fail(c, 404, 'not_found', 'not_found'))
  app.onError((err, c) => {
    console.error(err)
    return fail(c, 500, 'server', 'server')
  })

  return app
}

/** The daily upkeep: chats older than 180 days, expired sessions and usage counters older than a week. */
export async function prune(sql: Sql, now: number) {
  const chats = await sql.run('DELETE FROM chats WHERE at < ?', now - CHAT_RETENTION_DAYS * 86_400_000)
  const sessions = await sql.run('DELETE FROM sessions WHERE expires_at <= ?', now)
  const counters = await sql.run('DELETE FROM usage WHERE day < ?', istDay(now) - USAGE_DAYS)
  return { chats, sessions, counters }
}
