// The landing page's words, hand-written per language. Button names come from the app's own strings
// (t.leaf.take, t.soil.submit, ...), so a step always names the button the farmer will actually see.
import type { Lang } from '../contract';
import type { Strings } from '../i18n';
import type { IconName } from '../ui/Icon';

export type ToolId = 'ask' | 'leaf' | 'soil' | 'weather' | 'schemes';

export interface ToolHow {
  id: ToolId;
  path: string;
  icon: IconName;
  /** One line for the overview card. */
  line: string;
  /** What the tool is for, as the section heading. */
  lead: string;
  steps: [string, string, string];
  tip: string;
  cta: string;
  shotAlt: string;
}

export interface LandingCopy {
  eyebrow: string;
  headline: string;
  lede: string;
  primary: string;
  secondary: string;
  facts: [string, string, string];
  toolsTitle: string;
  howTitle: string;
  howLede: string;
  tipLabel: string;
  tools: ToolHow[];
  installTitle: string;
  installBody: string;
  android: { title: string; steps: [string, string, string] };
  iphone: { title: string; steps: [string, string, string] };
  faqTitle: string;
  faq: { q: string; a: string }[];
  madeBy: string;
  source: string;
}

const SITE = 'farmsaathi.amittal.dev';
const q = (s: string) => `“${s}”`;

const en = (t: Strings): LandingCopy => ({
  eyebrow: 'Speak or type · Hindi, Punjabi, English',
  headline: 'Farming answers, in your own language',
  lede: 'Ask about your crops by speaking, check a sick leaf with a photo, see which crops suit your soil, and know when to spray. Free, and no account needed.',
  primary: 'Ask a question',
  secondary: 'See how to use it',
  facts: ['Free, no account needed', 'Leaf and soil checks run on your phone', 'Leaf, soil and schemes work without signal'],
  toolsTitle: 'Five things FarmSaathi does',
  howTitle: 'How to use it',
  howLede: 'Each one takes about a minute. Here is what to tap.',
  tipLabel: 'Tip',
  tools: [
    {
      id: 'ask', path: '/ask', icon: 'ask',
      line: 'Ask by voice or text, and hear the answer read aloud',
      lead: 'Ask anything about crops, weather or schemes, the way you would ask a neighbour.',
      steps: [
        `Open ${q(t.tabs.ask)} and tap the green mic. Speak your question in Hindi, Punjabi or English.`,
        'Tap the mic again when you finish. FarmSaathi writes down what you said and answers in the same language.',
        `Tap ${q(t.ask.listen)} to hear the answer read aloud. Scheme names under an answer open the full details.`,
      ],
      tip: 'Say the crop and what you see. “My wheat leaves are turning yellow from the tips” gets a better answer than “yellow leaves”.',
      cta: `Open ${t.tabs.ask}`,
      shotAlt: 'The Ask screen on a phone: a question and FarmSaathi’s answer, with a Listen button',
    },
    {
      id: 'leaf', path: '/leaf', icon: 'leaf',
      line: 'Photo of a leaf: tomato, potato and pepper checked for disease',
      lead: 'Find out what is wrong with a tomato, potato or bell pepper leaf.',
      steps: [
        'Pick one leaf that shows the problem. Hold it flat, in daylight, out of shadow.',
        `Tap ${q(t.leaf.take)} so the leaf fills the square, or ${q(t.leaf.choose)} to use one you already took.`,
        'Read the most likely disease, how sure the check is, and what to do this week.',
      ],
      tip: 'The photo is checked on your phone and never uploaded. The first check downloads the checker once; after that it works without signal.',
      cta: 'Check a leaf',
      shotAlt: 'A leaf check result on a phone: the photo, the most likely disease and how sure the check is',
    },
    {
      id: 'soil', path: '/soil', icon: 'soil',
      line: 'Soil Health Card numbers in, three suitable crops out',
      lead: 'See which crops suit your field, from your Soil Health Card.',
      steps: [
        'Keep your Soil Health Card handy. You need four numbers from it: N, P, K and pH.',
        `Type them in. Temperature, humidity and rainfall fill in by themselves once you choose your village on the ${q(t.tabs.weather)} tab.`,
        `Tap ${q(t.soil.submit)} to see three crops that suit the soil, and why each one fits.`,
      ],
      tip: 'No card yet? Your nearest KVK or soil testing lab can test a sample. The Soil Health Card page under Schemes explains how to get one.',
      cta: `Open ${t.tabs.soil}`,
      shotAlt: 'Crop suggestions on a phone: three crops ranked for the soil numbers typed in',
    },
    {
      id: 'weather', path: '/weather', icon: 'weather',
      line: '7-day forecast with spraying and watering advice',
      lead: 'Plan spraying and watering around the next seven days.',
      steps: [
        `Tap ${q(t.weather.useLocation)}, or search for your village or the nearest town.`,
        'See today’s temperature, rain chance, wind and humidity, and the week ahead.',
        `Read ${q(t.weather.adviceTitle)}: the best time to spray, days you can skip watering, and heat, frost or wind warnings.`,
      ],
      tip: 'FarmSaathi remembers your village, so next time the forecast opens straight away. The forecast comes from Open-Meteo.',
      cta: 'See the weather',
      shotAlt: 'The weather screen on a phone: today’s temperature and advice for spraying and watering',
    },
    {
      id: 'schemes', path: '/schemes', icon: 'schemes',
      line: 'PM-KISAN, crop insurance, Kisan Credit Card and more, explained plainly',
      lead: 'Understand six central government schemes before you go to the office.',
      steps: [
        'Pick the kind of help you need, like Insurance or Loans, or search by name.',
        'Open a scheme to see what you get, who can get it, how to apply, and the papers to keep ready.',
        `Tap ${q(t.schemes.link)} to apply, or ask FarmSaathi about the scheme for your own case.`,
      ],
      tip: 'Scheme details are saved on the phone, so they open without signal. Amounts and rules change: check the official website before you apply.',
      cta: 'Browse schemes',
      shotAlt: 'A scheme page on a phone: what you get, who can get it and how to apply',
    },
  ],
  installTitle: 'Keep it on your home screen',
  installBody: 'FarmSaathi is a website that installs like an app. No Play Store needed, and it opens even without signal.',
  android: { title: 'Android (Chrome)', steps: [`Open ${SITE} in Chrome.`, 'Tap ⋮ at the top right.', 'Tap “Add to Home screen” or “Install app”.'] },
  iphone: { title: 'iPhone (Safari)', steps: [`Open ${SITE} in Safari.`, 'Tap the Share button.', 'Tap “Add to Home Screen”.'] },
  faqTitle: 'Good to know',
  faq: [
    { q: 'Is it free?', a: 'Yes. Questions are limited to 30 a day on each phone so the service can stay free for everyone. Leaf, soil, weather and schemes have no limit.' },
    { q: 'Do I need an account?', a: 'No. Without one, your chats stay on this phone. An account (a mobile number or email and a password, no OTP) keeps your chats and farm details on any phone.' },
    { q: 'Can I trust the answers?', a: 'Answers are written by a language model that is given FarmSaathi’s farming notes and the scheme rules, and each answer shows which ones it used. It can still be wrong. For spray doses, animal illness or anything risky, ask your Krishi Vigyan Kendra or agriculture officer.' },
    { q: 'How good is the leaf check?', a: 'It knows 15 conditions of tomato, potato and bell pepper leaves, learned from photos of single leaves. A blurry photo or a different crop can fool it, and when it is unsure it says so. Treat it as a first check, not a lab test.' },
    { q: 'What leaves my phone?', a: 'Leaf photos and soil numbers never do. Questions go to the server to be answered, without your name or number. The weather uses only your village’s location.' },
    { q: 'Who can I call for help?', a: 'The Kisan Call Centre: 1800-180-1551. The call is free, every day from 6 am to 10 pm, in your language.' },
  ],
  madeBy: 'Made by Armaan Mittal',
  source: 'Source code',
});

