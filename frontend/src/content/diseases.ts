import type { Lang } from '../contract';

type T = Record<Lang, string>;
type Steps = Record<Lang, string[]>;

export interface Condition {
  /** The model's class name (leaf.classes.json). */
  label: string;
  crop: 'tomato' | 'potato' | 'pepper';
  /** Slug of the disease, or null for a healthy leaf. */
  disease: string | null;
  name: T;
  /** Spreads fast: act today. */
  urgent?: boolean;
  /** What to do this week. General advice; sprays and doses go through the KVK. */
  steps: Steps;
}

const KVK: T = {
  en: 'Before buying any spray, ask your KVK or agri-input shop for the right product and dose for your crop.',
  hi: 'कोई भी दवा खरीदने से पहले अपने KVK या खाद-दवा की दुकान से अपनी फ़सल के लिए सही दवा और मात्रा पूछ लें।',
  pa: 'ਕੋਈ ਵੀ ਦਵਾਈ ਖ਼ਰੀਦਣ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ KVK ਜਾਂ ਖਾਦ-ਦਵਾਈ ਦੀ ਦੁਕਾਨ ਤੋਂ ਆਪਣੀ ਫ਼ਸਲ ਲਈ ਠੀਕ ਦਵਾਈ ਤੇ ਮਾਤਰਾ ਪੁੱਛ ਲਓ।',
};
const kvk = (s: Steps): Steps => ({ en: [...s.en, KVK.en], hi: [...s.hi, KVK.hi], pa: [...s.pa, KVK.pa] });

const HEALTHY: Steps = {
  en: [
    'Keep checking the lower leaves once a week; most diseases start there.',
    'Water at the base of the plant in the morning, not over the leaves in the evening.',
    'Keep the field free of weeds and fallen leaves.',
  ],
  hi: [
    'हफ़्ते में एक बार नीचे के पत्ते देखते रहें, ज़्यादातर रोग वहीं से शुरू होते हैं।',
    'पानी सुबह पौधे की जड़ में दें, शाम को पत्तों के ऊपर नहीं।',
    'खेत को खरपतवार और गिरे हुए पत्तों से साफ़ रखें।',
  ],
  pa: [
    'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ ਹੇਠਲੇ ਪੱਤੇ ਦੇਖਦੇ ਰਹੋ, ਬਹੁਤੇ ਰੋਗ ਉੱਥੋਂ ਹੀ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹਨ।',
    'ਪਾਣੀ ਸਵੇਰੇ ਬੂਟੇ ਦੀ ਜੜ੍ਹ ਵਿੱਚ ਲਾਓ, ਸ਼ਾਮ ਨੂੰ ਪੱਤਿਆਂ ਉੱਤੇ ਨਹੀਂ।',
    'ਖੇਤ ਨੂੰ ਨਦੀਨਾਂ ਤੇ ਡਿੱਗੇ ਪੱਤਿਆਂ ਤੋਂ ਸਾਫ਼ ਰੱਖੋ।',
  ],
};

