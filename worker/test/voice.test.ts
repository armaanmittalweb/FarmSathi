import { describe, expect, it } from 'vitest'
import { MESSAGES } from '../src/i18n'
import { sha256hex } from '../src/keys'
import { API, fakeAi, fakeFetch, hang, memoryCache, setup, status, wav } from './helpers'

const GROQ = 'api.groq.com', SPACE = 'armaanmittalweb-farmsaathi-voice.hf.space'
const VOICE = { VOICE_URL: `https://${SPACE}/`, VOICE_KEY: 'voice-key' }

function recording(type = 'audio/webm', bytes: Uint8Array = wav(), lang = 'hi') {
  const form = new FormData()
  form.set('audio', new File([bytes], 'clip', { type }))
  form.set('lang', lang)
  return form
}

describe('POST /api/transcribe', () => {
  it('uses Groq Whisper with the language, and sends only the audio', async () => {
    const f = fakeFetch({ [GROQ]: () => Response.json({ text: ' अगली किस्त कब आएगी? ' }) })
    const s = setup({ GROQ_API_KEY: 'gq' }, { fetch: f })
    const res = await s.call('POST', '/api/transcribe', { form: recording('audio/webm;codecs=opus') })
    expect(res.status).toBe(200)
    expect(res.json).toEqual({ text: 'अगली किस्त कब आएगी?', lang: 'hi' })
    expect(f.calls).toHaveLength(1)
    expect(f.calls[0].url).toBe('https://api.groq.com/openai/v1/audio/transcriptions')
    expect(f.calls[0].headers.get('authorization')).toBe('Bearer gq')
    expect(f.calls[0].body).toEqual({
      file: { name: 'audio.webm', size: wav().byteLength, type: 'audio/webm;codecs=opus' },
      model: 'whisper-large-v3-turbo', language: 'hi', response_format: 'json', temperature: '0',
    })
    expect(s.ai!.calls).toEqual([])
  })

  it('falls back to Workers AI Whisper when Groq fails, times out or has no key', async () => {
    for (const groq of [status(500), hang, null]) {
      const f = fakeFetch(groq ? { [GROQ]: groq } : {})
      const s = setup(groq ? { GROQ_API_KEY: 'gq' } : {}, { fetch: f, stepTimeoutMs: 30 })
      const res = await s.call('POST', '/api/transcribe', { form: recording('audio/ogg', wav(), 'pa') })
      expect(res.status).toBe(200)
      expect(res.json).toEqual({ text: 'workers ai heard this', lang: 'pa' })
      const [call] = s.ai!.calls
      expect(call.model).toBe('@cf/openai/whisper-large-v3-turbo')
      expect(call.inputs).toEqual({ audio: Buffer.from(wav()).toString('base64'), language: 'pa', task: 'transcribe' })
    }
  })

  it('answers 503 in the farmer\'s language when both fail', async () => {
    const ai = fakeAi()
    ai.whisper = () => { throw new Error('busy') }
    const s = setup({ GROQ_API_KEY: 'gq' }, { fetch: fakeFetch({ [GROQ]: status(503) }), ai })
    const res = await s.call('POST', '/api/transcribe', { form: recording('audio/mp4', wav(), 'pa') })
    expect(res.status).toBe(503)
    expect(res.json).toEqual({ error: MESSAGES.transcribe_unavailable.pa, code: 'unavailable' })
  })

  it('answers 429 when both are at their daily caps', async () => {
    const s = setup({ GROQ_API_KEY: 'gq', GROQ_STT_DAILY_CAP: '0', WORKERS_AI_STT_DAILY_CAP: '0' })
    const res = await s.call('POST', '/api/transcribe', { form: recording() })
    expect(res.status).toBe(429)
    expect(res.json).toMatchObject({ error: MESSAGES.voice_capped.hi, code: 'rate_limited', retryAfter: expect.any(Number) })
  })

  it('checks the recording: present, a known format, at most 2 MB', async () => {
    const s = setup()
    const none = new FormData()
    none.set('lang', 'hi')
    expect((await s.call('POST', '/api/transcribe', { form: none })).json).toEqual({ error: MESSAGES.no_audio.hi, code: 'bad_request' })
    const mp3 = await s.call('POST', '/api/transcribe', { form: recording('audio/mpeg') })
    expect(mp3.json).toEqual({ error: MESSAGES.bad_audio.hi, code: 'bad_request' })
    const big = await s.call('POST', '/api/transcribe', { form: recording('audio/wav', new Uint8Array(2 * 1024 * 1024 + 1)) })
    expect(big.status).toBe(413)
    expect(big.json).toEqual({ error: MESSAGES.long_audio.hi, code: 'too_large' })
    expect(s.ai!.calls).toEqual([])
  })

  it('allows 30 transcriptions per visitor per day', async () => {
    const s = setup()
    for (let i = 0; i < 30; i++) expect((await s.call('POST', '/api/transcribe', { form: recording() })).status).toBe(200)
    const over = await s.call('POST', '/api/transcribe', { form: recording() })
    expect(over.status).toBe(429)
    expect(over.json.error).toBe(MESSAGES.transcribe_limit.hi)
  })
})

