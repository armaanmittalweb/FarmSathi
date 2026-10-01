/**
 * POST /api/chat: retrieval over the 14 passages, then the answer chain (chain.ts). A signed-in
 * farmer's turn is saved and their stored profile is used; a guest's profile comes with the request.
 * Either way only crops, state and farm size reach a provider.
 */
import type { ChatReply, Lang } from './contract'
import { MAX_QUESTION, profileOf, type UserRow } from './accounts'
import { runChain, STEP_TIMEOUT_MS, type FarmFacts, type HistoryTurn } from './chain'
import { capOf, fail, langOf, readJson, secondsToNextDay, setLang, takeVisitor, type App, type Ctx, type Deps } from './http'
import { isLang } from './i18n'
import { DEFAULT_EMBED_MODEL, DEFAULT_MIN_SCORE, Knowledge, sourceFor } from './knowledge'

export const HISTORY_TURNS = 6
const MAX_HISTORY_TEXT = 4000

/** Up to the last 6 well-formed turns; anything else in `history` is dropped. */
export function historyOf(v: unknown): HistoryTurn[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((h): h is HistoryTurn => !!h && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string' && h.text.trim().length > 0)
    .slice(-HISTORY_TURNS)
    .map(h => ({ role: h.role, text: h.text.trim().slice(0, MAX_HISTORY_TEXT) }))
}

/** Crops, state and farm size from a guest's profile, each dropped if malformed. Nothing else is read. */
export function farmOf(v: unknown): FarmFacts {
  const p = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const crops = Array.isArray(p.crops) ? p.crops.filter((x): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= 40).slice(0, 20).map(x => x.trim()) : []
  const state = typeof p.state === 'string' && p.state.trim() && p.state.length <= 60 ? p.state.trim() : null
  const size = p.farmSizeAcres
  const farmSizeAcres = typeof size === 'number' && Number.isFinite(size) && size >= 0 && size <= 100_000 ? size : null
  return { crops, state, farmSizeAcres }
}

export function chatRoutes(app: App, deps: Deps) {
  const now = deps.now ?? Date.now
  const knowledge = new Knowledge()

  app.post('/api/chat', async (c: Ctx) => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    if (!b) return fail(c, 400, 'bad_request', 'bad_request')
    const lang: Lang = isLang(b.lang) ? b.lang : langOf(c)
    const question = typeof b.message === 'string' ? b.message.trim() : ''
    if (!question) return fail(c, 400, 'bad_request', 'empty_question')
    if (question.length > MAX_QUESTION) return fail(c, 400, 'bad_request', 'long_question')

    const sql = deps.sql(c.env), t = now(), user = c.get('user')
    let farm = farmOf(b.profile)
    if (user) {
      const [row] = await sql.all<UserRow>('SELECT * FROM users WHERE id = ?', user.id)
      if (row) {
        const p = profileOf(row)
        farm = { crops: p.crops, state: p.state, farmSizeAcres: p.farmSizeAcres }
      }
    }
    if (!(await takeVisitor(c, sql, t, 'chat'))) return fail(c, 429, 'rate_limited', 'chat_limit', { retryAfter: secondsToNextDay(t) })

    const ai = deps.ai ? deps.ai(c.env) : c.env.AI
    const matches = await knowledge.retrieve(question, sql, ai, c.env.EMBED_MODEL || DEFAULT_EMBED_MODEL, capOf(c.env.RAG_MIN_SCORE, DEFAULT_MIN_SCORE))
    const result = await runChain(
      { question, lang, history: historyOf(b.history), passages: matches.map(m => m.passage), farm },
      { env: c.env, sql, now: t, fetch: deps.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a)), ai, timeoutMs: deps.stepTimeoutMs ?? STEP_TIMEOUT_MS },
    )
    if (!result.ok) {
      return result.reason === 'capped'
        ? fail(c, 429, 'rate_limited', 'all_capped', { retryAfter: secondsToNextDay(t) })
        : fail(c, 503, 'unavailable', 'chat_unavailable')
    }

    const sources = matches.map(m => sourceFor(m.passage, lang)).filter(s => s !== null)
    let turnId: string | null = null
    if (user) {
      turnId = crypto.randomUUID()
      await sql.run('INSERT INTO chats (user_id, id, at, lang, question, answer, sources) VALUES (?, ?, ?, ?, ?, ?, ?)',
        user.id, turnId, t, lang, question, result.text, JSON.stringify(sources))
    }
    const reply: ChatReply = { text: result.text, lang, sources, provider: result.provider, turnId }
    return c.json(reply)
  })
}