const BACTERIAL_SPOT: Steps = kvk({
  en: [
    'Pick off spotted leaves and burn or bury them away from the field.',
    'Water at the base, not over the leaves, and do not work in the field while plants are wet.',
    'Ask about a copper-based spray; it slows the spread but does not cure spotted leaves.',
    'Next season, use certified disease-free seed and change the field.',
  ],
  hi: [
    'धब्बे वाले पत्ते तोड़कर खेत से दूर जला दें या गाड़ दें।',
    'पानी जड़ में दें, पत्तों पर नहीं, और पौधे गीले हों तो खेत में काम न करें।',
    'कॉपर वाली दवा के बारे में पूछें; यह फैलाव धीमा करती है, धब्बे वाले पत्ते ठीक नहीं करती।',
    'अगले मौसम में प्रमाणित रोग-मुक्त बीज लें और खेत बदलें।',
  ],
  pa: [
    'ਧੱਬਿਆਂ ਵਾਲੇ ਪੱਤੇ ਤੋੜ ਕੇ ਖੇਤ ਤੋਂ ਦੂਰ ਸਾੜ ਦਿਓ ਜਾਂ ਦੱਬ ਦਿਓ।',
    'ਪਾਣੀ ਜੜ੍ਹ ਵਿੱਚ ਲਾਓ, ਪੱਤਿਆਂ ’ਤੇ ਨਹੀਂ, ਤੇ ਬੂਟੇ ਗਿੱਲੇ ਹੋਣ ਤਾਂ ਖੇਤ ਵਿੱਚ ਕੰਮ ਨਾ ਕਰੋ।',
    'ਤਾਂਬੇ ਵਾਲੀ ਦਵਾਈ ਬਾਰੇ ਪੁੱਛੋ; ਇਹ ਫੈਲਾਅ ਹੌਲੀ ਕਰਦੀ ਹੈ, ਧੱਬਿਆਂ ਵਾਲੇ ਪੱਤੇ ਠੀਕ ਨਹੀਂ ਕਰਦੀ।',
    'ਅਗਲੇ ਸੀਜ਼ਨ ਪ੍ਰਮਾਣਿਤ ਰੋਗ-ਮੁਕਤ ਬੀਜ ਲਓ ਤੇ ਖੇਤ ਬਦਲੋ।',
  ],
});

const EARLY_BLIGHT: Steps = kvk({
  en: [
    'Remove the lower leaves with brown ring-like spots and destroy them.',
    'Give the crop its full fertiliser; weak, hungry plants get early blight worse.',
    'Ask about a mancozeb or chlorothalonil spray if spots keep spreading upwards.',
    'Do not plant tomato or potato in this field again next season.',
  ],
  hi: [
    'भूरे, छल्ले जैसे धब्बों वाले नीचे के पत्ते हटाकर नष्ट करें।',
    'फ़सल को पूरी खाद दें; कमज़ोर, भूखे पौधों में अगेती झुलसा ज़्यादा लगता है।',
    'धब्बे ऊपर की ओर फैलते रहें तो मैंकोज़ेब या क्लोरोथैलोनिल छिड़काव के बारे में पूछें।',
    'अगले मौसम इस खेत में टमाटर या आलू न लगाएँ।',
  ],
  pa: [
    'ਭੂਰੇ, ਛੱਲੇ ਵਰਗੇ ਧੱਬਿਆਂ ਵਾਲੇ ਹੇਠਲੇ ਪੱਤੇ ਹਟਾ ਕੇ ਨਸ਼ਟ ਕਰੋ।',
    'ਫ਼ਸਲ ਨੂੰ ਪੂਰੀ ਖਾਦ ਦਿਓ; ਕਮਜ਼ੋਰ, ਭੁੱਖੇ ਬੂਟਿਆਂ ਨੂੰ ਅਗੇਤਾ ਝੁਲਸ ਵੱਧ ਲੱਗਦਾ ਹੈ।',
    'ਧੱਬੇ ਉੱਪਰ ਵੱਲ ਫੈਲਦੇ ਰਹਿਣ ਤਾਂ ਮੈਂਕੋਜ਼ੇਬ ਜਾਂ ਕਲੋਰੋਥੈਲੋਨਿਲ ਸਪਰੇਅ ਬਾਰੇ ਪੁੱਛੋ।',
    'ਅਗਲੇ ਸੀਜ਼ਨ ਇਸ ਖੇਤ ਵਿੱਚ ਟਮਾਟਰ ਜਾਂ ਆਲੂ ਨਾ ਲਾਓ।',
  ],
});

