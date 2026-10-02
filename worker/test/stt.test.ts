import { describe, expect, it } from 'vitest'
import { MESSAGES } from '../src/i18n'
import { unusable } from '../src/voice'
import { fakeAi, fakeFetch, hang, setup, status, wav } from './helpers'

const GROQ = 'api.groq.com', VOICE_HOST = 'armaanmittalweb--farmsaathi-voice.modal.run'
const VOICE = { VOICE_URL: `https://${VOICE_HOST}/`, VOICE_KEY: 'voice-key' }
const LOOPED = 'ਮੇਰੀ ਕਣਕ ਦੇ ਪੱਤੇ ' + 'ਪੀਲੇ ਹੋ ਗਏ '.repeat(80)

function recording(lang: string, type = 'audio/webm;codecs=opus', bytes: Uint8Array = wav()) {
  const form = new FormData()
  form.set('audio', new File([bytes], 'clip', { type }))
  form.set('lang', lang)
  return form
}

const usage = (s: ReturnType<typeof setup>) =>
  Object.fromEntries((s.sql.db.prepare("SELECT key, n FROM usage WHERE key LIKE 'a:%' OR key LIKE 'stt:%'").all() as { key: string; n: number }[]).map(r => [r.key, r.n]))

describe('speech to text for Hindi and Punjabi', () => {
  it('asks IndicConformer on the voice container first, with the key, the language and the raw recording', async () => {
    for (const lang of ['pa', 'hi']) {
      const f = fakeFetch({ [VOICE_HOST]: () => Response.json({ text: ' ਕਣਕ ਕਦੋਂ ਬੀਜੀਏ ', lang, seconds: 2.1 }) })
      const s = setup({ ...VOICE, GROQ_API_KEY: 'gq' }, { fetch: f })
      const res = await s.call('POST', '/api/transcribe', { form: recording(lang) })
      expect(res.status).toBe(200)
      expect(res.json).toEqual({ text: 'ਕਣਕ ਕਦੋਂ ਬੀਜੀਏ', lang })
      expect(f.calls).toHaveLength(1)
      expect(f.calls[0].url).toBe(`https://${VOICE_HOST}/transcribe?lang=${lang}`)
      expect(f.calls[0].headers.get('x-voice-key')).toBe('voice-key')
      expect(f.calls[0].headers.get('content-type')).toBe('audio/webm;codecs=opus')
      expect(f.calls[0].body).toEqual(wav())
      expect(s.ai!.calls).toEqual([])
      expect(usage(s)).toEqual({ 'a:indic-stt': 1 })
    }
  })

  it('falls back to Whisper when the container fails, is cold past the timeout, or is not configured', async () => {
    for (const [env, answer] of [[VOICE, status(500)], [VOICE, hang], [VOICE, status(401)], [{}, null]] as const) {
      const f = fakeFetch(answer ? { [VOICE_HOST]: answer } : {})
      const s = setup(env, { fetch: f, voiceTimeoutMs: 30 })
      const res = await s.call('POST', '/api/transcribe', { form: recording('pa') })
      expect(res.status).toBe(200)
      expect(res.json).toEqual({ text: 'workers ai heard this', lang: 'pa' })
      expect(f.calls).toHaveLength(answer ? 1 : 0)
    }
  })

  it('never sends English to the container', async () => {
    const f = fakeFetch({ [VOICE_HOST]: () => Response.json({ text: 'should not be used' }) })
    const s = setup(VOICE, { fetch: f })
    const res = await s.call('POST', '/api/transcribe', { form: recording('en') })
    expect(res.json).toEqual({ text: 'workers ai heard this', lang: 'en' })
    expect(f.calls).toEqual([])
  })

  it('skips a looping transcript and tries the next provider', async () => {
    const f = fakeFetch({ [GROQ]: () => Response.json({ text: LOOPED }) })
    const s = setup({ GROQ_API_KEY: 'gq' }, { fetch: f })
    const res = await s.call('POST', '/api/transcribe', { form: recording('pa') })
    expect(res.status).toBe(200)
    expect(res.json).toEqual({ text: 'workers ai heard this', lang: 'pa' })
    expect(usage(s)).toEqual({ 'stt:unusable': 1, 'a:workers-ai-stt': 1 })
  })

  it('answers empty text, so the app asks the farmer to speak again, when every transcript loops', async () => {
    const ai = fakeAi()
    ai.whisper = () => ({ text: LOOPED })
    const s = setup({}, { ai })
    const res = await s.call('POST', '/api/transcribe', { form: recording('pa') })
    expect(res.status).toBe(200)
    expect(res.json).toEqual({ text: '', lang: 'pa' })
  })

  it('still answers 503 when nothing heard it at all', async () => {
    const ai = fakeAi()
    ai.whisper = () => { throw new Error('busy') }
    const s = setup(VOICE, { fetch: fakeFetch({ [VOICE_HOST]: status(503) }), ai, voiceTimeoutMs: 30 })
    const res = await s.call('POST', '/api/transcribe', { form: recording('hi') })
    expect(res.status).toBe(503)
    expect(res.json).toEqual({ error: MESSAGES.transcribe_unavailable.hi, code: 'unavailable' })
  })

  it('stops using the container at its daily cap', async () => {
    const f = fakeFetch({ [VOICE_HOST]: () => Response.json({ text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ' }) })
    const s = setup({ ...VOICE, INDIC_STT_DAILY_CAP: '1' }, { fetch: f })
    expect((await s.call('POST', '/api/transcribe', { form: recording('pa') })).json.text).toBe('ਸਤ ਸ੍ਰੀ ਅਕਾਲ')
    expect((await s.call('POST', '/api/transcribe', { form: recording('pa') })).json.text).toBe('workers ai heard this')
    expect(f.calls).toHaveLength(1)
  })
})

describe('unusable', () => {
  it('passes real questions, including a word said twice', () => {
    for (const q of [
      'ਮੇਰੀ ਕਣਕ ਦੇ ਪੱਤੇ ਪੀਲੇ ਹੋ ਰਹੇ ਹਨ, ਕੀ ਕਰਾਂ?',
      'नहीं नहीं, मेरा सवाल गेहूँ के बारे में है',
      'When should I sow mustard in Punjab? Mustard, not wheat.',
      'हाँ हाँ हाँ, यूरिया कितना डालूँ',
      'x'.repeat(1000),
      'एक लाख 100000 रुपये, 1,00,000 या ₹10000000',
    ]) expect(unusable(q)).toBe(false)
  })

  it('catches loops and anything over the question limit', () => {
    expect(unusable(LOOPED)).toBe(true)
    expect(unusable('ਸੀ ਸੀ ਸੀ ਸੀ ਸੀ')).toBe(true)
    expect(unusable('मेरी फसल, मेरी फसल, मेरी फसल, मेरी फसल, मेरी फसल')).toBe(true)
    expect(unusable('x'.repeat(1001))).toBe(true)
  })
})
