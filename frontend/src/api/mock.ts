/**
 * In-memory stand-in for the Worker (`vite --mode mock`), for building and screenshots without a server.
 * Answers in all three languages with canned, realistic replies that cite the schemes.
 * URL switches: ?seed=signedin (an account with saved chats), ?seed=guestchats (history on the phone),
 * ?chat=limit|error|slow, ?voice=asleep|none, ?mic=denied, ?login=bad.
 */
import type { ChatReply, ChatTurn, Lang, Me, Profile, Scheme, Source } from '../contract';
import { SCHEMES } from '../content/schemes';
import { ApiFail, type Api } from './types';

const q = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
const wait = (ms: number) => new Promise((r) => setTimeout(r, q.get('fast') ? 0 : ms));

type Tri = Record<Lang, string>;
interface Canned { match: RegExp; answer: Tri; sources: string[] }

const CANNED: Canned[] = [
  {
    match: /kisan|किसान|ਕਿਸਾਨ|installment|kist|किस्त|ਕਿਸ਼ਤ|6,?000/i,
    sources: ['pm-kisan'],
    answer: {
      en: 'PM-KISAN pays ₹6,000 a year in three installments of ₹2,000, straight into your bank account. Installments usually come around April–July, August–November and December–March, but the exact date is announced by the government, so check "Know Your Status" on pmkisan.gov.in with your Aadhaar or mobile number.\n\nIf an installment has not come, the usual reasons are: e-KYC not done, the bank account not linked to Aadhaar, or a mismatch in the land record. You can finish e-KYC with an OTP on pmkisan.gov.in or by fingerprint at your nearest CSC.',
      hi: 'पीएम-किसान में साल में ₹6,000 तीन किस्तों में, ₹2,000-₹2,000 करके, सीधे बैंक खाते में आते हैं। किस्तें आम तौर पर अप्रैल-जुलाई, अगस्त-नवंबर और दिसंबर-मार्च के बीच आती हैं, पर पक्की तारीख़ सरकार बताती है। pmkisan.gov.in पर “अपनी स्थिति जानें” में आधार या मोबाइल नंबर डालकर देख लें।\n\nकिस्त न आई हो तो आम वजहें हैं: ई-केवाईसी नहीं हुई, बैंक खाता आधार से नहीं जुड़ा, या ज़मीन के रिकॉर्ड में नाम मेल नहीं खाता। ई-केवाईसी pmkisan.gov.in पर OTP से या पास के CSC पर अँगूठा लगाकर हो जाती है।',
      pa: 'ਪੀਐਮ-ਕਿਸਾਨ ਵਿੱਚ ਸਾਲ ਦੇ ₹6,000 ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ, ₹2,000-₹2,000 ਕਰਕੇ, ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਆਉਂਦੇ ਹਨ। ਕਿਸ਼ਤਾਂ ਆਮ ਤੌਰ ’ਤੇ ਅਪ੍ਰੈਲ-ਜੁਲਾਈ, ਅਗਸਤ-ਨਵੰਬਰ ਤੇ ਦਸੰਬਰ-ਮਾਰਚ ਵਿਚਕਾਰ ਆਉਂਦੀਆਂ ਹਨ, ਪਰ ਪੱਕੀ ਤਰੀਕ ਸਰਕਾਰ ਦੱਸਦੀ ਹੈ। pmkisan.gov.in ’ਤੇ “ਆਪਣਾ ਸਟੇਟਸ ਜਾਣੋ” ਵਿੱਚ ਆਧਾਰ ਜਾਂ ਮੋਬਾਈਲ ਨੰਬਰ ਪਾ ਕੇ ਦੇਖ ਲਓ।\n\nਕਿਸ਼ਤ ਨਾ ਆਈ ਹੋਵੇ ਤਾਂ ਆਮ ਕਾਰਨ ਹਨ: ਈ-ਕੇਵਾਈਸੀ ਨਹੀਂ ਹੋਈ, ਬੈਂਕ ਖਾਤਾ ਆਧਾਰ ਨਾਲ ਨਹੀਂ ਜੁੜਿਆ, ਜਾਂ ਜ਼ਮੀਨ ਦੇ ਰਿਕਾਰਡ ਵਿੱਚ ਨਾਂ ਮੇਲ ਨਹੀਂ ਖਾਂਦਾ। ਈ-ਕੇਵਾਈਸੀ pmkisan.gov.in ’ਤੇ OTP ਨਾਲ ਜਾਂ ਨੇੜਲੇ CSC ’ਤੇ ਅੰਗੂਠਾ ਲਾ ਕੇ ਹੋ ਜਾਂਦੀ ਹੈ।',
    },
  },
  {
    match: /yellow|पीले|पीला|ਪੀਲੇ|ਪੀਲਾ/i,
    sources: ['soil-health-card'],
    answer: {
      en: 'Yellow wheat leaves usually mean one of three things:\n1. Nitrogen shortage: older, lower leaves turn yellow first. A top dressing of urea after irrigation helps; your Soil Health Card says how much.\n2. Yellow rust: yellow powder in stripes on the leaves that comes off on your finger. This spreads fast in cool, damp weather. Show a leaf to your KVK or agriculture officer this week before spraying anything.\n3. Too much water: yellowing in low patches where water stands. Drain the field and wait before the next irrigation.\n\nIf you tell me which of these it looks like, I can say more.',
      hi: 'गेहूँ के पत्ते पीले होने की आम तौर पर तीन वजहें होती हैं:\n1. नाइट्रोजन की कमी: पहले नीचे के पुराने पत्ते पीले होते हैं। सिंचाई के बाद यूरिया की टॉप ड्रेसिंग से फ़ायदा होता है; कितना डालना है, मृदा स्वास्थ्य कार्ड में लिखा होता है।\n2. पीला रतुआ: पत्तों पर धारियों में पीला पाउडर, जो उँगली पर लग जाता है। यह ठंडे, नम मौसम में तेज़ी से फैलता है। कोई भी दवा छिड़कने से पहले इसी हफ़्ते पत्ता अपने KVK या कृषि अधिकारी को दिखाएँ।\n3. ज़्यादा पानी: नीचे की जगहों पर जहाँ पानी रुकता है, वहाँ पीलापन। पानी निकालें और अगली सिंचाई में रुकें।\n\nबताइए इनमें से किस जैसा लग रहा है, तो और बता सकता हूँ।',
      pa: 'ਕਣਕ ਦੇ ਪੱਤੇ ਪੀਲੇ ਹੋਣ ਦੇ ਆਮ ਤੌਰ ’ਤੇ ਤਿੰਨ ਕਾਰਨ ਹੁੰਦੇ ਹਨ:\n1. ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ: ਪਹਿਲਾਂ ਹੇਠਲੇ ਪੁਰਾਣੇ ਪੱਤੇ ਪੀਲੇ ਹੁੰਦੇ ਹਨ। ਪਾਣੀ ਲਾਉਣ ਤੋਂ ਬਾਅਦ ਯੂਰੀਆ ਦਾ ਛਿੱਟਾ ਫ਼ਾਇਦਾ ਕਰਦਾ ਹੈ; ਕਿੰਨਾ ਪਾਉਣਾ ਹੈ, ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਵਿੱਚ ਲਿਖਿਆ ਹੁੰਦਾ ਹੈ।\n2. ਪੀਲੀ ਕੁੰਗੀ: ਪੱਤਿਆਂ ’ਤੇ ਧਾਰੀਆਂ ਵਿੱਚ ਪੀਲਾ ਧੂੜਾ, ਜੋ ਉਂਗਲ ’ਤੇ ਲੱਗ ਜਾਂਦਾ ਹੈ। ਇਹ ਠੰਢੇ, ਸਿੱਲ੍ਹੇ ਮੌਸਮ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦੀ ਹੈ। ਕੋਈ ਵੀ ਸਪਰੇਅ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਇਸੇ ਹਫ਼ਤੇ ਪੱਤਾ ਆਪਣੇ KVK ਜਾਂ ਖੇਤੀ ਅਫ਼ਸਰ ਨੂੰ ਦਿਖਾਓ।\n3. ਵੱਧ ਪਾਣੀ: ਨੀਵੀਆਂ ਥਾਵਾਂ ’ਤੇ ਜਿੱਥੇ ਪਾਣੀ ਖੜ੍ਹਦਾ ਹੈ, ਉੱਥੇ ਪੀਲਾਪਣ। ਪਾਣੀ ਕੱਢੋ ਤੇ ਅਗਲਾ ਪਾਣੀ ਲਾਉਣ ਤੋਂ ਰੁਕੋ।\n\nਦੱਸੋ ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਸ ਵਰਗਾ ਲੱਗਦਾ ਹੈ, ਤਾਂ ਹੋਰ ਦੱਸ ਸਕਦਾ ਹਾਂ।',
    },
  },
  {
    match: /drip|sprinkler|ड्रिप|स्प्रिंकलर|ਤੁਪਕਾ|ਡਰਿੱਪ|subsid|सब्सिडी|ਸਬਸਿਡੀ/i,
    sources: ['pmksy'],
    answer: {
      en: 'Drip and sprinkler systems get a subsidy under PMKSY "Per Drop More Crop": up to 55% of the cost for small and marginal farmers (up to 5 acres, roughly) and 45% for others. Many states add their own top-up.\n\nApply on your state agriculture or horticulture department portal, or at the district horticulture office. You will need your land record, Aadhaar, bank passbook and a quotation from a company registered with the department. After an officer checks the installed system, the subsidy is paid.',
      hi: 'ड्रिप और स्प्रिंकलर पर PMKSY “पर ड्रॉप मोर क्रॉप” के तहत सब्सिडी मिलती है: छोटे और सीमांत किसानों को लागत का 55% तक, और बाक़ी किसानों को 45%। कई राज्य अपनी ओर से और जोड़ते हैं।\n\nआवेदन अपने राज्य के कृषि या बागवानी विभाग के पोर्टल पर, या ज़िला बागवानी दफ़्तर में करें। ज़मीन का रिकॉर्ड, आधार, बैंक पासबुक और विभाग में पंजीकृत कंपनी का कोटेशन चाहिए। अधिकारी लगे हुए सिस्टम की जाँच करते हैं, फिर सब्सिडी मिलती है।',
      pa: 'ਤੁਪਕਾ ਤੇ ਫ਼ੁਹਾਰਾ ਸਿੰਚਾਈ ’ਤੇ PMKSY “ਪਰ ਡ੍ਰੌਪ ਮੋਰ ਕ੍ਰੌਪ” ਹੇਠ ਸਬਸਿਡੀ ਮਿਲਦੀ ਹੈ: ਛੋਟੇ ਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨਾਂ ਨੂੰ ਲਾਗਤ ਦਾ 55% ਤੱਕ, ਤੇ ਬਾਕੀ ਕਿਸਾਨਾਂ ਨੂੰ 45%। ਕਈ ਸੂਬੇ ਆਪਣੇ ਵੱਲੋਂ ਹੋਰ ਜੋੜਦੇ ਹਨ।\n\nਅਰਜ਼ੀ ਆਪਣੇ ਸੂਬੇ ਦੇ ਖੇਤੀ ਜਾਂ ਬਾਗ਼ਬਾਨੀ ਵਿਭਾਗ ਦੇ ਪੋਰਟਲ ’ਤੇ, ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਬਾਗ਼ਬਾਨੀ ਦਫ਼ਤਰ ਵਿੱਚ ਦਿਓ। ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ, ਆਧਾਰ, ਬੈਂਕ ਪਾਸਬੁੱਕ ਤੇ ਵਿਭਾਗ ਕੋਲ ਰਜਿਸਟਰਡ ਕੰਪਨੀ ਦੀ ਕੁਟੇਸ਼ਨ ਚਾਹੀਦੀ ਹੈ। ਅਫ਼ਸਰ ਲੱਗੇ ਸਿਸਟਮ ਦੀ ਜਾਂਚ ਕਰਦੇ ਹਨ, ਫਿਰ ਸਬਸਿਡੀ ਮਿਲਦੀ ਹੈ।',
    },
  },
  {
    match: /paddy|dhan|धान|ਝੋਨ|after|बाद|ਬਾਅਦ|sow|बोऊ|ਬੀਜ/i,
    sources: ['soil-health-card'],
    answer: {
      en: 'After paddy, most farmers in Punjab and Haryana sow wheat from late October to mid-November. A few things help:\n• Do not burn the straw. A Happy Seeder or Super Seeder sows wheat straight into it and keeps the moisture.\n• If the field is free early, a short crop of potato, peas or mustard fits before late wheat.\n• Gram (chana) or lentil in part of the field adds nitrogen for the next crop.\n\nGet your soil tested first; the Soil Health Card tells you how much fertiliser the wheat needs.',
      hi: 'धान के बाद पंजाब और हरियाणा में ज़्यादातर किसान अक्टूबर के आख़िर से नवंबर के बीच तक गेहूँ बोते हैं। कुछ बातें काम आती हैं:\n• पराली न जलाएँ। हैप्पी सीडर या सुपर सीडर से गेहूँ सीधे उसी में बो दें, नमी भी बची रहती है।\n• खेत जल्दी ख़ाली हो तो पिछेती गेहूँ से पहले आलू, मटर या सरसों की छोटी फ़सल आ सकती है।\n• खेत के एक हिस्से में चना या मसूर लगाने से अगली फ़सल के लिए नाइट्रोजन बढ़ती है।\n\nपहले मिट्टी की जाँच करवा लें; मृदा स्वास्थ्य कार्ड बताता है कि गेहूँ को कितनी खाद चाहिए।',
      pa: 'ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਪੰਜਾਬ ਤੇ ਹਰਿਆਣਾ ਵਿੱਚ ਬਹੁਤੇ ਕਿਸਾਨ ਅਕਤੂਬਰ ਦੇ ਅਖ਼ੀਰ ਤੋਂ ਅੱਧ ਨਵੰਬਰ ਤੱਕ ਕਣਕ ਬੀਜਦੇ ਹਨ। ਕੁਝ ਗੱਲਾਂ ਕੰਮ ਆਉਂਦੀਆਂ ਹਨ:\n• ਪਰਾਲੀ ਨਾ ਸਾੜੋ। ਹੈਪੀ ਸੀਡਰ ਜਾਂ ਸੁਪਰ ਸੀਡਰ ਨਾਲ ਕਣਕ ਸਿੱਧੀ ਉਸੇ ਵਿੱਚ ਬੀਜ ਦਿਓ, ਨਮੀ ਵੀ ਬਚੀ ਰਹਿੰਦੀ ਹੈ।\n• ਖੇਤ ਛੇਤੀ ਵਿਹਲਾ ਹੋਵੇ ਤਾਂ ਪਿਛੇਤੀ ਕਣਕ ਤੋਂ ਪਹਿਲਾਂ ਆਲੂ, ਮਟਰ ਜਾਂ ਸਰ੍ਹੋਂ ਦੀ ਛੋਟੀ ਫ਼ਸਲ ਆ ਸਕਦੀ ਹੈ।\n• ਖੇਤ ਦੇ ਇੱਕ ਹਿੱਸੇ ਵਿੱਚ ਛੋਲੇ ਜਾਂ ਮਸਰ ਲਾਉਣ ਨਾਲ ਅਗਲੀ ਫ਼ਸਲ ਲਈ ਨਾਈਟ੍ਰੋਜਨ ਵਧਦੀ ਹੈ।\n\nਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਕਰਵਾ ਲਓ; ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਦੱਸਦਾ ਹੈ ਕਿ ਕਣਕ ਨੂੰ ਕਿੰਨੀ ਖਾਦ ਚਾਹੀਦੀ ਹੈ।',
    },
  },
  {
    match: /kcc|credit|loan|क्रेडिट|कर्ज़|लोन|ਕਰਜ਼|ਲੋਨ|ਕ੍ਰੈਡਿਟ/i,
    sources: ['kcc'],
    answer: {
      en: 'With a Kisan Credit Card you can borrow for seed, fertiliser and other farm costs up to ₹3 lakh at 7% interest, which comes down to 4% if you repay on time. Owners, tenants and sharecroppers can all apply.\n\nGo to any bank branch with your Aadhaar, land record (or tenancy agreement) and a photo. If you already get PM-KISAN, ask for the short one-page KCC form.',
      hi: 'किसान क्रेडिट कार्ड से बीज, खाद और खेती के दूसरे ख़र्च के लिए ₹3 लाख तक 7% ब्याज पर कर्ज़ मिलता है, जो समय पर चुकाने पर 4% रह जाता है। ज़मीन मालिक, बटाईदार, सभी आवेदन कर सकते हैं।\n\nआधार, ज़मीन का रिकॉर्ड (या बटाई का करार) और फ़ोटो लेकर किसी भी बैंक शाखा में जाएँ। पीएम-किसान मिलता है तो एक पन्ने का छोटा KCC फ़ॉर्म माँगें।',
      pa: 'ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਨਾਲ ਬੀਜ, ਖਾਦ ਤੇ ਖੇਤੀ ਦੇ ਹੋਰ ਖ਼ਰਚਿਆਂ ਲਈ ₹3 ਲੱਖ ਤੱਕ 7% ਵਿਆਜ ’ਤੇ ਕਰਜ਼ਾ ਮਿਲਦਾ ਹੈ, ਜੋ ਸਮੇਂ ਸਿਰ ਮੋੜਨ ’ਤੇ 4% ਰਹਿ ਜਾਂਦਾ ਹੈ। ਜ਼ਮੀਨ ਮਾਲਕ, ਠੇਕੇ ਵਾਲੇ, ਸਾਰੇ ਅਰਜ਼ੀ ਦੇ ਸਕਦੇ ਹਨ।\n\nਆਧਾਰ, ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ (ਜਾਂ ਠੇਕੇ ਦਾ ਇਕਰਾਰ) ਤੇ ਫ਼ੋਟੋ ਲੈ ਕੇ ਕਿਸੇ ਵੀ ਬੈਂਕ ਸ਼ਾਖਾ ਜਾਓ। ਪੀਐਮ-ਕਿਸਾਨ ਮਿਲਦਾ ਹੈ ਤਾਂ ਇੱਕ ਪੰਨੇ ਦਾ ਛੋਟਾ KCC ਫ਼ਾਰਮ ਮੰਗੋ।',
    },
  },
  {
    match: /insur|bima|बीमा|ਬੀਮਾ|hail|ओले|ਗੜੇ|claim|क्लेम|ਕਲੇਮ/i,
    sources: ['pmfby'],
    answer: {
      en: 'Under the crop insurance scheme (PMFBY) you pay 2% of the insured amount for kharif crops and 1.5% for rabi crops; the government pays the rest of the premium. If hail, flood or pests damage your crop, report it within 72 hours on the Crop Insurance app or the helpline 14447, then the company sends someone to check.\n\nIf you have a crop loan, your bank may already have insured you. Ask the bank for the policy details.',
      hi: 'फ़सल बीमा योजना (PMFBY) में आप खरीफ़ फ़सल पर बीमित रक़म का 2% और रबी पर 1.5% देते हैं; बाक़ी प्रीमियम सरकार भरती है। ओले, बाढ़ या कीट से फ़सल ख़राब हो तो 72 घंटे के अंदर क्रॉप इंश्योरेंस ऐप या हेल्पलाइन 14447 पर बताएँ, फिर कंपनी जाँच के लिए किसी को भेजती है।\n\nफ़सल ऋण लिया है तो हो सकता है बैंक ने आपका बीमा पहले से करवा दिया हो। बैंक से पॉलिसी का ब्योरा माँगें।',
      pa: 'ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY) ਵਿੱਚ ਤੁਸੀਂ ਸਾਉਣੀ ਫ਼ਸਲ ’ਤੇ ਬੀਮੇ ਦੀ ਰਕਮ ਦਾ 2% ਤੇ ਹਾੜ੍ਹੀ ’ਤੇ 1.5% ਦਿੰਦੇ ਹੋ; ਬਾਕੀ ਪ੍ਰੀਮੀਅਮ ਸਰਕਾਰ ਭਰਦੀ ਹੈ। ਗੜੇ, ਹੜ੍ਹ ਜਾਂ ਕੀੜਿਆਂ ਨਾਲ ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋਵੇ ਤਾਂ 72 ਘੰਟਿਆਂ ਵਿੱਚ ਕ੍ਰੌਪ ਇੰਸ਼ੋਰੈਂਸ ਐਪ ਜਾਂ ਹੈਲਪਲਾਈਨ 14447 ’ਤੇ ਦੱਸੋ, ਫਿਰ ਕੰਪਨੀ ਜਾਂਚ ਲਈ ਕਿਸੇ ਨੂੰ ਭੇਜਦੀ ਹੈ।\n\nਫ਼ਸਲੀ ਕਰਜ਼ਾ ਲਿਆ ਹੈ ਤਾਂ ਹੋ ਸਕਦਾ ਹੈ ਬੈਂਕ ਨੇ ਤੁਹਾਡਾ ਬੀਮਾ ਪਹਿਲਾਂ ਹੀ ਕਰਵਾ ਦਿੱਤਾ ਹੋਵੇ। ਬੈਂਕ ਤੋਂ ਪਾਲਿਸੀ ਦਾ ਵੇਰਵਾ ਮੰਗੋ।',
    },
  },
];

