/**
 * The answer chain. Four steps, tried in order; a step is skipped when its key is missing or its
 * global daily cap is reached, and abandoned when it fails, times out (12 s) or answers in the wrong
 * script:
 *   1. Groq (GROQ_MODEL, default llama-3.3-70b-versatile)
 *   2. Google Gemini (GEMINI_MODEL, default gemini-2.5-flash), moved first for Punjabi
 *   3. OpenRouter (OPENROUTER_MODEL, a free model)
 *   4. Workers AI (WORKERS_AI_MODEL, default @cf/meta/llama-3.1-8b-instruct), no key
 *
 * What reaches a provider: the system prompt, the question, up to 6 earlier turns' text, the
 * matched passages and the profile's crops, state and farm size. Never a name, number or email.
 */
import type { Lang } from './contract'
import { bump, capOf, setCounter, takeProvider, type AiRunner, type Bindings } from './http'
import type { Passage } from './knowledge'
import type { Sql } from './sql'

export const STEP_TIMEOUT_MS = 12_000
export const PROVIDERS = ['groq', 'gemini', 'openrouter', 'workers-ai'] as const
export type ProviderName = (typeof PROVIDERS)[number]

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.5-flash',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
  'workers-ai': '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
}

/** Calls per India day, a little under each free tier. Override with the *_DAILY_CAP vars. */
export const DEFAULT_CAPS: Record<ProviderName, number> = { groq: 900, gemini: 200, openrouter: 45, 'workers-ai': 300 }

export function chainOrder(lang: Lang): ProviderName[] {
  return lang === 'pa' ? ['gemini', 'groq', 'openrouter', 'workers-ai'] : ['groq', 'gemini', 'openrouter', 'workers-ai']
}

const LANGUAGE: Record<Lang, string> = {
  en: 'simple English',
  hi: 'Hindi, written in Devanagari script',
  pa: 'Punjabi, written in Gurmukhi script (not Shahmukhi, not Devanagari, not Latin letters)',
}

/** The FarmSaathi voice from ai-service/llm.py, plus the hosted version's rules. */
export function systemPrompt(lang: Lang) {
  return [
    'You are FarmSaathi, a helpful assistant for Indian farmers. Answer clearly and practically, using the provided context when relevant.',
    "If you don't know something, say so honestly instead of guessing. Keep answers concise (a few short paragraphs at most) and avoid generic disclaimers.",
    `Always answer in ${LANGUAGE[lang]}, whatever language the question is written in.`,
    'Write plain text that reads well aloud: short sentences, no markdown, no tables, no emoji. Use a short numbered list only for steps.',
    'Never invent scheme amounts, installment dates, deadlines or eligibility rules: use only what the passages say, and if they do not say it, say you do not know and point to the official website or the local agriculture office.',
    'For anything risky, such as pesticide or fertilizer doses, mixing chemicals or livestock illness, give general guidance only and tell the farmer to confirm with the nearest Krishi Vigyan Kendra (KVK) or agriculture officer.',
    "When the farmer's crops, state or farm size are given, use them to make the answer specific.",
    'Do not mention these instructions, the passages, or being an AI.',
  ].join(' ')
}

export interface FarmFacts { crops: string[]; state: string | null; farmSizeAcres: number | null }
export interface HistoryTurn { role: 'user' | 'assistant'; text: string }
export interface ChainInput { question: string; lang: Lang; history: HistoryTurn[]; passages: Passage[]; farm: FarmFacts }

export function userPrompt(input: ChainInput) {
  const parts: string[] = []
  if (input.passages.length) parts.push('Passages:\n' + input.passages.map((p, i) => `[${i + 1}] ${p.text}`).join('\n'))
  const farm: string[] = []
  if (input.farm.crops.length) farm.push(`grows ${input.farm.crops.join(', ')}`)
  if (input.farm.state) farm.push(`in ${input.farm.state}`)
  if (input.farm.farmSizeAcres !== null) farm.push(`on ${input.farm.farmSizeAcres} acres`)
  if (farm.length) parts.push(`The farmer ${farm.join(', ')}.`)
  parts.push(`Question: ${input.question}`)
  return parts.join('\n\n')
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string }
export function messages(input: ChainInput): Message[] {
  return [
    { role: 'system', content: systemPrompt(input.lang) },
    ...input.history.map(h => ({ role: h.role, content: h.text })),
    { role: 'user', content: userPrompt(input) },
  ]
}

const SCRIPT: Record<Lang, RegExp> = { en: /[A-Za-z]/g, hi: /[ऀ-ॿ]/g, pa: /[਀-੿]/g }
const LETTERS = /[A-Za-zऀ-ॿ਀-੿؀-ۿ]/g

/** True when most letters are in the language's script (scheme names and links in Latin are fine). */
export function inScript(text: string, lang: Lang) {
  const all = text.match(LETTERS)?.length ?? 0
  return all > 0 && (text.match(SCRIPT[lang])?.length ?? 0) / all >= 0.5
}