const LATE_BLIGHT: Steps = kvk({
  en: [
    'Act today: late blight spreads through a field in days in cool, damp weather.',
    'Pull out badly affected plants, put them in a bag and destroy them away from the field.',
    'Stop evening and overhead watering. Keep the leaves as dry as you can.',
    'Ask your KVK today about a spray such as mancozeb, or cymoxanil with mancozeb, and warn the farmers next to you.',
  ],
  hi: [
    'आज ही कदम उठाएँ: ठंडे, नम मौसम में पछेती झुलसा कुछ ही दिनों में पूरे खेत में फैल जाता है।',
    'ज़्यादा बीमार पौधे उखाड़कर थैले में भरें और खेत से दूर नष्ट करें।',
    'शाम की और ऊपर से सिंचाई बंद करें। पत्तों को जितना हो सके सूखा रखें।',
    'आज ही अपने KVK से मैंकोज़ेब, या साइमोक्सानिल और मैंकोज़ेब जैसे छिड़काव के बारे में पूछें, और पड़ोसी किसानों को भी बताएँ।',
  ],
  pa: [
    'ਅੱਜ ਹੀ ਕਦਮ ਚੁੱਕੋ: ਠੰਢੇ, ਸਿੱਲ੍ਹੇ ਮੌਸਮ ਵਿੱਚ ਪਿਛੇਤਾ ਝੁਲਸ ਕੁਝ ਹੀ ਦਿਨਾਂ ਵਿੱਚ ਸਾਰੇ ਖੇਤ ਵਿੱਚ ਫੈਲ ਜਾਂਦਾ ਹੈ।',
    'ਵੱਧ ਬਿਮਾਰ ਬੂਟੇ ਪੁੱਟ ਕੇ ਥੈਲੇ ਵਿੱਚ ਪਾਓ ਤੇ ਖੇਤ ਤੋਂ ਦੂਰ ਨਸ਼ਟ ਕਰੋ।',
    'ਸ਼ਾਮ ਦਾ ਤੇ ਉੱਪਰੋਂ ਪਾਣੀ ਲਾਉਣਾ ਬੰਦ ਕਰੋ। ਪੱਤਿਆਂ ਨੂੰ ਜਿੰਨਾ ਹੋ ਸਕੇ ਸੁੱਕਾ ਰੱਖੋ।',
    'ਅੱਜ ਹੀ ਆਪਣੇ KVK ਤੋਂ ਮੈਂਕੋਜ਼ੇਬ, ਜਾਂ ਸਾਈਮੋਕਸਾਨਿਲ ਤੇ ਮੈਂਕੋਜ਼ੇਬ ਵਰਗੀ ਸਪਰੇਅ ਬਾਰੇ ਪੁੱਛੋ, ਤੇ ਗੁਆਂਢੀ ਕਿਸਾਨਾਂ ਨੂੰ ਵੀ ਦੱਸੋ।',
  ],
});