const FALLBACK: Canned = {
  match: /./,
  sources: [],
  answer: {
    en: "I don't have enough information to answer that well. Tell me the crop, how old it is and what you see on the plants, or ask your nearest Krishi Vigyan Kendra.",
    hi: 'इसका ठीक जवाब देने के लिए मेरे पास पूरी जानकारी नहीं है। फ़सल, उसकी उम्र और पौधों पर क्या दिख रहा है, बताइए, या पास के कृषि विज्ञान केंद्र से पूछिए।',
    pa: 'ਇਸ ਦਾ ਠੀਕ ਜਵਾਬ ਦੇਣ ਲਈ ਮੇਰੇ ਕੋਲ ਪੂਰੀ ਜਾਣਕਾਰੀ ਨਹੀਂ। ਫ਼ਸਲ, ਉਸ ਦੀ ਉਮਰ ਤੇ ਬੂਟਿਆਂ ’ਤੇ ਕੀ ਦਿਸਦਾ ਹੈ, ਦੱਸੋ, ਜਾਂ ਨੇੜਲੇ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ ਤੋਂ ਪੁੱਛੋ।',
  },
};

const source = (id: string, lang: Lang): Source => {
  const s = SCHEMES.find((x) => x.id === id)!;
  return { id, kind: 'scheme', title: s.short[lang] };
};

