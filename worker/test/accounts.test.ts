import { describe, expect, it } from 'vitest'
import { normLogin } from '../src/accounts'
import { MESSAGES } from '../src/i18n'
import { sha256hex } from '../src/keys'
import { DAY, ORIGIN, setup } from './helpers'

describe('health and public data', () => {
  it('answers /api/test without D1', async () => {
    const s = setup()
    const res = await s.call('GET', '/api/test')
    expect(res.status).toBe(200)
    expect(res.json).toEqual({ ok: true, service: 'farmsaathi-api' })
  })

  it('lists the six schemes in the asked language, cacheable for a day', async () => {
    const s = setup()
    const en = await s.call('GET', '/api/schemes?lang=en')
    expect(en.status).toBe(200)
    expect(en.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(en.json).toHaveLength(6)
    expect(en.json[0]).toEqual({
      id: 'pm-kisan', category: 'income_support', name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      summary: expect.stringContaining('₹6,000'), eligibility: expect.stringContaining('Small and marginal'),
      howToApply: expect.stringContaining('pmkisan.gov.in'), link: 'https://pmkisan.gov.in',
    })
    const pa = await s.call('GET', '/api/schemes?lang=pa')
    expect(pa.json[0].name).toBe('ਪੀਐਮ-ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ')
    for (const scheme of pa.json) {
      for (const field of ['name', 'summary', 'eligibility', 'howToApply']) expect(scheme[field], `${scheme.id}.${field}`).toMatch(/[਀-੿]/)
    }
    const hi = await s.call('GET', '/api/schemes?lang=hi')
    for (const scheme of hi.json) for (const field of ['name', 'summary', 'eligibility', 'howToApply']) expect(scheme[field]).toMatch(/[ऀ-ॿ]/)
  })

  it('answers unknown routes with a localised 404', async () => {
    const s = setup()
    const res = await s.call('GET', '/api/nope?lang=hi')
    expect(res.status).toBe(404)
    expect(res.json).toEqual({ error: MESSAGES.not_found.hi, code: 'not_found' })
  })
})

describe('CORS and CSRF', () => {
  it('answers a preflight from the app with credentials, and not for other origins', async () => {
    const s = setup()
    const ok = await s.call('OPTIONS', '/api/chat', { headers: { 'access-control-request-method': 'POST' } })
    expect(ok.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(ok.headers.get('access-control-allow-credentials')).toBe('true')
    const local = await s.call('OPTIONS', '/api/chat', { origin: 'http://localhost:5176', headers: { 'access-control-request-method': 'POST' } })
    expect(local.headers.get('access-control-allow-origin')).toBe('http://localhost:5176')
    const evil = await s.call('OPTIONS', '/api/chat', { origin: 'https://evil.example', headers: { 'access-control-request-method': 'POST' } })
    expect(evil.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('refuses state changes without an allowed Origin or with the wrong content type', async () => {
    const s = setup()
    const body = { login: '9876543210', password: 'long enough', lang: 'en' }
    expect((await s.call('POST', '/api/auth/signup', { body, origin: null })).status).toBe(403)
    expect((await s.call('POST', '/api/auth/signup', { body, origin: 'https://evil.example' })).status).toBe(403)
    expect((await s.call('POST', '/api/auth/signup', { body, type: 'text/plain' })).status).toBe(403)
    const form = new FormData()
    form.set('message', 'hi')
    expect((await s.call('POST', '/api/chat', { form })).status).toBe(403)
    // /api/transcribe takes multipart only.
    expect((await s.call('POST', '/api/transcribe', { body: { audio: 'x' } })).status).toBe(403)
    const refused = await s.call('POST', '/api/voice/wake', { origin: null, headers: { 'accept-language': 'pa-IN,pa;q=0.9' } })
    expect(refused.json).toEqual({ error: MESSAGES.forbidden.pa, code: 'forbidden' })
    expect(s.sql.db.prepare('SELECT COUNT(*) AS n FROM users').get()).toEqual({ n: 0 })
  })

  it('sets the safety headers and no-store on API answers', async () => {
    const s = setup()
    const res = await s.call('GET', '/api/auth/me')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})

describe('logins', () => {
  it('normalises Indian mobile numbers and emails', () => {
    for (const v of ['9876543210', '+91 98765 43210', '919876543210', '09876543210', '98765-43210']) expect(normLogin(v)).toBe('+919876543210')
    expect(normLogin(' Kisan@Example.COM ')).toBe('kisan@example.com')
    for (const v of ['12345', '5876543210', '+1 9876543210', '98765432101', 'not an email@', '', null, 42]) expect(normLogin(v)).toBeNull()
  })
})

describe('sign-up, sign-in, sign-out', () => {
  it('signs up with a mobile number, sets the cookie and stores only its SHA-256', async () => {
    const s = setup()
    const res = await s.call('POST', '/api/auth/signup', { body: { login: '+91 98765 43210', password: 'khet-ki-mitti', name: 'Gurpreet', lang: 'pa' } })
    expect(res.status).toBe(201)
    expect(res.json).toEqual({
      user: { id: expect.any(String), login: '+919876543210', createdAt: new Date(s.clock.t).toISOString() },
      profile: { name: 'Gurpreet', lang: 'pa', state: null, district: null, lat: null, lon: null, crops: [], farmSizeAcres: null },
    })
    expect(res.setCookie).toMatch(/fs_session=[A-Za-z0-9_-]{43}/)
    for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=2592000']) expect(res.setCookie).toContain(attr)
    const token = res.cookie!.split('=')[1]
    expect(s.sql.db.prepare('SELECT id FROM sessions').all()).toEqual([{ id: await sha256hex(token) }])
    const dump = JSON.stringify(s.sql.db.prepare('SELECT * FROM users').all())
    expect(dump).not.toContain('khet-ki-mitti')
    expect(dump).toMatch(/pbkdf2_sha256\$100000\$/)

    const me = await s.call('GET', '/api/auth/me', { cookie: res.cookie })
    expect(me.status).toBe(200)
    expect(me.json).toEqual(res.json)
  })

  it('signs up with an email, lower-cased', async () => {
    const s = setup()
    const u = await s.signup(' Kisan@Example.com ')
    expect(u.login).toBe('kisan@example.com')
  })

  it('refuses a taken login (409) and bad input (400) in the farmer\'s language', async () => {
    const s = setup()
    await s.signup('9876543210')
    const again = await s.call('POST', '/api/auth/signup', { body: { login: '+919876543210', password: 'another-one', lang: 'hi' } })
    expect(again.status).toBe(409)
    expect(again.json).toEqual({ error: MESSAGES.login_taken.hi, code: 'conflict' })
    const badLogin = await s.call('POST', '/api/auth/signup', { body: { login: '12345', password: 'long enough', lang: 'pa' } })
    expect(badLogin.status).toBe(400)
    expect(badLogin.json).toEqual({ error: MESSAGES.bad_login.pa, code: 'bad_request' })
    const short = await s.call('POST', '/api/auth/signup', { body: { login: '9123456789', password: 'short', lang: 'en' } })
    expect(short.json).toEqual({ error: MESSAGES.short_password.en, code: 'bad_request' })
  })

  it('signs in with the number written any way, and answers wrong and unknown logins the same', async () => {
    const s = setup()
    const u = await s.signup('9876543210', 'khet-ki-mitti')
    const ok = await s.call('POST', '/api/auth/login', { body: { login: '098765 43210', password: 'khet-ki-mitti' } })
    expect(ok.status).toBe(200)
    expect(ok.json.user.id).toBe(u.id)
    expect(ok.cookie).toBeDefined()
    const wrong = await s.call('POST', '/api/auth/login', { body: { login: '9876543210', password: 'wrong-password' } })
    const unknown = await s.call('POST', '/api/auth/login', { body: { login: '9000000000', password: 'wrong-password' } })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.json).toEqual(unknown.json)
    expect(wrong.json.code).toBe('unauthenticated')
    expect(wrong.cookie).toBeUndefined()
  })

  it('can lower the PBKDF2 rounds for new hashes while old hashes keep working', async () => {
    const s = setup()
    const old = await s.signup('9876543210', 'khet-ki-mitti')
    s.env.PASSWORD_ITERATIONS = '20000'
    await s.signup('9123456789', 'naya-password')
    const hashes = (s.sql.db.prepare('SELECT pass_hash FROM users ORDER BY created_at, login').all() as { pass_hash: string }[]).map(r => r.pass_hash.split('$')[1])
    expect(hashes.sort()).toEqual(['100000', '20000'])
    expect((await s.call('POST', '/api/auth/login', { body: { login: old.login, password: 'khet-ki-mitti' } })).status).toBe(200)
    expect((await s.call('POST', '/api/auth/login', { body: { login: '9123456789', password: 'naya-password' } })).status).toBe(200)
  })

  it('rate-limits sign-ins with the LOGIN_LIMITER binding', async () => {
    let n = 0
    const s = setup({ LOGIN_LIMITER: { limit: async () => ({ success: ++n <= 5 }) } })
    for (let i = 0; i < 5; i++) expect((await s.call('POST', '/api/auth/login', { body: { login: '9876543210', password: 'x' } })).status).toBe(401)
    const sixth = await s.call('POST', '/api/auth/login', { body: { login: '9876543210', password: 'x', lang: 'hi' } })
    expect(sixth.status).toBe(429)
    expect(sixth.json).toEqual({ error: MESSAGES.too_many_tries.hi, code: 'rate_limited', retryAfter: 60 })
  })

  it('signs out (the session row goes) and sessions expire after 30 days', async () => {
    const s = setup()
    const u = await s.signup()
    const out = await s.call('POST', '/api/auth/logout', { cookie: u.cookie })
    expect(out.status).toBe(204)
    expect(out.setCookie).toContain('fs_session=;')
    expect((await s.call('GET', '/api/auth/me', { cookie: u.cookie })).status).toBe(401)

    const v = await s.signup('9123456789')
    s.clock.t += 31 * DAY
    const me = await s.call('GET', '/api/auth/me', { cookie: v.cookie })
    expect(me.status).toBe(401)
    expect(me.json.code).toBe('unauthenticated')
  })

  it('slides an active session forward', async () => {
    const s = setup()
    const u = await s.signup()
    s.clock.t += 20 * DAY
    expect((await s.call('GET', '/api/auth/me', { cookie: u.cookie })).status).toBe(200)
    s.clock.t += 20 * DAY
    expect((await s.call('GET', '/api/auth/me', { cookie: u.cookie })).status).toBe(200)
  })
})

describe('profile and account', () => {
  it('updates the profile and checks every field', async () => {
    const s = setup()
    const u = await s.signup()
    const res = await s.call('PATCH', '/api/me', {
      cookie: u.cookie,
      body: { name: 'Ramesh', lang: 'hi', state: 'Punjab', district: 'Ludhiana', lat: 30.9, lon: 75.85, crops: ['wheat', 'rice', 'wheat'], farmSizeAcres: 4.5, extra: 'ignored' },
    })
    expect(res.status).toBe(200)
    expect(res.json.profile).toEqual({ name: 'Ramesh', lang: 'hi', state: 'Punjab', district: 'Ludhiana', lat: 30.9, lon: 75.85, crops: ['wheat', 'rice'], farmSizeAcres: 4.5 })
    const partial = await s.call('PATCH', '/api/me', { cookie: u.cookie, body: { district: null } })
    expect(partial.json.profile).toMatchObject({ name: 'Ramesh', district: null, crops: ['wheat', 'rice'] })
    for (const bad of [{ lang: 'fr' }, { lat: 200 }, { crops: 'wheat' }, { farmSizeAcres: -1 }, { name: '<b>x</b>' }, { crops: Array(21).fill('x') }]) {
      const r = await s.call('PATCH', '/api/me', { cookie: u.cookie, body: bad })
      expect(r.status, JSON.stringify(bad)).toBe(400)
      expect(r.json.error).toBe(MESSAGES.bad_profile.en)
    }
    expect((await s.call('PATCH', '/api/me', { body: { name: 'x' } })).status).toBe(401)
  })

  it('deletes the account and everything in it, only with the password', async () => {
    const s = setup()
    const u = await s.signup()
    await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns: [turn('t1', 0)] } })
    const wrong = await s.call('DELETE', '/api/me', { cookie: u.cookie, body: { password: 'nope-nope', lang: 'pa' } })
    expect(wrong.status).toBe(403)
    expect(wrong.json).toEqual({ error: MESSAGES.wrong_password.pa, code: 'forbidden' })
    const ok = await s.call('DELETE', '/api/me', { cookie: u.cookie, body: { password: u.password } })
    expect(ok.status).toBe(204)
    for (const table of ['users', 'sessions', 'chats']) expect(s.sql.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).toEqual({ n: 0 })
    expect((await s.call('GET', '/api/auth/me', { cookie: u.cookie })).status).toBe(401)
  })
})

function turn(id: string, minutesAgo: number, extra: Record<string, unknown> = {}) {
  return {
    id, at: new Date(Date.UTC(2026, 8, 30, 11, 0, 0) - minutesAgo * 60_000).toISOString(), lang: 'hi',
    question: `सवाल ${id}`, answer: `जवाब ${id}`, sources: [{ id: 'pm-kisan', kind: 'scheme', title: 'पीएम-किसान सम्मान निधि' }], ...extra,
  }
}

describe('saved chats and the guest import', () => {
  it('imports a guest\'s turns, idempotently, and lists them newest first in pages of 50', async () => {
    const s = setup()
    const u = await s.signup()
    const turns = Array.from({ length: 120 }, (_, i) => turn(`g${String(i).padStart(3, '0')}`, i))
    const res = await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns } })
    expect(res.status).toBe(204)
    expect((await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns: turns.slice(0, 10) } })).status).toBe(204)

    const p1 = await s.call('GET', '/api/me/chats', { cookie: u.cookie })
    expect(p1.json.chats).toHaveLength(50)
    expect(p1.json.more).toBe(true)
    expect(p1.json.chats[0]).toEqual(turn('g000', 0))
    const p2 = await s.call('GET', `/api/me/chats?before=${p1.json.chats[49].id}`, { cookie: u.cookie })
    expect(p2.json.chats[0].id).toBe('g050')
    const p3 = await s.call('GET', `/api/me/chats?before=${p2.json.chats[49].id}`, { cookie: u.cookie })
    expect(p3.json.chats).toHaveLength(20)
    expect(p3.json.more).toBe(false)
    expect(s.sql.db.prepare('SELECT COUNT(*) AS n FROM chats').get()).toEqual({ n: 120 })
  })

  it('refuses a batch with any bad turn, more than 200 turns, or no session', async () => {
    const s = setup()
    const u = await s.signup()
    for (const bad of [turn('ok', 1, { lang: 'fr' }), turn('ok', 1, { at: 'yesterday' }), turn('has space', 1), turn('ok', 1, { question: '' }), turn('ok', 1, { sources: [{ id: 'x', kind: 'web', title: 't' }] })]) {
      const r = await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns: [turn('good', 0), bad], lang: 'hi' } })
      expect(r.status).toBe(400)
      expect(r.json.error).toBe(MESSAGES.bad_import.hi)
    }
    expect(s.sql.db.prepare('SELECT COUNT(*) AS n FROM chats').get()).toEqual({ n: 0 })
    const many = Array.from({ length: 201 }, (_, i) => turn(`m${i}`, i))
    expect((await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns: many } })).status).toBe(400)
    expect((await s.call('POST', '/api/me/chats/import', { body: { turns: [turn('a', 1)] } })).status).toBe(401)
    expect((await s.call('GET', '/api/me/chats')).status).toBe(401)
  })

  it('keeps each account\'s chats apart', async () => {
    const s = setup()
    const a = await s.signup('9876543210'), b = await s.signup('9123456789')
    await s.call('POST', '/api/me/chats/import', { cookie: a.cookie, body: { turns: [turn('same-id', 1)] } })
    await s.call('POST', '/api/me/chats/import', { cookie: b.cookie, body: { turns: [turn('same-id', 1, { question: 'B asks' })] } })
    expect((await s.call('GET', '/api/me/chats', { cookie: a.cookie })).json.chats[0].question).toBe('सवाल same-id')
    expect((await s.call('GET', '/api/me/chats', { cookie: b.cookie })).json.chats[0].question).toBe('B asks')
  })
})