const hi = (t: Strings): LandingCopy => ({
  eyebrow: 'बोलिए या लिखिए · हिंदी, पंजाबी, अंग्रेज़ी',
  headline: 'खेती के सवालों के जवाब, आपकी अपनी भाषा में',
  lede: 'बोलकर फ़सल के बारे में पूछिए, बीमार पत्ते की फ़ोटो से जाँच कीजिए, देखिए आपकी मिट्टी में कौन सी फ़सल अच्छी होगी, और जानिए छिड़काव कब करें। मुफ़्त, और खाते की ज़रूरत नहीं।',
  primary: 'सवाल पूछिए',
  secondary: 'इस्तेमाल का तरीका देखिए',
  facts: ['मुफ़्त, खाते की ज़रूरत नहीं', 'पत्ते और मिट्टी की जाँच आपके फ़ोन पर ही होती है', 'पत्ता, मिट्टी और योजनाएँ बिना नेटवर्क के चलती हैं'],
  toolsTitle: 'फ़ार्मसाथी के पाँच काम',
  howTitle: 'इस्तेमाल कैसे करें',
  howLede: 'हर काम में लगभग एक मिनट लगता है। कहाँ दबाना है, यहाँ देखिए।',
  tipLabel: 'सुझाव',
  tools: [
    {
      id: 'ask', path: '/ask', icon: 'ask',
      line: 'बोलकर या लिखकर पूछिए, और जवाब सुनिए',
      lead: 'फ़सल, मौसम या योजना के बारे में कुछ भी पूछिए, जैसे किसी पड़ोसी से पूछते हैं।',
      steps: [
        `${q(t.tabs.ask)} खोलिए और हरा माइक दबाइए। हिंदी, पंजाबी या अंग्रेज़ी में अपना सवाल बोलिए।`,
        'बोल लें तो माइक फिर से दबाइए। फ़ार्मसाथी आपकी बात लिखता है और उसी भाषा में जवाब देता है।',
        `जवाब सुनने के लिए ${q(t.ask.listen)} दबाइए। जवाब के नीचे योजना के नाम पर दबाकर पूरी जानकारी खोलिए।`,
      ],
      tip: 'फ़सल का नाम और जो दिख रहा है, वह बताइए। “गेहूँ के पत्ते ऊपर से पीले हो रहे हैं” पूछने पर “पीले पत्ते” से बेहतर जवाब मिलता है।',
      cta: `${t.tabs.ask} खोलिए`,
      shotAlt: 'फ़ोन पर पूछिए स्क्रीन: एक सवाल और फ़ार्मसाथी का जवाब, सुनिए बटन के साथ',
    },
    {
      id: 'leaf', path: '/leaf', icon: 'leaf',
      line: 'पत्ते की फ़ोटो से टमाटर, आलू और शिमला मिर्च के रोग की जाँच',
      lead: 'जानिए टमाटर, आलू या शिमला मिर्च के पत्ते में क्या रोग है।',
      steps: [
        'ऐसा एक पत्ता चुनिए जिसमें परेशानी दिख रही हो। उसे दिन की रोशनी में, छाया से दूर, सीधा पकड़िए।',
        `${q(t.leaf.take)} दबाइए ताकि पत्ता पूरे चौकोर में आए, या पहले से खींची फ़ोटो के लिए ${q(t.leaf.choose)} दबाइए।`,
        'सबसे संभावित रोग, जाँच कितनी पक्की है, और इस हफ़्ते क्या करना है, पढ़िए।',
      ],
      tip: 'फ़ोटो की जाँच आपके फ़ोन पर ही होती है, वह कहीं अपलोड नहीं होती। पहली जाँच पर जाँचने वाला हिस्सा एक बार डाउनलोड होता है, फिर बिना नेटवर्क के चलता है।',
      cta: 'पत्ता जाँचिए',
      shotAlt: 'फ़ोन पर पत्ते की जाँच का नतीजा: फ़ोटो, सबसे संभावित रोग और जाँच कितनी पक्की है',
    },
    {
      id: 'soil', path: '/soil', icon: 'soil',
      line: 'मृदा स्वास्थ्य कार्ड के अंक भरिए, तीन सही फ़सलें देखिए',
      lead: 'अपने मृदा स्वास्थ्य कार्ड से जानिए कि आपके खेत में कौन सी फ़सल ठीक रहेगी।',
      steps: [
        'मृदा स्वास्थ्य कार्ड पास रखिए। इसके चार अंक चाहिए: N, P, K और pH।',
        `अंक भरिए। ${q(t.tabs.weather)} टैब में अपना गाँव चुन लेंगे तो तापमान, नमी और बारिश अपने आप भर जाएँगे।`,
        `${q(t.soil.submit)} दबाइए और देखिए कौन सी तीन फ़सलें इस मिट्टी में ठीक हैं, और क्यों।`,
      ],
      tip: 'अभी कार्ड नहीं है? पास का KVK या मिट्टी जाँच लैब नमूना जाँच सकती है। योजनाओं में मृदा स्वास्थ्य कार्ड वाले पेज पर कार्ड बनवाने का तरीका लिखा है।',
      cta: `${t.tabs.soil} खोलिए`,
      shotAlt: 'फ़ोन पर फ़सल सुझाव: भरे गए मिट्टी के अंकों के लिए तीन फ़सलें, क्रम से',
    },
    {
      id: 'weather', path: '/weather', icon: 'weather',
      line: '7 दिन का मौसम, छिड़काव और सिंचाई की सलाह के साथ',
      lead: 'अगले सात दिन देखकर छिड़काव और सिंचाई की योजना बनाइए।',
      steps: [
        `${q(t.weather.useLocation)} दबाइए, या अपना गाँव या पास का शहर खोजिए।`,
        'आज का तापमान, बारिश की संभावना, हवा और नमी देखिए, और पूरा हफ़्ता भी।',
        `${q(t.weather.adviceTitle)} में पढ़िए: छिड़काव का सही समय, किन दिनों सिंचाई छोड़ सकते हैं, और गर्मी, पाले या तेज़ हवा की चेतावनी।`,
      ],
      tip: 'फ़ार्मसाथी आपका गाँव याद रखता है, इसलिए अगली बार मौसम सीधा खुलता है। मौसम की जानकारी Open-Meteo से आती है।',
      cta: 'मौसम देखिए',
      shotAlt: 'फ़ोन पर मौसम स्क्रीन: आज का तापमान और छिड़काव व सिंचाई की सलाह',
    },
    {
      id: 'schemes', path: '/schemes', icon: 'schemes',
      line: 'पीएम-किसान, फ़सल बीमा, किसान क्रेडिट कार्ड और भी, आसान भाषा में',
      lead: 'दफ़्तर जाने से पहले केंद्र सरकार की छह योजनाएँ समझिए।',
      steps: [
        'जिस तरह की मदद चाहिए वह चुनिए, जैसे बीमा या कर्ज़, या नाम से खोजिए।',
        'योजना खोलकर देखिए: क्या मिलता है, किसे मिल सकती है, आवेदन कैसे करें, और कौन से काग़ज़ तैयार रखें।',
        `आवेदन के लिए ${q(t.schemes.link)} दबाइए, या अपने मामले के लिए फ़ार्मसाथी से उस योजना के बारे में पूछिए।`,
      ],
      tip: 'योजनाओं की जानकारी फ़ोन पर सहेजी रहती है, इसलिए बिना नेटवर्क के भी खुलती है। रक़म और नियम बदलते रहते हैं, आवेदन से पहले सरकारी वेबसाइट देख लें।',
      cta: 'योजनाएँ देखिए',
      shotAlt: 'फ़ोन पर योजना का पेज: क्या मिलता है, किसे मिल सकती है और आवेदन कैसे करें',
    },
  ],
  installTitle: 'होम स्क्रीन पर रखिए',
  installBody: 'फ़ार्मसाथी एक वेबसाइट है जो ऐप की तरह फ़ोन पर लग जाती है। प्ले स्टोर की ज़रूरत नहीं, और बिना नेटवर्क के भी खुलती है।',
  android: { title: 'Android (Chrome)', steps: [`Chrome में ${SITE} खोलिए।`, 'ऊपर दाईं ओर ⋮ दबाइए।', '“होम स्क्रीन पर जोड़ें” या “ऐप इंस्टॉल करें” दबाइए।'] },
  iphone: { title: 'iPhone (Safari)', steps: [`Safari में ${SITE} खोलिए।`, 'शेयर बटन दबाइए।', '“होम स्क्रीन पर जोड़ें” दबाइए।'] },
  faqTitle: 'काम की बातें',
  faq: [
    { q: 'क्या यह मुफ़्त है?', a: 'हाँ। सेवा सबके लिए मुफ़्त रहे, इसलिए हर फ़ोन से दिन में 30 सवाल पूछे जा सकते हैं। पत्ता, मिट्टी, मौसम और योजनाओं की कोई सीमा नहीं।' },
    { q: 'क्या खाता बनाना ज़रूरी है?', a: 'नहीं। बिना खाते के आपकी बातचीत इसी फ़ोन पर रहती है। खाता (मोबाइल नंबर या ईमेल और पासवर्ड, कोई OTP नहीं) बनाने पर बातचीत और खेत की जानकारी किसी भी फ़ोन पर मिलती है।' },
    { q: 'क्या जवाबों पर भरोसा करें?', a: 'जवाब एक भाषा मॉडल लिखता है, जिसे फ़ार्मसाथी की खेती की जानकारी और योजनाओं के नियम दिए जाते हैं, और हर जवाब बताता है कि उसने कौन सी जानकारी ली। फिर भी गलती हो सकती है। दवा की मात्रा, पशु की बीमारी या किसी भी जोखिम वाली बात के लिए अपने कृषि विज्ञान केंद्र या कृषि अधिकारी से पूछें।' },
    { q: 'पत्ते की जाँच कितनी सही है?', a: 'यह टमाटर, आलू और शिमला मिर्च के पत्तों की 15 हालतें पहचानता है, जो इसने एक-एक पत्ते की फ़ोटो से सीखी हैं। धुंधली फ़ोटो या कोई और फ़सल इसे भटका सकती है, और जब पक्का न हो तो यह बता देता है। इसे शुरुआती जाँच मानिए, लैब टेस्ट नहीं।' },
    { q: 'मेरे फ़ोन से क्या बाहर जाता है?', a: 'पत्ते की फ़ोटो और मिट्टी के अंक कभी नहीं। सवाल जवाब के लिए सर्वर पर जाते हैं, पर आपका नाम और नंबर उनके साथ नहीं जाता। मौसम के लिए सिर्फ़ आपके गाँव की जगह भेजी जाती है।' },
    { q: 'मदद के लिए कहाँ फ़ोन करें?', a: 'किसान कॉल सेंटर: 1800-180-1551। कॉल मुफ़्त है, हर दिन सुबह 6 से रात 10 बजे तक, आपकी भाषा में।' },
  ],
  madeBy: 'बनाया: अरमान मित्तल',
  source: 'सोर्स कोड',
});