export const CONDITIONS: Condition[] = [
  {
    label: 'Pepper,_bell___Bacterial_spot', crop: 'pepper', disease: 'bacterial-spot',
    name: { en: 'Bacterial spot', hi: 'जीवाणु धब्बा रोग', pa: 'ਬੈਕਟੀਰੀਆ ਧੱਬਾ ਰੋਗ' },
    steps: BACTERIAL_SPOT,
  },
  {
    label: 'Pepper,_bell___healthy', crop: 'pepper', disease: null,
    name: { en: 'Healthy', hi: 'स्वस्थ', pa: 'ਸਿਹਤਮੰਦ' },
    steps: HEALTHY,
  },
  {
    label: 'Potato___Early_blight', crop: 'potato', disease: 'early-blight',
    name: { en: 'Early blight', hi: 'अगेती झुलसा', pa: 'ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ' },
    steps: EARLY_BLIGHT,
  },
  {
    label: 'Potato___Late_blight', crop: 'potato', disease: 'late-blight', urgent: true,
    name: { en: 'Late blight', hi: 'पछेती झुलसा', pa: 'ਪਿਛੇਤਾ ਝੁਲਸ ਰੋਗ' },
    steps: LATE_BLIGHT,
  },
  {
    label: 'Potato___healthy', crop: 'potato', disease: null,
    name: { en: 'Healthy', hi: 'स्वस्थ', pa: 'ਸਿਹਤਮੰਦ' },
    steps: HEALTHY,
  },
  {
    label: 'Tomato___Bacterial_spot', crop: 'tomato', disease: 'bacterial-spot',
    name: { en: 'Bacterial spot', hi: 'जीवाणु धब्बा रोग', pa: 'ਬੈਕਟੀਰੀਆ ਧੱਬਾ ਰੋਗ' },
    steps: BACTERIAL_SPOT,
  },
  {
    label: 'Tomato___Early_blight', crop: 'tomato', disease: 'early-blight',
    name: { en: 'Early blight', hi: 'अगेती झुलसा', pa: 'ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ' },
    steps: EARLY_BLIGHT,
  },
  {
    label: 'Tomato___Late_blight', crop: 'tomato', disease: 'late-blight', urgent: true,
    name: { en: 'Late blight', hi: 'पछेती झुलसा', pa: 'ਪਿਛੇਤਾ ਝੁਲਸ ਰੋਗ' },
    steps: LATE_BLIGHT,
  },
  {
    label: 'Tomato___Leaf_Mold', crop: 'tomato', disease: 'leaf-mold',
    name: { en: 'Leaf mould', hi: 'पत्ती फफूँद', pa: 'ਪੱਤਿਆਂ ਦੀ ਉੱਲੀ' },
    steps: kvk({
      en: [
        'Leaf mould loves still, humid air. Prune the lower leaves and side shoots so air moves through the plants.',
        'In a polyhouse or net house, open the sides during the day.',
        'Water in the morning at the base, and remove leaves with olive-green fuzz underneath.',
      ],
      hi: [
        'पत्ती फफूँद रुकी हुई, नम हवा में बढ़ती है। नीचे के पत्ते और फालतू शाखाएँ काटें ताकि पौधों के बीच हवा चले।',
        'पॉलीहाउस या नेट हाउस हो तो दिन में किनारे खोल दें।',
        'पानी सुबह जड़ में दें, और जिन पत्तों के नीचे जैतूनी-हरी रुई जैसी परत हो, उन्हें हटा दें।',
      ],
      pa: [
        'ਪੱਤਿਆਂ ਦੀ ਉੱਲੀ ਖੜ੍ਹੀ, ਸਿੱਲ੍ਹੀ ਹਵਾ ਵਿੱਚ ਵਧਦੀ ਹੈ। ਹੇਠਲੇ ਪੱਤੇ ਤੇ ਫ਼ਾਲਤੂ ਟਾਹਣੀਆਂ ਕੱਟੋ ਤਾਂ ਜੋ ਬੂਟਿਆਂ ਵਿੱਚ ਹਵਾ ਚੱਲੇ।',
        'ਪੌਲੀਹਾਊਸ ਜਾਂ ਨੈੱਟ ਹਾਊਸ ਹੋਵੇ ਤਾਂ ਦਿਨ ਵੇਲੇ ਪਾਸੇ ਖੋਲ੍ਹ ਦਿਓ।',
        'ਪਾਣੀ ਸਵੇਰੇ ਜੜ੍ਹ ਵਿੱਚ ਲਾਓ, ਤੇ ਜਿਨ੍ਹਾਂ ਪੱਤਿਆਂ ਹੇਠਾਂ ਜ਼ੈਤੂਨੀ-ਹਰੀ ਰੂੰ ਵਰਗੀ ਤਹਿ ਹੋਵੇ, ਉਹ ਹਟਾ ਦਿਓ।',
      ],
    }),
  },
  {
    label: 'Tomato___Septoria_leaf_spot', crop: 'tomato', disease: 'septoria-leaf-spot',
    name: { en: 'Septoria leaf spot', hi: 'सेप्टोरिया पत्ती धब्बा', pa: 'ਸੈਪਟੋਰੀਆ ਪੱਤਾ ਧੱਬਾ' },
    steps: kvk({
      en: [
        'Remove the lower leaves with small grey spots that have dark edges.',
        'Spread straw or dry grass under the plants so rain does not splash soil onto the leaves.',
        'Do not grow tomato, potato or brinjal in this field for the next two seasons.',
      ],
      hi: [
        'गहरे किनारे वाले छोटे स्लेटी धब्बों वाले नीचे के पत्ते हटा दें।',
        'पौधों के नीचे पुआल या सूखी घास बिछाएँ ताकि बारिश में मिट्टी उछलकर पत्तों पर न लगे।',
        'अगले दो मौसम इस खेत में टमाटर, आलू या बैंगन न लगाएँ।',
      ],
      pa: [
        'ਗੂੜ੍ਹੇ ਕਿਨਾਰਿਆਂ ਵਾਲੇ ਛੋਟੇ ਸਲੇਟੀ ਧੱਬਿਆਂ ਵਾਲੇ ਹੇਠਲੇ ਪੱਤੇ ਹਟਾ ਦਿਓ।',
        'ਬੂਟਿਆਂ ਹੇਠਾਂ ਪਰਾਲੀ ਜਾਂ ਸੁੱਕਾ ਘਾਹ ਵਿਛਾਓ ਤਾਂ ਜੋ ਮੀਂਹ ਵਿੱਚ ਮਿੱਟੀ ਉੱਛਲ ਕੇ ਪੱਤਿਆਂ ’ਤੇ ਨਾ ਲੱਗੇ।',
        'ਅਗਲੇ ਦੋ ਸੀਜ਼ਨ ਇਸ ਖੇਤ ਵਿੱਚ ਟਮਾਟਰ, ਆਲੂ ਜਾਂ ਬੈਂਗਣ ਨਾ ਲਾਓ।',
      ],
    }),
  },
  {
    label: 'Tomato___Spider_mites Two-spotted_spider_mite', crop: 'tomato', disease: 'spider-mites',
    name: { en: 'Spider mites', hi: 'लाल मकड़ी (माइट)', pa: 'ਲਾਲ ਮੱਕੜੀ (ਜੂੰ)' },
    steps: kvk({
      en: [
        'Look under the leaves for tiny moving dots and fine webs. Mites grow fast in hot, dry weather.',
        'Spray plain water hard on the underside of the leaves, early morning, two or three times this week.',
        'Remove the worst leaves. If mites keep spreading, ask about neem oil or a miticide.',
      ],
      hi: [
        'पत्तों के नीचे छोटे चलते बिंदु और महीन जाला देखें। गरम, सूखे मौसम में माइट तेज़ी से बढ़ते हैं।',
        'इस हफ़्ते दो-तीन बार सुबह-सुबह पत्तों के नीचे की ओर सादे पानी की तेज़ धार मारें।',
        'सबसे ख़राब पत्ते हटा दें। माइट फैलते रहें तो नीम तेल या माइटनाशक दवा के बारे में पूछें।',
      ],
      pa: [
        'ਪੱਤਿਆਂ ਹੇਠਾਂ ਛੋਟੇ ਤੁਰਦੇ ਬਿੰਦੂ ਤੇ ਬਰੀਕ ਜਾਲਾ ਦੇਖੋ। ਗਰਮ, ਖੁਸ਼ਕ ਮੌਸਮ ਵਿੱਚ ਜੂੰਆਂ ਤੇਜ਼ੀ ਨਾਲ ਵਧਦੀਆਂ ਹਨ।',
        'ਇਸ ਹਫ਼ਤੇ ਦੋ-ਤਿੰਨ ਵਾਰ ਤੜਕੇ ਪੱਤਿਆਂ ਦੇ ਹੇਠਲੇ ਪਾਸੇ ਸਾਦੇ ਪਾਣੀ ਦੀ ਤੇਜ਼ ਧਾਰ ਮਾਰੋ।',
        'ਸਭ ਤੋਂ ਮਾੜੇ ਪੱਤੇ ਹਟਾ ਦਿਓ। ਜੂੰਆਂ ਫੈਲਦੀਆਂ ਰਹਿਣ ਤਾਂ ਨਿੰਮ ਦੇ ਤੇਲ ਜਾਂ ਜੂੰ-ਮਾਰ ਦਵਾਈ ਬਾਰੇ ਪੁੱਛੋ।',
      ],
    }),
  },
  {
    label: 'Tomato___Target_Spot', crop: 'tomato', disease: 'target-spot',
    name: { en: 'Target spot', hi: 'टारगेट स्पॉट (गोल धब्बे)', pa: 'ਟਾਰਗੇਟ ਸਪਾਟ (ਗੋਲ ਧੱਬੇ)' },
    steps: kvk({
      en: [
        'Remove leaves with brown spots that have rings, like a target.',
        'Space and prune the plants so the leaves dry quickly after rain or dew.',
        'Clear the crop remains after harvest; the fungus survives on them.',
      ],
      hi: [
        'निशाने जैसे छल्लों वाले भूरे धब्बों वाले पत्ते हटा दें।',
        'पौधों में दूरी रखें और छँटाई करें ताकि बारिश या ओस के बाद पत्ते जल्दी सूखें।',
        'कटाई के बाद फ़सल के अवशेष हटा दें; फफूँद उन्हीं पर बची रहती है।',
      ],
      pa: [
        'ਨਿਸ਼ਾਨੇ ਵਰਗੇ ਛੱਲਿਆਂ ਵਾਲੇ ਭੂਰੇ ਧੱਬਿਆਂ ਵਾਲੇ ਪੱਤੇ ਹਟਾ ਦਿਓ।',
        'ਬੂਟਿਆਂ ਵਿੱਚ ਫ਼ਾਸਲਾ ਰੱਖੋ ਤੇ ਛੰਗਾਈ ਕਰੋ ਤਾਂ ਜੋ ਮੀਂਹ ਜਾਂ ਤ੍ਰੇਲ ਮਗਰੋਂ ਪੱਤੇ ਛੇਤੀ ਸੁੱਕਣ।',
        'ਵਾਢੀ ਤੋਂ ਬਾਅਦ ਫ਼ਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਹਟਾ ਦਿਓ; ਉੱਲੀ ਉਸੇ ’ਤੇ ਬਚੀ ਰਹਿੰਦੀ ਹੈ।',
      ],
    }),
  },
  {
    label: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', crop: 'tomato', disease: 'yellow-leaf-curl-virus', urgent: true,
    name: { en: 'Yellow leaf curl virus', hi: 'पीला पत्ती मोड़ विषाणु', pa: 'ਪੀਲਾ ਪੱਤਾ ਮਰੋੜ ਵਾਇਰਸ' },
    steps: kvk({
      en: [
        'There is no cure for an infected plant. Pull out plants with curled, yellow leaves and destroy them.',
        'The virus is spread by whitefly. Put up yellow sticky traps, about 10 per acre.',
        'Ask your KVK about whitefly control, and next season use resistant varieties and raise seedlings under net.',
      ],
      hi: [
        'बीमार पौधे का कोई इलाज नहीं है। मुड़े, पीले पत्तों वाले पौधे उखाड़कर नष्ट करें।',
        'यह विषाणु सफ़ेद मक्खी से फैलता है। पीले चिपचिपे ट्रैप लगाएँ, एक एकड़ में लगभग 10।',
        'सफ़ेद मक्खी की रोकथाम के बारे में अपने KVK से पूछें, और अगले मौसम रोग-रोधी किस्म लगाएँ और पौध जाली के नीचे तैयार करें।',
      ],
      pa: [
        'ਬਿਮਾਰ ਬੂਟੇ ਦਾ ਕੋਈ ਇਲਾਜ ਨਹੀਂ। ਮੁੜੇ, ਪੀਲੇ ਪੱਤਿਆਂ ਵਾਲੇ ਬੂਟੇ ਪੁੱਟ ਕੇ ਨਸ਼ਟ ਕਰੋ।',
        'ਇਹ ਵਾਇਰਸ ਚਿੱਟੀ ਮੱਖੀ ਨਾਲ ਫੈਲਦਾ ਹੈ। ਪੀਲੇ ਚਿਪਚਿਪੇ ਟ੍ਰੈਪ ਲਾਓ, ਇੱਕ ਏਕੜ ਵਿੱਚ ਲਗਭਗ 10।',
        'ਚਿੱਟੀ ਮੱਖੀ ਦੀ ਰੋਕਥਾਮ ਬਾਰੇ ਆਪਣੇ KVK ਤੋਂ ਪੁੱਛੋ, ਤੇ ਅਗਲੇ ਸੀਜ਼ਨ ਰੋਗ-ਰੋਧਕ ਕਿਸਮ ਲਾਓ ਤੇ ਪਨੀਰੀ ਜਾਲੀ ਹੇਠ ਤਿਆਰ ਕਰੋ।',
      ],
    }),
  },
  {
    label: 'Tomato___Tomato_mosaic_virus', crop: 'tomato', disease: 'mosaic-virus',
    name: { en: 'Mosaic virus', hi: 'मोज़ेक विषाणु', pa: 'ਮੋਜ਼ੇਕ ਵਾਇਰਸ' },
    steps: {
      en: [
        'There is no spray that cures it. Pull out plants with mottled, light-and-dark green leaves and destroy them.',
        'Wash your hands with soap and clean tools before touching healthy plants; it spreads by touch.',
        'Do not smoke or use tobacco while working with the plants. Next season, use fresh certified seed.',
      ],
      hi: [
        'इसे ठीक करने वाली कोई दवा नहीं है। चितकबरे, हल्के-गहरे हरे पत्तों वाले पौधे उखाड़कर नष्ट करें।',
        'स्वस्थ पौधों को छूने से पहले हाथ साबुन से धोएँ और औज़ार साफ़ करें; यह छूने से फैलता है।',
        'पौधों के बीच काम करते समय बीड़ी-तंबाकू न लें। अगले मौसम नया प्रमाणित बीज लें।',
      ],
      pa: [
        'ਇਸ ਨੂੰ ਠੀਕ ਕਰਨ ਵਾਲੀ ਕੋਈ ਦਵਾਈ ਨਹੀਂ। ਚਿਤਕਬਰੇ, ਹਲਕੇ-ਗੂੜ੍ਹੇ ਹਰੇ ਪੱਤਿਆਂ ਵਾਲੇ ਬੂਟੇ ਪੁੱਟ ਕੇ ਨਸ਼ਟ ਕਰੋ।',
        'ਸਿਹਤਮੰਦ ਬੂਟਿਆਂ ਨੂੰ ਛੂਹਣ ਤੋਂ ਪਹਿਲਾਂ ਹੱਥ ਸਾਬਣ ਨਾਲ ਧੋਵੋ ਤੇ ਸੰਦ ਸਾਫ਼ ਕਰੋ; ਇਹ ਛੂਹਣ ਨਾਲ ਫੈਲਦਾ ਹੈ।',
        'ਬੂਟਿਆਂ ਵਿੱਚ ਕੰਮ ਕਰਦਿਆਂ ਤੰਬਾਕੂ ਨਾ ਵਰਤੋ। ਅਗਲੇ ਸੀਜ਼ਨ ਨਵਾਂ ਪ੍ਰਮਾਣਿਤ ਬੀਜ ਲਓ।',
      ],
    },
  },
  {
    label: 'Tomato___healthy', crop: 'tomato', disease: null,
    name: { en: 'Healthy', hi: 'स्वस्थ', pa: 'ਸਿਹਤਮੰਦ' },
    steps: HEALTHY,
  },
];

const BY_LABEL = new Map(CONDITIONS.map((c) => [c.label, c]));
export function condition(label: string): Condition {
  const c = BY_LABEL.get(label);
  if (!c) throw new Error(`Unknown leaf class ${label}`);
  return c;
}