function reply(message: string, lang: Lang): { text: string; sources: Source[] } {
  const c = CANNED.find((x) => x.match.test(message)) ?? FALLBACK;
  return { text: c.answer[lang], sources: c.sources.map((id) => source(id, lang)) };
}

const LIMIT_MSG: Tri = {
  en: "You've used today's 30 questions. Ask again after midnight.",
  hi: 'आज के 30 सवाल पूरे हो गए। आधी रात के बाद फिर पूछिए।',
  pa: 'ਅੱਜ ਦੇ 30 ਸਵਾਲ ਪੂਰੇ ਹੋ ਗਏ। ਅੱਧੀ ਰਾਤ ਤੋਂ ਬਾਅਦ ਫਿਰ ਪੁੱਛੋ।',
};
const BAD_LOGIN: Tri = {
  en: "That mobile number or email and password don't match.",
  hi: 'मोबाइल नंबर या ईमेल और पासवर्ड मेल नहीं खाते।',
  pa: 'ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਤੇ ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ।',
};

const blankProfile = (lang: Lang): Profile => ({ name: null, lang, state: null, district: null, lat: null, lon: null, crops: [], farmSizeAcres: null });

interface Account { me: Me; password: string; chats: ChatTurn[] }
const accounts = new Map<string, Account>();
let session: Account | null = null;

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
function seedAccount(): Account {
  const lang: Lang = (q.get('lang') as Lang) || 'hi';
  const qs = ['पीएम-किसान की अगली किस्त कब आएगी?', 'ड्रिप सिंचाई पर सब्सिडी कैसे मिलेगी?', 'गेहूँ के पत्ते पीले पड़ रहे हैं, क्या करूँ?'];
  const chats: ChatTurn[] = qs.map((question, i) => {
    const r = reply(question, 'hi');
    return { id: `seed${i}`, at: minsAgo(60 * 24 * (i + 1)), lang: 'hi', question, answer: r.text, sources: r.sources };
  });
  return {
    password: 'gehun2026',
    chats,
    me: {
      user: { id: 'u1', login: '+919876543210', createdAt: minsAgo(60 * 24 * 40) },
      profile: { name: 'Gurpreet Singh', lang, state: 'Punjab', district: 'Ludhiana', lat: 30.901, lon: 75.857, crops: ['wheat', 'rice', 'potato'], farmSizeAcres: 6 },
    },
  };
}
if (q.get('seed') === 'signedin') {
  const a = seedAccount();
  accounts.set(a.me.user.login, a);
  session = a;
}

