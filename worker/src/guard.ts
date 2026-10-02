/**
 * Keeps FarmSaathi a farming assistant and nothing else. Four layers:
 *   1. The system prompt (chain.ts) lists what is in scope and says the question, the history and the
 *      passages are data, never instructions.
 *   2. Every answer starts with a verdict line, TOPIC: farming or TOPIC: other. The server strips it;
 *      "other" is replaced by a fixed refusal, so a model talked round still cannot deliver the text.
 *   3. Obvious attempts to rewrite the rules ("ignore your instructions", "show your system prompt")
 *      are refused here before any provider is called, and dropped from the history the client sends.
 *   4. An answer that reads like code or quotes the prompt is refused too.
 */
import type { Lang } from './contract'

/** What the farmer sees when a question is out of scope, in their language. */
export const REFUSAL: Record<Lang, string> = {
  en: 'I can only help with farming: crops, soil, pests and diseases, irrigation, weather for farm work, animals, mandi prices, farm loans and insurance, and government schemes for farmers. Please ask me something about your farm.',
  hi: 'मैं सिर्फ़ खेती से जुड़े सवालों में मदद कर सकता हूँ: फ़सल, मिट्टी, कीट और रोग, सिंचाई, खेती के लिए मौसम, पशु, मंडी भाव, खेती का कर्ज़ और बीमा, और किसानों की सरकारी योजनाएँ। अपने खेत के बारे में कुछ पूछिए।',
  pa: 'ਮੈਂ ਸਿਰਫ਼ ਖੇਤੀ ਨਾਲ ਜੁੜੇ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ: ਫ਼ਸਲ, ਮਿੱਟੀ, ਕੀੜੇ ਤੇ ਰੋਗ, ਸਿੰਚਾਈ, ਖੇਤੀ ਲਈ ਮੌਸਮ, ਪਸ਼ੂ, ਮੰਡੀ ਭਾਅ, ਖੇਤੀ ਦਾ ਕਰਜ਼ਾ ਤੇ ਬੀਮਾ, ਤੇ ਕਿਸਾਨਾਂ ਦੀਆਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ। ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਕੁਝ ਪੁੱਛੋ।',
}

/** The scope, as the system prompt states it. */
export const SCOPE = [
  'crops, seeds and sowing, soil and fertilizer, pests and plant diseases, irrigation and water',
  'weather as it affects farm work, harvest, storage and post-harvest handling',
  'livestock, dairy, poultry, fisheries and beekeeping',
  'farm machinery and tools, mandi prices and selling produce',
  'farm credit, crop insurance and government schemes and subsidies for farmers',
  'organic and natural farming',
  'greetings, thanks and questions about what FarmSaathi can do (answer those in a line or two and invite a farming question)',
].join('; ')

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass|skip)\b[^.?!\n]{0,40}\b(previous|prior|above|earlier|all|your|these|those|the|system)\b[^.?!\n]{0,40}\b(instructions?|rules?|prompts?|guidelines?|restrictions?|directions?)\b/i,
  /\b(system|hidden|initial|developer|original)\s+(prompt|message|instructions?)\b/i,
  /\b(reveal|print|repeat|show|tell me|what are|what is)\b[^.?!\n]{0,30}\b(your\s+(instructions|prompt|rules)|the\s+(instructions|prompt)\s+(you|given|above))\b/i,
  /\byou\s+are\s+(now|no\s+longer)\b/i,
  /\bfrom\s+now\s+on,?\s+(you|act|behave|respond|answer)\b/i,
  /\b(pretend\s+(to\s+be|you\s+are)|role-?play\s+as)\b/i,
  /\b(jailbreak|jail\s+break|DAN\s+mode|developer\s+mode|do\s+anything\s+now|no\s+restrictions)\b/i,
  /<\/?\s*(system|instructions?|prompt)\s*>|\[\/?INST\]|<\|im_(start|end)\|>/i,
  /\b(pichl[ea]|purane|saare|sabhi)\b[^.?!\n]{0,25}\b(instructions?|nirdesh|niyam|rules)\b[^.?!\n]{0,25}\b(bhool|bhul|ignore|chhod|mat\s+maano)/i,
  /(निर्देश|नियम|हिदायत)[^।?!\n]{0,25}(भूल|अनदेखा|नज़रअंदाज़|नजरअंदाज|मत\s+मानो)/,
  /(ਹਦਾਇਤ|ਨਿਯਮ|ਨਿਰਦੇਸ਼)[^।?!\n]{0,25}(ਭੁੱਲ|ਅਣਡਿੱਠ|ਨਾ\s+ਮੰਨ)/,
]

/** True when the text tries to change FarmSaathi's rules rather than ask a question. */
export function isInjection(text: string): boolean {
  return INJECTION.some(re => re.test(text))
}

const VERDICT = /^\s*TOPIC\s*:\s*(farming|other)\b[^\n]*(\n|$)/i
// Case-sensitive on purpose: "Import duty on pulses…" is a farming sentence; `import x from 'y'` is code.
const CODE = /```|^\s*(def \w+\(|function\s+\w+\s*\(|#include\s*<|import\s+[\w{}*, ]+\s+from\s+['"]|from\s+\w+\s+import\s|public\s+(static\s+)?class\b|<\?php|SELECT\s+.+\s+FROM\s)/m
const LEAK = /\bTOPIC\s*:\s*(farming|other)\b|You are FarmSaathi, a helpful assistant/i

export type Verdict =
  | { kind: 'answer'; text: string; labelled: boolean }
  | { kind: 'refuse'; why: 'offtopic' | 'output' }

/** Reads the model's verdict line and checks what is left. */
export function judge(raw: string): Verdict {
  const m = VERDICT.exec(raw)
  if (m && m[1].toLowerCase() === 'other') return { kind: 'refuse', why: 'offtopic' }
  const text = (m ? raw.slice(m[0].length) : raw).trim()
  if (!text || CODE.test(text) || LEAK.test(text)) return { kind: 'refuse', why: 'output' }
  return { kind: 'answer', text, labelled: !!m }
}
