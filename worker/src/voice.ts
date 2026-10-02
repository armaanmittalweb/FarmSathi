/**
 * Voice: speech to text, text to speech and the wake-up call.
 *
 * Speech to text: Hindi and Punjabi go to AI4Bharat's IndicConformer on the voice container first
 * (Whisper garbles Punjabi and can repeat a phrase until the text runs past the question limit),
 * then Groq Whisper, then Workers AI Whisper. English starts at Groq. A transcript that loops is
 * never passed on: the next step is tried, and if none hears it cleanly the app gets empty text and
 * asks the farmer to speak again.
 *
 * Text to speech: the voice container (MMS-TTS), cached 30 days in the Cache API; 503 with fallback
 * 'device' when it is asleep, busy or failing, so the app uses the phone's own voice.
 */
import { MAX_QUESTION } from './accounts'
import { withTimeout } from './chain'
import type { Lang } from './contract'
import {
  background, bump, capOf, fail, langOf, readJson, secondsToNextDay, setLang, takeProvider, takeVisitor,
  type AiRunner, type App, type Ctx, type Deps, type SpeakCache,
} from './http'
import { isLang } from './i18n'
import { sha256hex } from './keys'

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024
export const MAX_SPEAK_CHARS = 600
export const SPEAK_CACHE_SECONDS = 30 * 86_400
export const VOICE_TIMEOUT_MS = 25_000
export const WAKE_TIMEOUT_MS = 25_000
export const DEFAULT_STT_MODELS = { groq: 'whisper-large-v3-turbo', 'workers-ai': '@cf/openai/whisper-large-v3-turbo' }
export const DEFAULT_STT_CAPS = { indic: 2000, groq: 1800, 'workers-ai': 300 }
/** The languages the voice container's IndicConformer models hear. */
export const INDIC_STT: readonly Lang[] = ['hi', 'pa']

/** True when a transcript can't be a question: longer than the question limit, or the same word or
 *  phrase (up to 8 words) five or more times in a row, which is Whisper stuck in a loop. */
export function unusable(text: string): boolean {
  if (text.length > MAX_QUESTION) return true
  const w = text.toLowerCase().split(/[\s,.;:!?।]+/u).filter(Boolean)
  const same = (a: number, b: number, n: number) => { for (let j = 0; j < n; j++) if (w[a + j] !== w[b + j]) return false; return true }
  for (let n = 1; n <= 8; n++) {
    for (let i = 0; i + 5 * n <= w.length; i++) {
      let k = 1
      while (i + (k + 1) * n <= w.length && same(i, i + k * n, n)) k++
      if (k >= 5) return true
    }
  }
  return false
}

/** The recorder formats the app may send (MediaRecorder on Android Chrome, iOS Safari, or WAV). */
const AUDIO_TYPES: Record<string, string> = {
  'audio/webm': 'webm', 'video/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'video/mp4': 'mp4',
  'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/vnd.wave': 'wav',
}

export function toBase64(bytes: Uint8Array) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const textOf = (v: unknown) => (typeof (v as { text?: unknown })?.text === 'string' ? ((v as { text: string }).text).trim() : null)