function normLogin(login: string): string | null {
  const t = login.trim().toLowerCase();
  if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
  const d = t.replace(/[\s-]/g, '').replace(/^\+?91/, '').replace(/^0/, '');
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

const need = (): Account => {
  if (!session) throw new ApiFail('Sign in first', 401, 'unauthenticated');
  return session;
};

export const mockApi: Api = {
  async signup({ login, password, name, lang }) {
    await wait(500);
    const id = normLogin(login);
    if (!id) throw new ApiFail('Enter a 10-digit mobile number or an email.', 400, 'bad_request');
    if (password.length < 8) throw new ApiFail('The password needs at least 8 characters.', 400, 'bad_request');
    if (accounts.has(id) || id === '+919876543210') throw new ApiFail('Already taken', 409, 'conflict');
    const acc: Account = { password, chats: [], me: { user: { id: `u${accounts.size + 2}`, login: id, createdAt: new Date().toISOString() }, profile: { ...blankProfile(lang), name: name || null } } };
    accounts.set(id, acc);
    session = acc;
    return acc.me;
  },
  async login({ login, password, lang }) {
    await wait(500);
    const id = normLogin(login);
    if (q.get('login') === 'bad') throw new ApiFail(BAD_LOGIN[lang], 401, 'unauthenticated');
    let acc = id ? accounts.get(id) : undefined;
    if (!acc && id === '+919876543210') { acc = seedAccount(); accounts.set(id, acc); }
    if (!acc || acc.password !== password) throw new ApiFail(BAD_LOGIN[lang], 401, 'unauthenticated');
    session = acc;
    return acc.me;
  },
  async logout() { await wait(150); session = null; },
  async me() { await wait(120); return session?.me ?? null; },
  async patchMe(patch) {
    await wait(250);
    const a = need();
    a.me = { ...a.me, profile: { ...a.me.profile, ...patch } };
    return a.me;
  },
  async deleteMe(password) {
    await wait(400);
    const a = need();
    if (a.password !== password) throw new ApiFail('Wrong password', 403, 'forbidden');
    accounts.delete(a.me.user.login);
    session = null;
  },
  async chats(before) {
    await wait(300);
    const a = need();
    const sorted = [...a.chats].sort((x, y) => y.at.localeCompare(x.at));
    const start = before ? sorted.findIndex((c) => c.id === before) + 1 : 0;
    const page = sorted.slice(start, start + 50);
    return { chats: page, more: start + 50 < sorted.length };
  },
  async importChats(turns) {
    await wait(300);
    const a = need();
    const have = new Set(a.chats.map((c) => c.id));
    a.chats.push(...turns.filter((t) => !have.has(t.id)));
  },
  async chat({ message, lang }) {
    const mode = q.get('chat');
    await wait(mode === 'slow' ? 60_000 : 1100);
    if (mode === 'limit') throw new ApiFail(LIMIT_MSG[lang], 429, 'rate_limited', 6 * 3600);
    if (mode === 'error') throw new ApiFail('All providers failed', 503, 'unavailable');
    const r = reply(message, lang);
    const turnId = session ? `t${Date.now()}` : null;
    if (session && turnId) session.chats.push({ id: turnId, at: new Date().toISOString(), lang, question: message, answer: r.text, sources: r.sources });
    const out: ChatReply = { text: r.text, lang, sources: r.sources, provider: lang === 'pa' ? 'gemini' : 'groq', turnId };
    return out;
  },
  async transcribe(_audio, lang) {
    await wait(900);
    const said: Tri = { en: 'When will the next PM-KISAN installment come?', hi: 'पीएम-किसान की अगली किस्त कब आएगी?', pa: 'ਪੀਐਮ-ਕਿਸਾਨ ਦੀ ਅਗਲੀ ਕਿਸ਼ਤ ਕਦੋਂ ਆਵੇਗੀ?' };
    return { text: said[lang], lang };
  },
  async speak() {
    await wait(700);
    if (q.get('voice') === 'asleep' || q.get('voice') === 'none') throw new ApiFail('Voice is waking up', 503, 'unavailable', undefined, 'device');
    return silentWav(1.2);
  },
  async wake() { await wait(50); },
  async schemes(lang) {
    await wait(200);
    return SCHEMES.map((s): Scheme => ({ id: s.id, category: s.category, name: s.name[lang], summary: s.summary[lang], eligibility: s.eligible[lang].join(' '), howToApply: s.steps[lang].join(' '), link: s.link }));
  },
};

/** A short silent WAV, so the Listen button has something real to play in mock mode. */
function silentWav(seconds: number): Blob {
  const rate = 8000;
  const n = Math.round(rate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  return new Blob([buf], { type: 'audio/wav' });
}

// ---- Open-Meteo stand-ins (mock mode only) ---------------------------------

/** A week like Ludhiana in early October: dry and warm, rain on the third afternoon. ?wx=heat|frost for the other warnings. */
export function fakeOpenMeteo(): unknown {
  const mode = q.get('wx');
  const day0 = new Date();
  day0.setHours(0, 0, 0, 0);
  const t0 = day0.getTime();
  const H = 3600_000;
  const maxes = mode === 'heat' ? [41, 42, 40, 38, 37, 39, 40] : mode === 'frost' ? [17, 16, 15, 18, 17, 16, 18] : [32, 31, 27, 29, 30, 31, 31];
  const mins = mode === 'heat' ? [28, 29, 28, 27, 26, 27, 28] : mode === 'frost' ? [4, 2, 3, 5, 6, 4, 5] : [19, 19, 20, 18, 18, 19, 19];
  const rainDay = 2;
  const hourly = { time: [] as number[], temperature_2m: [] as number[], precipitation_probability: [] as number[], precipitation: [] as number[], wind_speed_10m: [] as number[], relative_humidity_2m: [] as number[] };
  for (let i = -30 * 24; i < 7 * 24; i++) {
    const t = t0 + i * H;
    const d = Math.floor(i / 24);
    const h = ((i % 24) + 24) % 24;
    const di = Math.max(0, Math.min(6, d));
    const swing = (Math.sin(((h - 9) / 24) * Math.PI * 2) + 1) / 2;
    const rainy = d === rainDay && h >= 13 && h <= 19;
    hourly.time.push(t / 1000);
    hourly.temperature_2m.push(+(mins[di] + (maxes[di] - mins[di]) * swing).toFixed(1));
    hourly.precipitation_probability.push(rainy ? 75 : d === rainDay && h >= 10 ? 35 : 5);
    hourly.precipitation.push(rainy ? 2.1 : 0);
    hourly.wind_speed_10m.push(+(d === 4 ? 31 : 6 + 5 * swing).toFixed(1));
    hourly.relative_humidity_2m.push(Math.round(rainy ? 88 : 72 - 30 * swing));
  }
  const pastRain = [0, 0, 6, 11, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0];
  const daily = { time: [] as number[], weather_code: [] as number[], temperature_2m_max: [] as number[], temperature_2m_min: [] as number[], precipitation_sum: [] as number[], precipitation_probability_max: [] as number[], wind_speed_10m_max: [] as number[] };
  for (let d = -30; d < 7; d++) {
    const di = Math.max(0, d);
    daily.time.push((t0 + d * 24 * H) / 1000);
    daily.weather_code.push(d === rainDay ? 63 : d === rainDay + 1 ? 3 : d === 0 ? 1 : 2);
    daily.temperature_2m_max.push(maxes[Math.min(6, di)]);
    daily.temperature_2m_min.push(mins[Math.min(6, di)]);
    daily.precipitation_sum.push(d < 0 ? pastRain[d + 30] : d === rainDay ? 14.6 : 0);
    daily.precipitation_probability_max.push(d === rainDay ? 80 : d === rainDay + 1 ? 25 : 5);
    daily.wind_speed_10m_max.push(d === 4 ? 33 : 14);
  }
  const nowH = Math.floor((Date.now() - t0) / H) + 30 * 24;
  return {
    utc_offset_seconds: 19800,
    current: { temperature_2m: hourly.temperature_2m[nowH], apparent_temperature: hourly.temperature_2m[nowH] + 1, relative_humidity_2m: hourly.relative_humidity_2m[nowH], wind_speed_10m: hourly.wind_speed_10m[nowH], weather_code: 1, precipitation: 0 },
    hourly,
    daily,
  };
}

export function fakeGeocode(name: string): unknown[] {
  const all = [
    { id: 1264728, name: 'Ludhiana', admin1: 'Punjab', admin2: 'Ludhiana', latitude: 30.9, longitude: 75.85 },
    { id: 1264729, name: 'Ludhiana Cantonment', admin1: 'Punjab', admin2: 'Ludhiana', latitude: 30.88, longitude: 75.82 },
    { id: 1270642, name: 'Karnal', admin1: 'Haryana', admin2: 'Karnal', latitude: 29.69, longitude: 76.98 },
    { id: 1278710, name: 'Meerut', admin1: 'Uttar Pradesh', admin2: 'Meerut', latitude: 28.98, longitude: 77.71 },
  ];
  const n = name.toLowerCase();
  return all.filter((p) => p.name.toLowerCase().startsWith(n.slice(0, 3)) || /लुधि|ਲੁਧਿ/.test(name)).slice(0, 8);
}