const pa = (t: Strings): LandingCopy => ({
  eyebrow: 'ਬੋਲੋ ਜਾਂ ਲਿਖੋ · ਪੰਜਾਬੀ, ਹਿੰਦੀ, ਅੰਗਰੇਜ਼ੀ',
  headline: 'ਖੇਤੀ ਦੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ, ਤੁਹਾਡੀ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ',
  lede: 'ਬੋਲ ਕੇ ਫ਼ਸਲ ਬਾਰੇ ਪੁੱਛੋ, ਬਿਮਾਰ ਪੱਤੇ ਦੀ ਫ਼ੋਟੋ ਨਾਲ ਜਾਂਚ ਕਰੋ, ਦੇਖੋ ਤੁਹਾਡੀ ਮਿੱਟੀ ਵਿੱਚ ਕਿਹੜੀ ਫ਼ਸਲ ਚੰਗੀ ਹੋਵੇਗੀ, ਤੇ ਜਾਣੋ ਸਪਰੇਅ ਕਦੋਂ ਕਰਨੀ ਹੈ। ਮੁਫ਼ਤ, ਤੇ ਖਾਤੇ ਦੀ ਲੋੜ ਨਹੀਂ।',
  primary: 'ਸਵਾਲ ਪੁੱਛੋ',
  secondary: 'ਵਰਤਣ ਦਾ ਤਰੀਕਾ ਦੇਖੋ',
  facts: ['ਮੁਫ਼ਤ, ਖਾਤੇ ਦੀ ਲੋੜ ਨਹੀਂ', 'ਪੱਤੇ ਤੇ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਤੁਹਾਡੇ ਫ਼ੋਨ ’ਤੇ ਹੀ ਹੁੰਦੀ ਹੈ', 'ਪੱਤਾ, ਮਿੱਟੀ ਤੇ ਸਕੀਮਾਂ ਬਿਨਾਂ ਨੈੱਟਵਰਕ ਚੱਲਦੀਆਂ ਹਨ'],
  toolsTitle: 'ਫਾਰਮਸਾਥੀ ਦੇ ਪੰਜ ਕੰਮ',
  howTitle: 'ਵਰਤੋਂ ਕਿਵੇਂ ਕਰੀਏ',
  howLede: 'ਹਰ ਕੰਮ ਨੂੰ ਲਗਭਗ ਇੱਕ ਮਿੰਟ ਲੱਗਦਾ ਹੈ। ਕਿੱਥੇ ਦਬਾਉਣਾ ਹੈ, ਇੱਥੇ ਦੇਖੋ।',
  tipLabel: 'ਸੁਝਾਅ',
  tools: [
    {
      id: 'ask', path: '/ask', icon: 'ask',
      line: 'ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਪੁੱਛੋ, ਤੇ ਜਵਾਬ ਸੁਣੋ',
      lead: 'ਫ਼ਸਲ, ਮੌਸਮ ਜਾਂ ਸਕੀਮ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ, ਜਿਵੇਂ ਕਿਸੇ ਗੁਆਂਢੀ ਨੂੰ ਪੁੱਛਦੇ ਹੋ।',
      steps: [
        `${q(t.tabs.ask)} ਖੋਲ੍ਹੋ ਤੇ ਹਰਾ ਮਾਈਕ ਦਬਾਓ। ਪੰਜਾਬੀ, ਹਿੰਦੀ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਆਪਣਾ ਸਵਾਲ ਬੋਲੋ।`,
        'ਗੱਲ ਪੂਰੀ ਹੋਣ ’ਤੇ ਮਾਈਕ ਫਿਰ ਦਬਾਓ। ਫਾਰਮਸਾਥੀ ਤੁਹਾਡੀ ਗੱਲ ਲਿਖਦਾ ਹੈ ਤੇ ਉਸੇ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦਿੰਦਾ ਹੈ।',
        `ਜਵਾਬ ਸੁਣਨ ਲਈ ${q(t.ask.listen)} ਦਬਾਓ। ਜਵਾਬ ਦੇ ਹੇਠਾਂ ਸਕੀਮ ਦੇ ਨਾਂ ’ਤੇ ਦਬਾ ਕੇ ਪੂਰੀ ਜਾਣਕਾਰੀ ਖੋਲ੍ਹੋ।`,
      ],
      tip: 'ਫ਼ਸਲ ਦਾ ਨਾਂ ਤੇ ਜੋ ਦਿਸ ਰਿਹਾ ਹੈ, ਉਹ ਦੱਸੋ। “ਕਣਕ ਦੇ ਪੱਤੇ ਸਿਰਿਆਂ ਤੋਂ ਪੀਲੇ ਹੋ ਰਹੇ ਨੇ” ਪੁੱਛਣ ’ਤੇ “ਪੀਲੇ ਪੱਤੇ” ਨਾਲੋਂ ਚੰਗਾ ਜਵਾਬ ਮਿਲਦਾ ਹੈ।',
      cta: `${t.tabs.ask} ਖੋਲ੍ਹੋ`,
      shotAlt: 'ਫ਼ੋਨ ’ਤੇ ਪੁੱਛੋ ਸਕ੍ਰੀਨ: ਇੱਕ ਸਵਾਲ ਤੇ ਫਾਰਮਸਾਥੀ ਦਾ ਜਵਾਬ, ਸੁਣੋ ਬਟਨ ਨਾਲ',
    },
    {
      id: 'leaf', path: '/leaf', icon: 'leaf',
      line: 'ਪੱਤੇ ਦੀ ਫ਼ੋਟੋ ਨਾਲ ਟਮਾਟਰ, ਆਲੂ ਤੇ ਸ਼ਿਮਲਾ ਮਿਰਚ ਦੇ ਰੋਗ ਦੀ ਜਾਂਚ',
      lead: 'ਜਾਣੋ ਟਮਾਟਰ, ਆਲੂ ਜਾਂ ਸ਼ਿਮਲਾ ਮਿਰਚ ਦੇ ਪੱਤੇ ਨੂੰ ਕਿਹੜਾ ਰੋਗ ਹੈ।',
      steps: [
        'ਇੱਕ ਪੱਤਾ ਚੁਣੋ ਜਿਸ ’ਤੇ ਸਮੱਸਿਆ ਦਿਸਦੀ ਹੋਵੇ। ਉਸ ਨੂੰ ਦਿਨ ਦੀ ਰੌਸ਼ਨੀ ਵਿੱਚ, ਛਾਂ ਤੋਂ ਦੂਰ, ਸਿੱਧਾ ਫੜੋ।',
        `${q(t.leaf.take)} ਦਬਾਓ ਤਾਂ ਜੋ ਪੱਤਾ ਪੂਰੇ ਚੌਰਸ ਵਿੱਚ ਆਵੇ, ਜਾਂ ਪਹਿਲਾਂ ਖਿੱਚੀ ਫ਼ੋਟੋ ਲਈ ${q(t.leaf.choose)} ਦਬਾਓ।`,
        'ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਰੋਗ, ਜਾਂਚ ਕਿੰਨੀ ਪੱਕੀ ਹੈ, ਤੇ ਇਸ ਹਫ਼ਤੇ ਕੀ ਕਰਨਾ ਹੈ, ਪੜ੍ਹੋ।',
      ],
      tip: 'ਫ਼ੋਟੋ ਦੀ ਜਾਂਚ ਤੁਹਾਡੇ ਫ਼ੋਨ ’ਤੇ ਹੀ ਹੁੰਦੀ ਹੈ, ਉਹ ਕਿਤੇ ਅੱਪਲੋਡ ਨਹੀਂ ਹੁੰਦੀ। ਪਹਿਲੀ ਜਾਂਚ ’ਤੇ ਜਾਂਚਣ ਵਾਲਾ ਹਿੱਸਾ ਇੱਕ ਵਾਰ ਡਾਊਨਲੋਡ ਹੁੰਦਾ ਹੈ, ਫਿਰ ਬਿਨਾਂ ਨੈੱਟਵਰਕ ਚੱਲਦਾ ਹੈ।',
      cta: 'ਪੱਤਾ ਜਾਂਚੋ',
      shotAlt: 'ਫ਼ੋਨ ’ਤੇ ਪੱਤੇ ਦੀ ਜਾਂਚ ਦਾ ਨਤੀਜਾ: ਫ਼ੋਟੋ, ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਰੋਗ ਤੇ ਜਾਂਚ ਕਿੰਨੀ ਪੱਕੀ ਹੈ',
    },
    {
      id: 'soil', path: '/soil', icon: 'soil',
      line: 'ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਦੇ ਅੰਕ ਭਰੋ, ਤਿੰਨ ਢੁਕਵੀਆਂ ਫ਼ਸਲਾਂ ਦੇਖੋ',
      lead: 'ਆਪਣੇ ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਤੋਂ ਜਾਣੋ ਕਿ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਕਿਹੜੀ ਫ਼ਸਲ ਠੀਕ ਰਹੇਗੀ।',
      steps: [
        'ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਕੋਲ ਰੱਖੋ। ਇਸ ਦੇ ਚਾਰ ਅੰਕ ਚਾਹੀਦੇ ਹਨ: N, P, K ਤੇ pH।',
        `ਅੰਕ ਭਰੋ। ${q(t.tabs.weather)} ਟੈਬ ਵਿੱਚ ਆਪਣਾ ਪਿੰਡ ਚੁਣ ਲਓ ਤਾਂ ਤਾਪਮਾਨ, ਨਮੀ ਤੇ ਮੀਂਹ ਆਪੇ ਭਰ ਜਾਣਗੇ।`,
        `${q(t.soil.submit)} ਦਬਾਓ ਤੇ ਦੇਖੋ ਕਿਹੜੀਆਂ ਤਿੰਨ ਫ਼ਸਲਾਂ ਇਸ ਮਿੱਟੀ ਵਿੱਚ ਠੀਕ ਹਨ, ਤੇ ਕਿਉਂ।`,
      ],
      tip: 'ਹਾਲੇ ਕਾਰਡ ਨਹੀਂ ਹੈ? ਨੇੜਲਾ KVK ਜਾਂ ਮਿੱਟੀ ਜਾਂਚ ਲੈਬ ਨਮੂਨਾ ਜਾਂਚ ਸਕਦੀ ਹੈ। ਸਕੀਮਾਂ ਵਿੱਚ ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਵਾਲੇ ਪੰਨੇ ’ਤੇ ਕਾਰਡ ਬਣਵਾਉਣ ਦਾ ਤਰੀਕਾ ਲਿਖਿਆ ਹੈ।',
      cta: `${t.tabs.soil} ਖੋਲ੍ਹੋ`,
      shotAlt: 'ਫ਼ੋਨ ’ਤੇ ਫ਼ਸਲ ਸੁਝਾਅ: ਭਰੇ ਗਏ ਮਿੱਟੀ ਦੇ ਅੰਕਾਂ ਲਈ ਤਿੰਨ ਫ਼ਸਲਾਂ, ਤਰਤੀਬ ਨਾਲ',
    },
    {
      id: 'weather', path: '/weather', icon: 'weather',
      line: '7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ, ਸਪਰੇਅ ਤੇ ਪਾਣੀ ਦੀ ਸਲਾਹ ਨਾਲ',
      lead: 'ਅਗਲੇ ਸੱਤ ਦਿਨ ਦੇਖ ਕੇ ਸਪਰੇਅ ਤੇ ਪਾਣੀ ਦੀ ਯੋਜਨਾ ਬਣਾਓ।',
      steps: [
        `${q(t.weather.useLocation)} ਦਬਾਓ, ਜਾਂ ਆਪਣਾ ਪਿੰਡ ਜਾਂ ਨੇੜਲਾ ਸ਼ਹਿਰ ਲੱਭੋ।`,
        'ਅੱਜ ਦਾ ਤਾਪਮਾਨ, ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ, ਹਵਾ ਤੇ ਨਮੀ ਦੇਖੋ, ਤੇ ਪੂਰਾ ਹਫ਼ਤਾ ਵੀ।',
        `${q(t.weather.adviceTitle)} ਵਿੱਚ ਪੜ੍ਹੋ: ਸਪਰੇਅ ਦਾ ਸਹੀ ਸਮਾਂ, ਕਿਹੜੇ ਦਿਨ ਪਾਣੀ ਛੱਡ ਸਕਦੇ ਹੋ, ਤੇ ਗਰਮੀ, ਕੋਰੇ ਜਾਂ ਤੇਜ਼ ਹਵਾ ਦੀ ਚਿਤਾਵਨੀ।`,
      ],
      tip: 'ਫਾਰਮਸਾਥੀ ਤੁਹਾਡਾ ਪਿੰਡ ਯਾਦ ਰੱਖਦਾ ਹੈ, ਇਸ ਲਈ ਅਗਲੀ ਵਾਰ ਮੌਸਮ ਸਿੱਧਾ ਖੁੱਲ੍ਹਦਾ ਹੈ। ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ Open-Meteo ਤੋਂ ਆਉਂਦੀ ਹੈ।',
      cta: 'ਮੌਸਮ ਦੇਖੋ',
      shotAlt: 'ਫ਼ੋਨ ’ਤੇ ਮੌਸਮ ਸਕ੍ਰੀਨ: ਅੱਜ ਦਾ ਤਾਪਮਾਨ ਤੇ ਸਪਰੇਅ ਤੇ ਪਾਣੀ ਦੀ ਸਲਾਹ',
    },
    {
      id: 'schemes', path: '/schemes', icon: 'schemes',
      line: 'ਪੀਐਮ-ਕਿਸਾਨ, ਫ਼ਸਲ ਬੀਮਾ, ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਤੇ ਹੋਰ, ਸੌਖੀ ਭਾਸ਼ਾ ਵਿੱਚ',
      lead: 'ਦਫ਼ਤਰ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਕੇਂਦਰ ਸਰਕਾਰ ਦੀਆਂ ਛੇ ਸਕੀਮਾਂ ਸਮਝੋ।',
      steps: [
        'ਜਿਸ ਕਿਸਮ ਦੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ ਉਹ ਚੁਣੋ, ਜਿਵੇਂ ਬੀਮਾ ਜਾਂ ਕਰਜ਼ਾ, ਜਾਂ ਨਾਂ ਨਾਲ ਲੱਭੋ।',
        'ਸਕੀਮ ਖੋਲ੍ਹ ਕੇ ਦੇਖੋ: ਕੀ ਮਿਲਦਾ ਹੈ, ਕਿਸ ਨੂੰ ਮਿਲ ਸਕਦੀ ਹੈ, ਅਰਜ਼ੀ ਕਿਵੇਂ ਦੇਈਏ, ਤੇ ਕਿਹੜੇ ਕਾਗ਼ਜ਼ ਤਿਆਰ ਰੱਖਣੇ ਹਨ।',
        `ਅਰਜ਼ੀ ਲਈ ${q(t.schemes.link)} ਦਬਾਓ, ਜਾਂ ਆਪਣੇ ਮਾਮਲੇ ਲਈ ਫਾਰਮਸਾਥੀ ਨੂੰ ਉਸ ਸਕੀਮ ਬਾਰੇ ਪੁੱਛੋ।`,
      ],
      tip: 'ਸਕੀਮਾਂ ਦੀ ਜਾਣਕਾਰੀ ਫ਼ੋਨ ’ਤੇ ਸਾਂਭੀ ਰਹਿੰਦੀ ਹੈ, ਇਸ ਲਈ ਬਿਨਾਂ ਨੈੱਟਵਰਕ ਵੀ ਖੁੱਲ੍ਹਦੀ ਹੈ। ਰਕਮਾਂ ਤੇ ਨਿਯਮ ਬਦਲਦੇ ਰਹਿੰਦੇ ਹਨ, ਅਰਜ਼ੀ ਤੋਂ ਪਹਿਲਾਂ ਸਰਕਾਰੀ ਵੈੱਬਸਾਈਟ ਦੇਖ ਲਓ।',
      cta: 'ਸਕੀਮਾਂ ਦੇਖੋ',
      shotAlt: 'ਫ਼ੋਨ ’ਤੇ ਸਕੀਮ ਦਾ ਪੰਨਾ: ਕੀ ਮਿਲਦਾ ਹੈ, ਕਿਸ ਨੂੰ ਮਿਲ ਸਕਦੀ ਹੈ ਤੇ ਅਰਜ਼ੀ ਕਿਵੇਂ ਦੇਈਏ',
    },
  ],
  installTitle: 'ਹੋਮ ਸਕ੍ਰੀਨ ’ਤੇ ਰੱਖੋ',
  installBody: 'ਫਾਰਮਸਾਥੀ ਇੱਕ ਵੈੱਬਸਾਈਟ ਹੈ ਜੋ ਐਪ ਵਾਂਗ ਫ਼ੋਨ ’ਤੇ ਲੱਗ ਜਾਂਦੀ ਹੈ। ਪਲੇ ਸਟੋਰ ਦੀ ਲੋੜ ਨਹੀਂ, ਤੇ ਬਿਨਾਂ ਨੈੱਟਵਰਕ ਵੀ ਖੁੱਲ੍ਹਦੀ ਹੈ।',
  android: { title: 'Android (Chrome)', steps: [`Chrome ਵਿੱਚ ${SITE} ਖੋਲ੍ਹੋ।`, 'ਉੱਪਰ ਸੱਜੇ ਪਾਸੇ ⋮ ਦਬਾਓ।', '“ਹੋਮ ਸਕ੍ਰੀਨ ’ਤੇ ਸ਼ਾਮਲ ਕਰੋ” ਜਾਂ “ਐਪ ਇੰਸਟਾਲ ਕਰੋ” ਦਬਾਓ।'] },
  iphone: { title: 'iPhone (Safari)', steps: [`Safari ਵਿੱਚ ${SITE} ਖੋਲ੍ਹੋ।`, 'ਸਾਂਝਾ ਕਰੋ ਬਟਨ ਦਬਾਓ।', '“ਹੋਮ ਸਕ੍ਰੀਨ ’ਤੇ ਸ਼ਾਮਲ ਕਰੋ” ਦਬਾਓ।'] },
  faqTitle: 'ਕੰਮ ਦੀਆਂ ਗੱਲਾਂ',
  faq: [
    { q: 'ਕੀ ਇਹ ਮੁਫ਼ਤ ਹੈ?', a: 'ਹਾਂ। ਸੇਵਾ ਸਭ ਲਈ ਮੁਫ਼ਤ ਰਹੇ, ਇਸ ਲਈ ਹਰ ਫ਼ੋਨ ਤੋਂ ਦਿਨ ਵਿੱਚ 30 ਸਵਾਲ ਪੁੱਛੇ ਜਾ ਸਕਦੇ ਹਨ। ਪੱਤਾ, ਮਿੱਟੀ, ਮੌਸਮ ਤੇ ਸਕੀਮਾਂ ਦੀ ਕੋਈ ਹੱਦ ਨਹੀਂ।' },
    { q: 'ਕੀ ਖਾਤਾ ਬਣਾਉਣਾ ਜ਼ਰੂਰੀ ਹੈ?', a: 'ਨਹੀਂ। ਖਾਤੇ ਤੋਂ ਬਿਨਾਂ ਤੁਹਾਡੀਆਂ ਗੱਲਾਂ ਇਸੇ ਫ਼ੋਨ ’ਤੇ ਰਹਿੰਦੀਆਂ ਹਨ। ਖਾਤਾ (ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਤੇ ਪਾਸਵਰਡ, ਕੋਈ OTP ਨਹੀਂ) ਬਣਾਉਣ ’ਤੇ ਗੱਲਾਂ ਤੇ ਖੇਤ ਦੀ ਜਾਣਕਾਰੀ ਕਿਸੇ ਵੀ ਫ਼ੋਨ ’ਤੇ ਮਿਲਦੀ ਹੈ।' },
    { q: 'ਕੀ ਜਵਾਬਾਂ ’ਤੇ ਭਰੋਸਾ ਕਰੀਏ?', a: 'ਜਵਾਬ ਇੱਕ ਭਾਸ਼ਾ ਮਾਡਲ ਲਿਖਦਾ ਹੈ, ਜਿਸ ਨੂੰ ਫਾਰਮਸਾਥੀ ਦੀ ਖੇਤੀ ਜਾਣਕਾਰੀ ਤੇ ਸਕੀਮਾਂ ਦੇ ਨਿਯਮ ਦਿੱਤੇ ਜਾਂਦੇ ਹਨ, ਤੇ ਹਰ ਜਵਾਬ ਦੱਸਦਾ ਹੈ ਕਿ ਉਸ ਨੇ ਕਿਹੜੀ ਜਾਣਕਾਰੀ ਵਰਤੀ। ਫਿਰ ਵੀ ਗ਼ਲਤੀ ਹੋ ਸਕਦੀ ਹੈ। ਦਵਾਈ ਦੀ ਮਾਤਰਾ, ਪਸ਼ੂ ਦੀ ਬਿਮਾਰੀ ਜਾਂ ਕਿਸੇ ਵੀ ਜੋਖਮ ਵਾਲੀ ਗੱਲ ਲਈ ਆਪਣੇ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ ਜਾਂ ਖੇਤੀ ਅਫ਼ਸਰ ਨੂੰ ਪੁੱਛੋ।' },
    { q: 'ਪੱਤੇ ਦੀ ਜਾਂਚ ਕਿੰਨੀ ਸਹੀ ਹੈ?', a: 'ਇਹ ਟਮਾਟਰ, ਆਲੂ ਤੇ ਸ਼ਿਮਲਾ ਮਿਰਚ ਦੇ ਪੱਤਿਆਂ ਦੀਆਂ 15 ਹਾਲਤਾਂ ਪਛਾਣਦਾ ਹੈ, ਜੋ ਇਸ ਨੇ ਇੱਕ-ਇੱਕ ਪੱਤੇ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਤੋਂ ਸਿੱਖੀਆਂ ਹਨ। ਧੁੰਦਲੀ ਫ਼ੋਟੋ ਜਾਂ ਕੋਈ ਹੋਰ ਫ਼ਸਲ ਇਸ ਨੂੰ ਭੁਲੇਖਾ ਪਾ ਸਕਦੀ ਹੈ, ਤੇ ਜਦੋਂ ਪੱਕਾ ਨਾ ਹੋਵੇ ਤਾਂ ਇਹ ਦੱਸ ਦਿੰਦਾ ਹੈ। ਇਸ ਨੂੰ ਮੁੱਢਲੀ ਜਾਂਚ ਮੰਨੋ, ਲੈਬ ਟੈਸਟ ਨਹੀਂ।' },
    { q: 'ਮੇਰੇ ਫ਼ੋਨ ਤੋਂ ਕੀ ਬਾਹਰ ਜਾਂਦਾ ਹੈ?', a: 'ਪੱਤੇ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਤੇ ਮਿੱਟੀ ਦੇ ਅੰਕ ਕਦੇ ਨਹੀਂ। ਸਵਾਲ ਜਵਾਬ ਲਈ ਸਰਵਰ ’ਤੇ ਜਾਂਦੇ ਹਨ, ਪਰ ਤੁਹਾਡਾ ਨਾਂ ਤੇ ਨੰਬਰ ਉਨ੍ਹਾਂ ਨਾਲ ਨਹੀਂ ਜਾਂਦਾ। ਮੌਸਮ ਲਈ ਸਿਰਫ਼ ਤੁਹਾਡੇ ਪਿੰਡ ਦੀ ਥਾਂ ਭੇਜੀ ਜਾਂਦੀ ਹੈ।' },
    { q: 'ਮਦਦ ਲਈ ਕਿੱਥੇ ਫ਼ੋਨ ਕਰੀਏ?', a: 'ਕਿਸਾਨ ਕਾਲ ਸੈਂਟਰ: 1800-180-1551। ਕਾਲ ਮੁਫ਼ਤ ਹੈ, ਹਰ ਰੋਜ਼ ਸਵੇਰੇ 6 ਤੋਂ ਰਾਤ 10 ਵਜੇ ਤੱਕ, ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ।' },
  ],
  madeBy: 'ਬਣਾਇਆ: ਅਰਮਾਨ ਮਿੱਤਲ',
  source: 'ਸੋਰਸ ਕੋਡ',
});

const BY_LANG: Record<Lang, (t: Strings) => LandingCopy> = { en, hi, pa };
export const landingCopy = (lang: Lang, t: Strings): LandingCopy => BY_LANG[lang](t);