export function voiceRoutes(app: App, deps: Deps) {
  const now = deps.now ?? Date.now
  const fetcher = (...a: Parameters<typeof fetch>) => (deps.fetch ?? fetch)(...a)
  const aiOf = (c: Ctx): AiRunner | undefined => (deps.ai ? deps.ai(c.env) : c.env.AI)
  const cacheOf = (): SpeakCache | undefined => {
    if (deps.cache) return deps.cache()
    return (globalThis as { caches?: { default?: SpeakCache } }).caches?.default
  }
  const stepMs = deps.stepTimeoutMs ?? 12_000
  const voiceMs = deps.voiceTimeoutMs ?? VOICE_TIMEOUT_MS
  let lastWake = 0

  app.post('/api/transcribe', async c => {
    if (Number(c.req.header('content-length') ?? 0) > MAX_AUDIO_BYTES + 64 * 1024) return fail(c, 413, 'too_large', 'long_audio')
    let form: FormData
    try {
      form = await c.req.formData()
    } catch {
      return fail(c, 400, 'bad_request', 'bad_audio')
    }
    const langField = form.get('lang')
    setLang(c, langField)
    const lang: Lang = isLang(langField) ? langField : langOf(c)
    const audio = form.get('audio')
    if (!audio || typeof audio === 'string' || audio.size === 0) return fail(c, 400, 'bad_request', 'no_audio')
    if (audio.size > MAX_AUDIO_BYTES) return fail(c, 413, 'too_large', 'long_audio')
    const ext = AUDIO_TYPES[(audio.type || '').split(';')[0].trim().toLowerCase()]
    if (!ext) return fail(c, 400, 'bad_request', 'bad_audio')

    const sql = deps.sql(c.env), t = now()
    if (!(await takeVisitor(c, sql, t, 'transcribe'))) return fail(c, 429, 'rate_limited', 'transcribe_limit', { retryAfter: secondsToNextDay(t) })

    const bytes = new Uint8Array(await audio.arrayBuffer())
    const base = c.env.VOICE_URL?.replace(/\/+$/, ''), voiceKey = c.env.VOICE_KEY
    let tried = 0, capped = 0, unclear = 0

    /** One provider: null to move on to the next, or the response to send. */
    const step = async (provider: string, cap: number, ms: number, hear: (signal: AbortSignal) => Promise<string | null>) => {
      if (!(await takeProvider(sql, t, provider, cap))) { capped++; return null }
      tried++
      try {
        const text = await withTimeout(ms, hear)
        if (text === null) return null
        if (unusable(text)) {
          unclear++
          await bump(sql, t, 'stt:unusable')
          console.warn('stt step unusable', provider, text.length)
          return null
        }
        await bump(sql, t, `a:${provider}`)
        return c.json({ text, lang })
      } catch (e) {
        console.warn('stt step failed', provider, String(e))
        return null
      }
    }

    // 1. IndicConformer on the voice container, for Hindi and Punjabi. A cold container gets the
    //    voice timeout (the app wakes it when Ask opens, so it is usually up).
    if (INDIC_STT.includes(lang) && base && voiceKey) {
      const res = await step('indic-stt', capOf(c.env.INDIC_STT_DAILY_CAP, DEFAULT_STT_CAPS.indic), voiceMs, async signal => {
        const r = await fetcher(`${base}/transcribe?lang=${lang}`, {
          method: 'POST', signal, headers: { 'x-voice-key': voiceKey, 'content-type': audio.type || 'application/octet-stream' }, body: bytes,
        })
        if (!r.ok) throw new Error(`indic stt ${r.status}`)
        return textOf(await r.json())
      })
      if (res) return res
    }
    // 2. Groq Whisper
    if (c.env.GROQ_API_KEY) {
      const res = await step('groq-stt', capOf(c.env.GROQ_STT_DAILY_CAP, DEFAULT_STT_CAPS.groq), stepMs, async signal => {
        const body = new FormData()
        body.set('file', new Blob([bytes], { type: audio.type }), `audio.${ext}`)
        body.set('model', c.env.GROQ_STT_MODEL || DEFAULT_STT_MODELS.groq)
        body.set('language', lang)
        body.set('response_format', 'json')
        body.set('temperature', '0')
        const r = await fetcher('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST', signal, headers: { authorization: `Bearer ${c.env.GROQ_API_KEY}` }, body,
        })
        if (!r.ok) throw new Error(`groq stt ${r.status}`)
        return textOf(await r.json())
      })
      if (res) return res
    }
    // 3. Workers AI Whisper
    const ai = aiOf(c)
    if (ai) {
      const res = await step('workers-ai-stt', capOf(c.env.WORKERS_AI_STT_DAILY_CAP, DEFAULT_STT_CAPS['workers-ai']), stepMs, async () =>
        textOf(await ai.run(c.env.WORKERS_AI_STT_MODEL || DEFAULT_STT_MODELS['workers-ai'], { audio: toBase64(bytes), language: lang, task: 'transcribe' })))
      if (res) return res
    }
    if (tried === 0 && capped > 0) return fail(c, 429, 'rate_limited', 'voice_capped', { retryAfter: secondsToNextDay(t) })
    // Something heard the recording but only as a loop: the app asks the farmer to speak again.
    if (unclear > 0) return c.json({ text: '', lang })
    return fail(c, 503, 'unavailable', 'transcribe_unavailable')
  })

  app.post('/api/speak', async c => {
    const b = await readJson(c)
    setLang(c, b?.lang)
    const lang: Lang = isLang(b?.lang) ? b.lang : langOf(c)
    const text = typeof b?.text === 'string' ? b.text.trim() : ''
    if (!text || text.length > MAX_SPEAK_CHARS) return fail(c, 400, 'bad_request', 'bad_speak_text')
    const unavailable = () => fail(c, 503, 'unavailable', 'voice_unavailable', { fallback: 'device' })

    const cache = cacheOf()
    const key = new Request(`${new URL(c.req.url).origin}/__speak/${await sha256hex(lang + text)}`)
    // A cached clip costs nothing, so it does not count towards the visitor's 60 a day.
    const hit = await cache?.match(key).catch(() => undefined)
    if (hit) return new Response(hit.body, { headers: { 'content-type': 'audio/wav', 'cache-control': 'private, max-age=86400', 'x-speak-cache': 'hit' } })

    const sql = deps.sql(c.env), t = now()
    if (!(await takeVisitor(c, sql, t, 'speak'))) return fail(c, 429, 'rate_limited', 'speak_limit', { retryAfter: secondsToNextDay(t), fallback: 'device' })
    const base = c.env.VOICE_URL?.replace(/\/+$/, ''), voiceKey = c.env.VOICE_KEY
    if (!base || !voiceKey) return unavailable()

    let audio: ArrayBuffer
    try {
      audio = await withTimeout(voiceMs, async signal => {
        const res = await fetcher(`${base}/speak`, {
          method: 'POST', signal,
          headers: { 'x-voice-key': voiceKey, 'content-type': 'application/json' },
          body: JSON.stringify({ text, lang }),
        })
        if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('audio/')) throw new Error(`voice ${res.status}`)
        const buf = await res.arrayBuffer()
        if (buf.byteLength < 44) throw new Error('voice: empty clip')
        return buf
      })
    } catch (e) {
      console.warn('speak failed', String(e))
      return unavailable()
    }
    await bump(sql, t, 'a:voice')
    if (cache) {
      background(c, cache.put(key, new Response(audio.slice(0), {
        headers: { 'content-type': 'audio/wav', 'cache-control': `public, max-age=${SPEAK_CACHE_SECONDS}` },
      })))
    }
    return new Response(audio, { headers: { 'content-type': 'audio/wav', 'cache-control': 'private, max-age=86400', 'x-speak-cache': 'miss' } })
  })

  // The app calls this when the Ask tab opens, so a sleeping Space is starting by the time it is needed.
  app.post('/api/voice/wake', async c => {
    const base = c.env.VOICE_URL?.replace(/\/+$/, ''), t = now()
    if (base && t - lastWake > 60_000) {
      lastWake = t
      background(c, withTimeout(WAKE_TIMEOUT_MS, signal => fetcher(`${base}/health`, { signal })))
    }
    return c.body(null, 202)
  })
}
