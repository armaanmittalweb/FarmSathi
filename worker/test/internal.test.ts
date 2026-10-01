import { describe, expect, it } from 'vitest'
import { prune } from '../src/app'
import { istDay } from '../src/http'
import { DAY, setup } from './helpers'

const KEY = { 'x-internal-key': 'internal-key' }

describe('/internal/*', () => {
  it('is a 404 without the right key, or when no key is configured', async () => {
    const s = setup()
    for (const headers of [{}, { 'x-internal-key': 'wrong' }] as Record<string, string>[]) {
      expect((await s.call('GET', '/internal/stats', { headers })).status).toBe(404)
      expect((await s.call('POST', '/internal/prune', { headers })).status).toBe(404)
    }
    const open = setup({ INTERNAL_KEY: undefined })
    expect((await open.call('GET', '/internal/stats', { headers: { 'x-internal-key': '' } })).status).toBe(404)
  })

  it('reports users, chats, size and today\'s use', async () => {
    const s = setup()
    const u = await s.signup()
    await s.call('POST', '/api/chat', { cookie: u.cookie, body: { message: 'PM-KISAN?', lang: 'en' } })
    await s.call('POST', '/api/chat', { body: { message: 'Drip?', lang: 'hi' } })
    const res = await s.call('GET', '/internal/stats', { headers: KEY })
    expect(res.status).toBe(200)
    expect(res.json).toEqual({
      users: 1, chats: 1, dbBytes: 4096,
      today: { chat: 2, transcribe: 0, speak: 0 },
      byProvider: { 'workers-ai': 2 },
      lastStepToday: 4,
    })
  })

  it('prunes chats older than 180 days, expired sessions and week-old counters', async () => {
    const s = setup()
    const u = await s.signup()
    const at = (daysAgo: number) => new Date(s.clock.t - daysAgo * DAY).toISOString()
    const turn = (id: string, daysAgo: number) => ({ id, at: at(daysAgo), lang: 'en', question: 'q', answer: 'a', sources: [] })
    await s.call('POST', '/api/me/chats/import', { cookie: u.cookie, body: { turns: [turn('old', 181), turn('recent', 179)] } })
    s.sql.db.prepare('INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)').run('expired', u.id, 0, 0, s.clock.t - 1)
    s.sql.db.prepare('INSERT INTO usage (day, key, n) VALUES (?, ?, ?), (?, ?, ?)').run(istDay(s.clock.t) - 8, 'all:chat', 3, istDay(s.clock.t) - 1, 'all:chat', 4)

    const res = await s.call('POST', '/internal/prune', { headers: KEY })
    expect(res.json).toEqual({ chats: 1, sessions: 1, counters: 1 })
    expect(s.sql.db.prepare('SELECT id FROM chats').all()).toEqual([{ id: 'recent' }])
    expect((await s.call('GET', '/api/auth/me', { cookie: u.cookie })).status).toBe(200)
    expect(await prune(s.sql, s.clock.t)).toEqual({ chats: 0, sessions: 0, counters: 0 })
  })
})
