/**
 * Every error a farmer can see, in English, Hindi (Devanagari) and Punjabi (Gurmukhi). Written for
 * each language, in the plain spoken register the app uses, not translated word for word.
 */
import type { Lang } from './contract'

export const LANGS: readonly Lang[] = ['en', 'hi', 'pa']
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v)

/** hi/pa from an Accept-Language header (first match wins), else null. */
export function langFromHeader(header: string | undefined): Lang | null {
  for (const part of (header ?? '').toLowerCase().split(',')) {
    const tag = part.split(';')[0].trim().slice(0, 2)
    if (isLang(tag)) return tag
  }
  return null
}

export const MESSAGES = {
  forbidden: {
    en: 'This request has to come from the FarmSaathi app.',
    hi: 'यह अनुरोध फ़ार्मसाथी ऐप से ही आना चाहिए।',
    pa: 'ਇਹ ਬੇਨਤੀ ਫਾਰਮਸਾਥੀ ਐਪ ਤੋਂ ਹੀ ਆਉਣੀ ਚਾਹੀਦੀ ਹੈ।',
  },
  bad_request: {
    en: "Something in that request wasn't right. Please try again.",
    hi: 'कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।',
    pa: 'ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  too_many_tries: {
    en: 'Too many tries. Wait a minute, then try again.',
    hi: 'बहुत बार कोशिश हो गई। एक मिनट रुककर फिर कोशिश करें।',
    pa: 'ਬਹੁਤ ਵਾਰ ਕੋਸ਼ਿਸ਼ ਹੋ ਗਈ। ਇੱਕ ਮਿੰਟ ਰੁਕ ਕੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  not_found: {
    en: "We couldn't find that.",
    hi: 'यह नहीं मिला।',
    pa: 'ਇਹ ਨਹੀਂ ਮਿਲਿਆ।',
  },
  server: {
    en: 'Something went wrong on our side. Please try again in a moment.',
    hi: 'हमारी तरफ़ से कुछ गड़बड़ हुई। थोड़ी देर में फिर कोशिश करें।',
    pa: 'ਸਾਡੇ ਵੱਲੋਂ ਕੁਝ ਗੜਬੜ ਹੋਈ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  bad_login: {
    en: 'Enter a 10-digit mobile number or an email address.',
    hi: '10 अंकों का मोबाइल नंबर या ईमेल पता लिखें।',
    pa: '10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਪਤਾ ਲਿਖੋ।',
  },
  short_password: {
    en: 'The password needs at least 8 characters.',
    hi: 'पासवर्ड में कम से कम 8 अक्षर होने चाहिए।',
    pa: 'ਪਾਸਵਰਡ ਵਿੱਚ ਘੱਟੋ-ਘੱਟ 8 ਅੱਖਰ ਹੋਣੇ ਚਾਹੀਦੇ ਹਨ।',
  },
  login_taken: {
    en: 'This number or email already has an account. Sign in instead.',
    hi: 'इस नंबर या ईमेल से पहले ही खाता बना हुआ है। साइन इन करें।',
    pa: 'ਇਸ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਨਾਲ ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਬਣਿਆ ਹੋਇਆ ਹੈ। ਸਾਈਨ ਇਨ ਕਰੋ।',
  },
  bad_credentials: {
    en: "That number or email and password don't match.",
    hi: 'नंबर या ईमेल और पासवर्ड आपस में मेल नहीं खाते।',
    pa: 'ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਆਪਸ ਵਿੱਚ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ।',
  },
  signed_out: {
    en: 'Please sign in first.',
    hi: 'पहले साइन इन करें।',
    pa: 'ਪਹਿਲਾਂ ਸਾਈਨ ਇਨ ਕਰੋ।',
  },
  wrong_password: {
    en: "That password isn't right.",
    hi: 'पासवर्ड सही नहीं है।',
    pa: 'ਪਾਸਵਰਡ ਸਹੀ ਨਹੀਂ ਹੈ।',
  },
  bad_profile: {
    en: "Some of the profile details aren't right. Check them and save again.",
    hi: 'प्रोफ़ाइल की कुछ जानकारी सही नहीं है। जाँचकर फिर से सेव करें।',
    pa: 'ਪ੍ਰੋਫਾਈਲ ਦੀ ਕੁਝ ਜਾਣਕਾਰੀ ਸਹੀ ਨਹੀਂ ਹੈ। ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਸੇਵ ਕਰੋ।',
  },
  empty_question: {
    en: 'Type or speak your question first.',
    hi: 'पहले अपना सवाल बोलें या लिखें।',
    pa: 'ਪਹਿਲਾਂ ਆਪਣਾ ਸਵਾਲ ਬੋਲੋ ਜਾਂ ਲਿਖੋ।',
  },
  long_question: {
    en: 'That question is too long. Keep it under 1,000 characters.',
    hi: 'सवाल बहुत लंबा है। इसे 1,000 अक्षरों से छोटा रखें।',
    pa: 'ਸਵਾਲ ਬਹੁਤ ਲੰਮਾ ਹੈ। ਇਸਨੂੰ 1,000 ਅੱਖਰਾਂ ਤੋਂ ਛੋਟਾ ਰੱਖੋ।',
  },
  chat_limit: {
    en: "You've asked 30 questions today, the most for one day. You can ask again tomorrow.",
    hi: 'आज आप 30 सवाल पूछ चुके हैं, जो एक दिन की सीमा है। कल फिर पूछ सकते हैं।',
    pa: 'ਅੱਜ ਤੁਸੀਂ 30 ਸਵਾਲ ਪੁੱਛ ਚੁੱਕੇ ਹੋ, ਜੋ ਇੱਕ ਦਿਨ ਦੀ ਹੱਦ ਹੈ। ਕੱਲ੍ਹ ਫਿਰ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
  },
  transcribe_limit: {
    en: "You've used voice input 30 times today, the most for one day. Type your question, or speak again tomorrow.",
    hi: 'आज बोलकर पूछने की सीमा (30 बार) पूरी हो गई। सवाल लिखकर पूछें, या कल फिर बोलें।',
    pa: 'ਅੱਜ ਬੋਲ ਕੇ ਪੁੱਛਣ ਦੀ ਹੱਦ (30 ਵਾਰ) ਪੂਰੀ ਹੋ ਗਈ। ਸਵਾਲ ਲਿਖ ਕੇ ਪੁੱਛੋ, ਜਾਂ ਕੱਲ੍ਹ ਫਿਰ ਬੋਲੋ।',
  },
  speak_limit: {
    en: "Today's read-aloud limit is used up. Your phone's own voice will read answers instead.",
    hi: 'आज की सुनाने की सीमा पूरी हो गई। अब जवाब आपके फ़ोन की अपनी आवाज़ में सुनाए जाएँगे।',
    pa: 'ਅੱਜ ਦੀ ਸੁਣਾਉਣ ਦੀ ਹੱਦ ਪੂਰੀ ਹੋ ਗਈ। ਹੁਣ ਜਵਾਬ ਤੁਹਾਡੇ ਫ਼ੋਨ ਦੀ ਆਪਣੀ ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣਾਏ ਜਾਣਗੇ।',
  },
  all_capped: {
    en: 'FarmSaathi has answered as many questions as it can for today. Please ask again tomorrow.',
    hi: 'फ़ार्मसाथी आज जितने सवालों के जवाब दे सकता था, दे चुका है। कृपया कल फिर पूछें।',
    pa: 'ਫਾਰਮਸਾਥੀ ਅੱਜ ਜਿੰਨੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਸੀ, ਦੇ ਚੁੱਕਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੱਲ੍ਹ ਫਿਰ ਪੁੱਛੋ।',
  },
  chat_unavailable: {
    en: "FarmSaathi can't answer right now. Please try again in a few minutes.",
    hi: 'फ़ार्मसाथी अभी जवाब नहीं दे पा रहा है। कुछ मिनट बाद फिर कोशिश करें।',
    pa: 'ਫਾਰਮਸਾਥੀ ਹੁਣੇ ਜਵਾਬ ਨਹੀਂ ਦੇ ਪਾ ਰਿਹਾ। ਕੁਝ ਮਿੰਟਾਂ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  no_audio: {
    en: 'No recording came through. Tap the mic and speak again.',
    hi: 'रिकॉर्डिंग नहीं पहुँची। माइक दबाकर फिर से बोलें।',
    pa: 'ਰਿਕਾਰਡਿੰਗ ਨਹੀਂ ਪਹੁੰਚੀ। ਮਾਈਕ ਦਬਾ ਕੇ ਫਿਰ ਬੋਲੋ।',
  },
  bad_audio: {
    en: "That recording can't be read. Please record again in the app.",
    hi: 'यह रिकॉर्डिंग पढ़ी नहीं जा सकी। ऐप में फिर से रिकॉर्ड करें।',
    pa: 'ਇਹ ਰਿਕਾਰਡਿੰਗ ਪੜ੍ਹੀ ਨਹੀਂ ਜਾ ਸਕੀ। ਐਪ ਵਿੱਚ ਦੁਬਾਰਾ ਰਿਕਾਰਡ ਕਰੋ।',
  },
  long_audio: {
    en: 'That recording is too long. Keep it under one minute.',
    hi: 'रिकॉर्डिंग बहुत लंबी है। एक मिनट से कम रखें।',
    pa: 'ਰਿਕਾਰਡਿੰਗ ਬਹੁਤ ਲੰਮੀ ਹੈ। ਇੱਕ ਮਿੰਟ ਤੋਂ ਘੱਟ ਰੱਖੋ।',
  },
  voice_capped: {
    en: 'Voice input has reached its limit for today. Please type your question.',
    hi: 'आज के लिए बोलकर पूछने की सुविधा अपनी सीमा तक पहुँच गई है। कृपया सवाल लिखकर पूछें।',
    pa: 'ਅੱਜ ਲਈ ਬੋਲ ਕੇ ਪੁੱਛਣ ਦੀ ਸਹੂਲਤ ਆਪਣੀ ਹੱਦ ਤੱਕ ਪਹੁੰਚ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਵਾਲ ਲਿਖ ਕੇ ਪੁੱਛੋ।',
  },
  transcribe_unavailable: {
    en: "Couldn't make out the recording just now. Type your question, or try speaking again.",
    hi: 'अभी रिकॉर्डिंग समझ नहीं आई। सवाल लिखकर पूछें, या फिर से बोलकर देखें।',
    pa: 'ਹੁਣੇ ਰਿਕਾਰਡਿੰਗ ਸਮਝ ਨਹੀਂ ਆਈ। ਸਵਾਲ ਲਿਖ ਕੇ ਪੁੱਛੋ, ਜਾਂ ਫਿਰ ਬੋਲ ਕੇ ਵੇਖੋ।',
  },
  bad_speak_text: {
    en: "There's nothing to read aloud, or it's too long.",
    hi: 'सुनाने के लिए कुछ नहीं है, या बात बहुत लंबी है।',
    pa: 'ਸੁਣਾਉਣ ਲਈ ਕੁਝ ਨਹੀਂ ਹੈ, ਜਾਂ ਗੱਲ ਬਹੁਤ ਲੰਮੀ ਹੈ।',
  },
  voice_unavailable: {
    en: "The read-aloud voice isn't ready right now. Your phone's own voice will read this answer.",
    hi: 'सुनाने वाली आवाज़ अभी तैयार नहीं है। यह जवाब आपके फ़ोन की अपनी आवाज़ में सुनाया जाएगा।',
    pa: 'ਸੁਣਾਉਣ ਵਾਲੀ ਆਵਾਜ਼ ਹਾਲੇ ਤਿਆਰ ਨਹੀਂ ਹੈ। ਇਹ ਜਵਾਬ ਤੁਹਾਡੇ ਫ਼ੋਨ ਦੀ ਆਪਣੀ ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣਾਇਆ ਜਾਵੇਗਾ।',
  },
  bad_import: {
    en: "Some saved chats couldn't be read, so none were moved. Please try again.",
    hi: 'कुछ सहेजी गई बातचीत पढ़ी नहीं जा सकी, इसलिए कुछ भी नहीं जोड़ा गया। फिर कोशिश करें।',
    pa: 'ਕੁਝ ਸੰਭਾਲੀਆਂ ਗੱਲਾਂ ਪੜ੍ਹੀਆਂ ਨਹੀਂ ਜਾ ਸਕੀਆਂ, ਇਸ ਲਈ ਕੁਝ ਵੀ ਨਹੀਂ ਜੋੜਿਆ ਗਿਆ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
} as const satisfies Record<string, Record<Lang, string>>

export type MessageKey = keyof typeof MESSAGES