describe('POST /api/speak', () => {
  const clip = wav(2000)
  const space = (calls: { n: number }) => () => {
    calls.n++
    return new Response(clip, { headers: { 'content-type': 'audio/wav' } })
  }

  it('fetches the clip from the Space with the key, returns audio/wav and caches it for 30 days', async () => {
    const n = { n: 0 }, cache = memoryCache()
    const f = fakeFetch({ [SPACE]: space(n) })
    const s = setup(VOICE, { fetch: f, cache })
    const res = await s.call('POST', '/api/speak', { body: { text: ' नमस्ते किसान भाई ', lang: 'hi' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/wav')
    expect(res.headers.get('x-speak-cache')).toBe('miss')
    expect(res.bytes).toEqual(clip)
    expect(f.calls[0].url).toBe(`https://${SPACE}/speak`)
    expect(f.calls[0].headers.get('x-voice-key')).toBe('voice-key')
    expect(f.calls[0].body).toEqual({ text: 'नमस्ते किसान भाई', lang: 'hi' })
    await s.settle()
    const key = `${API}/__speak/${await sha256hex('hi' + 'नमस्ते किसान भाई')}`
    expect(cache.store.get(key)?.headers.get('cache-control')).toBe('public, max-age=2592000')

    const again = await s.call('POST', '/api/speak', { body: { text: 'नमस्ते किसान भाई', lang: 'hi' } })
    expect(again.status).toBe(200)
    expect(again.headers.get('x-speak-cache')).toBe('hit')
    expect(again.bytes).toEqual(clip)
    expect(n.n).toBe(1)

    // The same words in another language are another clip.
    await s.call('POST', '/api/speak', { body: { text: 'नमस्ते किसान भाई', lang: 'pa' } })
    expect(n.n).toBe(2)
  })

  it('answers 503 with fallback "device" when the Space is asleep, failing, slow or not configured', async () => {
    const cases: [Record<string, string>, Parameters<typeof fakeFetch>[0]][] = [
      [{}, {}],
      [VOICE, { [SPACE]: status(503) }],
      [VOICE, { [SPACE]: () => new Response('<html>Starting…</html>', { headers: { 'content-type': 'text/html' } }) }],
      [VOICE, { [SPACE]: hang }],
      [VOICE, { [SPACE]: () => { throw new Error('connection refused') } }],
      [VOICE, { [SPACE]: () => new Response(new Uint8Array(10), { headers: { 'content-type': 'audio/wav' } }) }],
    ]
    for (const [env, answers] of cases) {
      const cache = memoryCache()
      const s = setup(env, { fetch: fakeFetch(answers), cache, voiceTimeoutMs: 30 })
      const res = await s.call('POST', '/api/speak', { body: { text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', lang: 'pa' } })
      expect(res.status).toBe(503)
      expect(res.json).toEqual({ error: MESSAGES.voice_unavailable.pa, code: 'unavailable', fallback: 'device' })
      expect(cache.store.size).toBe(0)
    }
  })

  it('checks the text', async () => {
    const s = setup(VOICE)
    for (const text of ['', '   ', 'x'.repeat(601), 42]) {
      const res = await s.call('POST', '/api/speak', { body: { text, lang: 'en' } })
      expect(res.status).toBe(400)
      expect(res.json.error).toBe(MESSAGES.bad_speak_text.en)
    }
  })

  it('allows 60 new clips per visitor per day; cached clips are free', async () => {
    const f = fakeFetch({ [SPACE]: space({ n: 0 }) })
    const s = setup(VOICE, { fetch: f })
    for (let i = 0; i < 60; i++) expect((await s.call('POST', '/api/speak', { body: { text: `line ${i}`, lang: 'en' } })).status).toBe(200)
    await s.settle()
    expect((await s.call('POST', '/api/speak', { body: { text: 'line 3', lang: 'en' } })).status).toBe(200)
    const over = await s.call('POST', '/api/speak', { body: { text: 'a new line', lang: 'hi' } })
    expect(over.status).toBe(429)
    expect(over.json).toMatchObject({ error: MESSAGES.speak_limit.hi, code: 'rate_limited', retryAfter: expect.any(Number), fallback: 'device' })
  })
})

describe('POST /api/voice/wake', () => {
  it('answers 202 at once and pings the Space health in the background, at most once a minute', async () => {
    const f = fakeFetch({ [SPACE]: () => Response.json({ ok: true }) })
    const s = setup(VOICE, { fetch: f })
    const res = await s.call('POST', '/api/voice/wake')
    expect(res.status).toBe(202)
    await s.settle()
    expect(f.calls.map(c => c.url)).toEqual([`https://${SPACE}/health`])
    await s.call('POST', '/api/voice/wake')
    expect(f.calls).toHaveLength(1)
    s.clock.t += 61_000
    await s.call('POST', '/api/voice/wake')
    expect(f.calls).toHaveLength(2)
  })

  it('still answers 202 when the Space is not configured or does not answer', async () => {
    const f = fakeFetch({ [SPACE]: hang })
    expect((await setup({}, { fetch: f }).call('POST', '/api/voice/wake')).status).toBe(202)
    expect(f.calls).toEqual([])
    expect((await setup(VOICE, { fetch: f }).call('POST', '/api/voice/wake')).status).toBe(202)
  })
})