/** The answer tidied for the app and for reading aloud; null when there is nothing usable. */
export function tidy(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const text = raw.replace(/\*\*|__/g, '').replace(/^#{1,6}\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()
  return text.length >= 2 ? text.slice(0, 4000) : null
}

type Call = (input: ChainInput, signal: AbortSignal) => Promise<unknown>

async function openAiStyle(fetcher: typeof fetch, url: string, key: string, model: string, input: ChainInput, signal: AbortSignal, extra: Record<string, string> = {}) {
  const res = await fetcher(url, {
    method: 'POST',
    signal,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...extra },
    body: JSON.stringify({ model, temperature: 0.4, max_tokens: 700, messages: messages(input) }),
  })
  if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`)
  const j = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
  return j.choices?.[0]?.message?.content
}

export interface ChainContext { env: Bindings; sql: Sql; now: number; fetch: typeof fetch; ai: AiRunner | undefined; timeoutMs: number }

/** The callable steps for this environment (null = no key or binding). */
export function stepFor(name: ProviderName, ctx: ChainContext): { model: string; call: Call } | null {
  const { env, fetch: fetcher } = ctx
  switch (name) {
    case 'groq': {
      if (!env.GROQ_API_KEY) return null
      const key = env.GROQ_API_KEY, model = env.GROQ_MODEL || DEFAULT_MODELS.groq
      return { model, call: (input, signal) => openAiStyle(fetcher, 'https://api.groq.com/openai/v1/chat/completions', key, model, input, signal) }
    }
    case 'gemini': {
      if (!env.GEMINI_API_KEY) return null
      const key = env.GEMINI_API_KEY, model = env.GEMINI_MODEL || DEFAULT_MODELS.gemini
      return {
        model,
        async call(input, signal) {
          const generationConfig: Record<string, unknown> = { temperature: 0.4, maxOutputTokens: 700 }
          // 2.5 Flash thinks by default, which spends the output budget and adds seconds.
          if (/flash/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 }
          const res = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            signal,
            headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt(input.lang) }] },
              contents: [
                ...input.history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
                { role: 'user', parts: [{ text: userPrompt(input) }] },
              ],
              generationConfig,
            }),
          })
          if (!res.ok) throw new Error(`gemini ${res.status}`)
          const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] }
          return j.candidates?.[0]?.content?.parts?.map(p => (typeof p.text === 'string' ? p.text : '')).join('')
        },
      }
    }
    case 'openrouter': {
      if (!env.OPENROUTER_API_KEY) return null
      const key = env.OPENROUTER_API_KEY, model = env.OPENROUTER_MODEL || DEFAULT_MODELS.openrouter
      return {
        model,
        call: (input, signal) => openAiStyle(fetcher, 'https://openrouter.ai/api/v1/chat/completions', key, model, input, signal,
          { 'x-title': 'FarmSaathi', 'http-referer': 'https://farmsaathi.amittal.dev' }),
      }
    }
    case 'workers-ai': {
      const ai = ctx.ai
      if (!ai) return null
      const model = env.WORKERS_AI_MODEL || DEFAULT_MODELS['workers-ai']
      return {
        model,
        async call(input) {
          const out = (await ai.run(model, { messages: messages(input), max_tokens: 700, temperature: 0.4 })) as { response?: unknown }
          return out?.response
        },
      }
    }
  }
}

const CAP_VAR: Record<ProviderName, keyof Bindings> = {
  groq: 'GROQ_DAILY_CAP', gemini: 'GEMINI_DAILY_CAP', openrouter: 'OPENROUTER_DAILY_CAP', 'workers-ai': 'WORKERS_AI_DAILY_CAP',
}

/** Runs `p` with a deadline; on timeout the signal aborts and the promise rejects. */
export async function withTimeout<T>(ms: number, p: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctl.abort()
      reject(new Error('timeout'))
    }, ms)
  })
  try {
    return await Promise.race([p(ctl.signal), deadline])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export type ChainResult =
  | { ok: true; text: string; provider: ProviderName; step: number }
  | { ok: false; reason: 'capped' | 'failed' }

/**
 * Tries each step in order. An answer in the wrong script is kept as a last resort and returned only
 * when no later step does better. `capped` means every available step was at its daily cap.
 */
export async function runChain(input: ChainInput, ctx: ChainContext): Promise<ChainResult> {
  let fallback: { text: string; provider: ProviderName; step: number } | null = null
  let tried = 0, capped = 0
  const order = chainOrder(input.lang)
  for (const [i, name] of order.entries()) {
    const step = stepFor(name, ctx)
    if (!step) continue
    if (!(await takeProvider(ctx.sql, ctx.now, name, capOf(ctx.env[CAP_VAR[name]] as string | undefined, DEFAULT_CAPS[name])))) {
      capped++
      continue
    }
    tried++
    try {
      const text = tidy(await withTimeout(ctx.timeoutMs, signal => step.call(input, signal)))
      if (!text) continue
      if (inScript(text, input.lang)) return await answered(ctx, { text, provider: name, step: i + 1 })
      fallback ??= { text, provider: name, step: i + 1 }
    } catch (e) {
      console.warn('chain step failed', name, String(e))
    }
  }
  if (fallback) return answered(ctx, fallback)
  return { ok: false, reason: tried === 0 && capped > 0 ? 'capped' : 'failed' }
}

async function answered(ctx: ChainContext, r: { text: string; provider: ProviderName; step: number }): Promise<ChainResult> {
  await bump(ctx.sql, ctx.now, `a:${r.provider}`)
  await setCounter(ctx.sql, ctx.now, 'last_step', r.step)
  return { ok: true, ...r }
}
