import type { Lang } from '../contract';

type T = Record<Lang, string>;
type L = Record<Lang, string[]>;

/**
 * The six schemes, offline, in three languages. Same ids and categories as backend/data/schemes.json
 * (and the Worker's GET /api/schemes), so chat sources link straight here. Richer than the API shape:
 * the amount on its own line, eligibility as a list, and the steps to apply.
 */
export interface SchemeDoc {
  id: string;
  category: 'income_support' | 'insurance' | 'credit' | 'advisory' | 'irrigation' | 'market_access';
  short: T;
  name: T;
  amount: T;
  summary: T;
  eligible: L;
  steps: L;
  docs: L;
  link: string;
  /** Extra words people search with (any language). */
  keywords: string;
}

export const SCHEMES: SchemeDoc[] = [
  {
    id: 'pm-kisan',
    category: 'income_support',
    short: { en: 'PM-KISAN', hi: 'पीएम-किसान', pa: 'ਪੀਐਮ-ਕਿਸਾਨ' },
    name: { en: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', hi: 'पीएम-किसान सम्मान निधि', pa: 'ਪੀਐਮ-ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ' },
    amount: { en: '₹6,000 a year, in three installments of ₹2,000', hi: 'साल में ₹6,000, ₹2,000 की तीन किस्तों में', pa: 'ਸਾਲ ਵਿੱਚ ₹6,000, ₹2,000 ਦੀਆਂ ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ' },
    summary: {
      en: 'Money paid straight into the bank account of farmer families who own farmland.',
      hi: 'खेती की ज़मीन वाले किसान परिवारों के बैंक खाते में सीधे पैसा।',
      pa: 'ਖੇਤੀ ਵਾਲੀ ਜ਼ਮੀਨ ਦੇ ਮਾਲਕ ਕਿਸਾਨ ਪਰਿਵਾਰਾਂ ਦੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਸਿੱਧਾ ਪੈਸਾ।',
    },
    eligible: {
      en: [
        'Farmer families whose name is on the land records of cultivable land.',
        'Not for income tax payers, government employees, institutional land holders, or professionals such as doctors and lawyers.',
        'e-KYC must be done, and the bank account must be linked to Aadhaar, or the installment stops.',
      ],
      hi: [
        'वे किसान परिवार जिनका नाम खेती की ज़मीन के रिकॉर्ड में है।',
        'आयकर देने वाले, सरकारी कर्मचारी, संस्थागत ज़मीन मालिक, या डॉक्टर-वकील जैसे पेशेवरों के लिए नहीं।',
        'ई-केवाईसी होना ज़रूरी है और बैंक खाता आधार से जुड़ा होना चाहिए, वरना किस्त रुक जाती है।',
      ],
      pa: [
        'ਉਹ ਕਿਸਾਨ ਪਰਿਵਾਰ ਜਿਨ੍ਹਾਂ ਦਾ ਨਾਂ ਖੇਤੀ ਵਾਲੀ ਜ਼ਮੀਨ ਦੇ ਰਿਕਾਰਡ (ਜਮ੍ਹਾਂਬੰਦੀ) ਵਿੱਚ ਹੈ।',
        'ਆਮਦਨ ਕਰ ਦੇਣ ਵਾਲੇ, ਸਰਕਾਰੀ ਮੁਲਾਜ਼ਮ, ਸੰਸਥਾਈ ਜ਼ਮੀਨ ਮਾਲਕ, ਜਾਂ ਡਾਕਟਰ-ਵਕੀਲ ਵਰਗੇ ਪੇਸ਼ੇਵਰਾਂ ਲਈ ਨਹੀਂ।',
        'ਈ-ਕੇਵਾਈਸੀ ਹੋਣੀ ਜ਼ਰੂਰੀ ਹੈ ਤੇ ਬੈਂਕ ਖਾਤਾ ਆਧਾਰ ਨਾਲ ਜੁੜਿਆ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ, ਨਹੀਂ ਤਾਂ ਕਿਸ਼ਤ ਰੁਕ ਜਾਂਦੀ ਹੈ।',
      ],
    },
    steps: {
      en: [
        'Go to pmkisan.gov.in and choose "New Farmer Registration", or visit your nearest Common Service Centre (CSC).',
        'Enter your Aadhaar number, land details and bank account.',
        'Complete e-KYC: with an OTP on your Aadhaar-linked mobile, or by fingerprint at the CSC.',
        'Check "Know Your Status" on the website to see each installment.',
      ],
      hi: [
        'pmkisan.gov.in पर “नया किसान पंजीकरण” चुनें, या पास के जन सेवा केंद्र (CSC) जाएँ।',
        'आधार नंबर, ज़मीन का ब्योरा और बैंक खाता भरें।',
        'ई-केवाईसी पूरा करें: आधार से जुड़े मोबाइल पर OTP से, या CSC पर अँगूठा लगाकर।',
        'हर किस्त देखने के लिए वेबसाइट पर “अपनी स्थिति जानें” देखें।',
      ],
      pa: [
        'pmkisan.gov.in ’ਤੇ “ਨਵਾਂ ਕਿਸਾਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ” ਚੁਣੋ, ਜਾਂ ਨੇੜਲੇ ਸਾਂਝ/ਸੇਵਾ ਕੇਂਦਰ (CSC) ਜਾਓ।',
        'ਆਧਾਰ ਨੰਬਰ, ਜ਼ਮੀਨ ਦਾ ਵੇਰਵਾ ਤੇ ਬੈਂਕ ਖਾਤਾ ਭਰੋ।',
        'ਈ-ਕੇਵਾਈਸੀ ਪੂਰੀ ਕਰੋ: ਆਧਾਰ ਨਾਲ ਜੁੜੇ ਮੋਬਾਈਲ ’ਤੇ OTP ਨਾਲ, ਜਾਂ CSC ’ਤੇ ਅੰਗੂਠਾ ਲਾ ਕੇ।',
        'ਹਰ ਕਿਸ਼ਤ ਦੇਖਣ ਲਈ ਵੈੱਬਸਾਈਟ ’ਤੇ “ਆਪਣਾ ਸਟੇਟਸ ਜਾਣੋ” ਦੇਖੋ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Land record (khasra or khatauni, jamabandi)', 'Bank passbook, account linked to Aadhaar', 'Mobile number'],
      hi: ['आधार कार्ड', 'ज़मीन का रिकॉर्ड (खसरा या खतौनी)', 'बैंक पासबुक, खाता आधार से जुड़ा', 'मोबाइल नंबर'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ (ਜਮ੍ਹਾਂਬੰਦੀ, ਫ਼ਰਦ)', 'ਬੈਂਕ ਪਾਸਬੁੱਕ, ਖਾਤਾ ਆਧਾਰ ਨਾਲ ਜੁੜਿਆ', 'ਮੋਬਾਈਲ ਨੰਬਰ'],
    },
    link: 'https://pmkisan.gov.in',
    keywords: 'pm kisan samman nidhi installment kist kisht 6000 2000 ekyc किस्त सम्मान निधि ਕਿਸ਼ਤ ਸਨਮਾਨ',
  },
  {
    id: 'pmfby',
    category: 'insurance',
    short: { en: 'Crop insurance (PMFBY)', hi: 'फ़सल बीमा (PMFBY)', pa: 'ਫ਼ਸਲ ਬੀਮਾ (PMFBY)' },
    name: { en: 'Pradhan Mantri Fasal Bima Yojana', hi: 'प्रधानमंत्री फ़सल बीमा योजना', pa: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ' },
    amount: {
      en: 'You pay 2% of the insured amount for kharif crops, 1.5% for rabi, 5% for cash and horticulture crops',
      hi: 'आप बीमित रक़म का खरीफ़ फ़सल पर 2%, रबी पर 1.5%, नक़दी और बागवानी फ़सल पर 5% देते हैं',
      pa: 'ਤੁਸੀਂ ਬੀਮੇ ਦੀ ਰਕਮ ਦਾ ਸਾਉਣੀ ਫ਼ਸਲ ’ਤੇ 2%, ਹਾੜ੍ਹੀ ’ਤੇ 1.5%, ਨਕਦੀ ਤੇ ਬਾਗ਼ਬਾਨੀ ਫ਼ਸਲ ’ਤੇ 5% ਦਿੰਦੇ ਹੋ',
    },
    summary: {
      en: 'Low-premium insurance that pays when your crop is lost to drought, flood, hail, pests or disease.',
      hi: 'कम प्रीमियम वाला बीमा, जो सूखा, बाढ़, ओले, कीट या रोग से फ़सल ख़राब होने पर पैसा देता है।',
      pa: 'ਘੱਟ ਪ੍ਰੀਮੀਅਮ ਵਾਲਾ ਬੀਮਾ, ਜੋ ਸੋਕੇ, ਹੜ੍ਹ, ਗੜੇ, ਕੀੜਿਆਂ ਜਾਂ ਰੋਗ ਨਾਲ ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋਣ ’ਤੇ ਪੈਸਾ ਦਿੰਦਾ ਹੈ।',
    },
    eligible: {
      en: [
        'All farmers, owners and tenants, growing a notified crop in a notified area.',
        'Farmers with a crop loan can be enrolled by their bank; they can opt out by telling the bank before the cut-off date.',
      ],
      hi: [
        'अधिसूचित इलाक़े में अधिसूचित फ़सल उगाने वाले सभी किसान, ज़मीन मालिक हों या बटाईदार।',
        'फ़सल ऋण वाले किसानों का बीमा बैंक करवा सकता है; न चाहें तो आख़िरी तारीख़ से पहले बैंक को बता दें।',
      ],
      pa: [
        'ਨੋਟੀਫਾਈਡ ਇਲਾਕੇ ਵਿੱਚ ਨੋਟੀਫਾਈਡ ਫ਼ਸਲ ਉਗਾਉਣ ਵਾਲੇ ਸਾਰੇ ਕਿਸਾਨ, ਮਾਲਕ ਹੋਣ ਜਾਂ ਠੇਕੇਦਾਰ।',
        'ਫ਼ਸਲੀ ਕਰਜ਼ੇ ਵਾਲੇ ਕਿਸਾਨਾਂ ਦਾ ਬੀਮਾ ਬੈਂਕ ਕਰਵਾ ਸਕਦਾ ਹੈ; ਨਾ ਚਾਹੋ ਤਾਂ ਆਖ਼ਰੀ ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ ਬੈਂਕ ਨੂੰ ਦੱਸ ਦਿਓ।',
      ],
    },
    steps: {
      en: [
        'Before the season\'s cut-off date, apply at your bank, a CSC, an insurance agent, or pmfby.gov.in.',
        'Give your crop, the area sown and your land and bank details, and pay your share of the premium.',
        'If your crop is damaged, report it within 72 hours on the Crop Insurance app or the helpline 14447.',
      ],
      hi: [
        'मौसम की आख़िरी तारीख़ से पहले अपने बैंक, CSC, बीमा एजेंट या pmfby.gov.in पर आवेदन करें।',
        'फ़सल, बोया गया रकबा, ज़मीन और बैंक का ब्योरा दें और प्रीमियम का अपना हिस्सा भरें।',
        'फ़सल ख़राब हो तो 72 घंटे के अंदर क्रॉप इंश्योरेंस ऐप या हेल्पलाइन 14447 पर बताएँ।',
      ],
      pa: [
        'ਸੀਜ਼ਨ ਦੀ ਆਖ਼ਰੀ ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ ਬੈਂਕ, CSC, ਬੀਮਾ ਏਜੰਟ ਜਾਂ pmfby.gov.in ’ਤੇ ਅਰਜ਼ੀ ਦਿਓ।',
        'ਫ਼ਸਲ, ਬੀਜਿਆ ਰਕਬਾ, ਜ਼ਮੀਨ ਤੇ ਬੈਂਕ ਦਾ ਵੇਰਵਾ ਦਿਓ ਤੇ ਪ੍ਰੀਮੀਅਮ ਦਾ ਆਪਣਾ ਹਿੱਸਾ ਭਰੋ।',
        'ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋਵੇ ਤਾਂ 72 ਘੰਟਿਆਂ ਵਿੱਚ ਕ੍ਰੌਪ ਇੰਸ਼ੋਰੈਂਸ ਐਪ ਜਾਂ ਹੈਲਪਲਾਈਨ 14447 ’ਤੇ ਦੱਸੋ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Bank passbook', 'Land record, or the tenancy agreement', 'Sowing certificate from the patwari or village officer, if asked'],
      hi: ['आधार कार्ड', 'बैंक पासबुक', 'ज़मीन का रिकॉर्ड, या बटाई का करार', 'माँगा जाए तो पटवारी से बुवाई प्रमाणपत्र'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਬੈਂਕ ਪਾਸਬੁੱਕ', 'ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ, ਜਾਂ ਠੇਕੇ ਦਾ ਇਕਰਾਰ', 'ਮੰਗਿਆ ਜਾਵੇ ਤਾਂ ਪਟਵਾਰੀ ਤੋਂ ਬਿਜਾਈ ਸਰਟੀਫ਼ਿਕੇਟ'],
    },
    link: 'https://pmfby.gov.in',
    keywords: 'fasal bima insurance claim hail flood drought premium बीमा क्लेम ओले ਬੀਮਾ ਕਲੇਮ ਗੜੇ',
  },
  {
    id: 'kcc',
    category: 'credit',
    short: { en: 'Kisan Credit Card', hi: 'किसान क्रेडिट कार्ड', pa: 'ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ' },
    name: { en: 'Kisan Credit Card (KCC)', hi: 'किसान क्रेडिट कार्ड (KCC)', pa: 'ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ (KCC)' },
    amount: {
      en: 'Crop loans up to ₹3 lakh at 7% interest, down to 4% if you repay on time',
      hi: '₹3 लाख तक फ़सल ऋण 7% ब्याज पर, समय पर चुकाने पर सिर्फ़ 4%',
      pa: '₹3 ਲੱਖ ਤੱਕ ਫ਼ਸਲੀ ਕਰਜ਼ਾ 7% ਵਿਆਜ ’ਤੇ, ਸਮੇਂ ਸਿਰ ਮੋੜਨ ’ਤੇ ਸਿਰਫ਼ 4%',
    },
    summary: {
      en: 'A card and account for short-term loans for seed, fertiliser and other farm costs, and for dairy and fisheries.',
      hi: 'बीज, खाद और खेती के दूसरे ख़र्च के लिए, और डेयरी व मछली पालन के लिए अल्पकालिक ऋण का कार्ड और खाता।',
      pa: 'ਬੀਜ, ਖਾਦ ਤੇ ਖੇਤੀ ਦੇ ਹੋਰ ਖ਼ਰਚਿਆਂ ਲਈ, ਤੇ ਡੇਅਰੀ ਤੇ ਮੱਛੀ ਪਾਲਣ ਲਈ ਥੋੜ੍ਹੇ ਸਮੇਂ ਦੇ ਕਰਜ਼ੇ ਦਾ ਕਾਰਡ ਤੇ ਖਾਤਾ।',
    },
    eligible: {
      en: ['Owner farmers, tenant farmers, sharecroppers and oral lessees.', 'Self-help groups and joint liability groups of farmers.', 'Farmers in dairy, poultry and fisheries.'],
      hi: ['ज़मीन मालिक किसान, बटाईदार और ठेके पर खेती करने वाले।', 'किसानों के स्वयं सहायता समूह और संयुक्त देयता समूह।', 'डेयरी, मुर्गी पालन और मछली पालन करने वाले किसान।'],
      pa: ['ਜ਼ਮੀਨ ਮਾਲਕ ਕਿਸਾਨ, ਠੇਕੇ ਤੇ ਹਿੱਸੇ ’ਤੇ ਖੇਤੀ ਕਰਨ ਵਾਲੇ।', 'ਕਿਸਾਨਾਂ ਦੇ ਸਵੈ-ਸਹਾਇਤਾ ਗਰੁੱਪ ਤੇ ਸਾਂਝੀ ਜ਼ਿੰਮੇਵਾਰੀ ਗਰੁੱਪ।', 'ਡੇਅਰੀ, ਮੁਰਗੀ ਪਾਲਣ ਤੇ ਮੱਛੀ ਪਾਲਣ ਕਰਨ ਵਾਲੇ ਕਿਸਾਨ।'],
    },
    steps: {
      en: [
        'Visit any bank branch (public, rural or cooperative) and ask for the KCC form. PM-KISAN farmers get a short one-page form.',
        'Fill in your land and crop details and submit with your documents.',
        'The bank sets your limit from your land and crops; the card usually comes within two weeks.',
        'Repay before the due date to get the lower 4% rate.',
      ],
      hi: [
        'किसी भी बैंक शाखा (सरकारी, ग्रामीण या सहकारी) में जाकर KCC फ़ॉर्म माँगें। पीएम-किसान वाले किसानों के लिए एक पन्ने का छोटा फ़ॉर्म है।',
        'ज़मीन और फ़सल का ब्योरा भरकर काग़ज़ों के साथ जमा करें।',
        'बैंक ज़मीन और फ़सल के हिसाब से सीमा तय करता है; कार्ड आम तौर पर दो हफ़्ते में आ जाता है।',
        '4% की कम दर पाने के लिए तय तारीख़ से पहले चुकाएँ।',
      ],
      pa: [
        'ਕਿਸੇ ਵੀ ਬੈਂਕ ਸ਼ਾਖਾ (ਸਰਕਾਰੀ, ਪੇਂਡੂ ਜਾਂ ਸਹਿਕਾਰੀ) ਵਿੱਚ ਜਾ ਕੇ KCC ਫ਼ਾਰਮ ਮੰਗੋ। ਪੀਐਮ-ਕਿਸਾਨ ਵਾਲੇ ਕਿਸਾਨਾਂ ਲਈ ਇੱਕ ਪੰਨੇ ਦਾ ਛੋਟਾ ਫ਼ਾਰਮ ਹੈ।',
        'ਜ਼ਮੀਨ ਤੇ ਫ਼ਸਲ ਦਾ ਵੇਰਵਾ ਭਰ ਕੇ ਕਾਗ਼ਜ਼ਾਂ ਨਾਲ ਜਮ੍ਹਾਂ ਕਰੋ।',
        'ਬੈਂਕ ਜ਼ਮੀਨ ਤੇ ਫ਼ਸਲ ਮੁਤਾਬਕ ਹੱਦ ਤੈਅ ਕਰਦਾ ਹੈ; ਕਾਰਡ ਆਮ ਤੌਰ ’ਤੇ ਦੋ ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਆ ਜਾਂਦਾ ਹੈ।',
        '4% ਦੀ ਘੱਟ ਦਰ ਲਈ ਤੈਅ ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ ਮੋੜੋ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Land record, or the tenancy agreement', 'Passport-size photo', 'Bank account details'],
      hi: ['आधार कार्ड', 'ज़मीन का रिकॉर्ड, या बटाई का करार', 'पासपोर्ट साइज़ फ़ोटो', 'बैंक खाते का ब्योरा'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ, ਜਾਂ ਠੇਕੇ ਦਾ ਇਕਰਾਰ', 'ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫ਼ੋਟੋ', 'ਬੈਂਕ ਖਾਤੇ ਦਾ ਵੇਰਵਾ'],
    },
    link: 'https://www.myscheme.gov.in/schemes/kcc',
    keywords: 'kcc loan credit card karz interest byaj कर्ज़ लोन ब्याज ਕਰਜ਼ਾ ਲੋਨ ਵਿਆਜ',
  },
  {
    id: 'soil-health-card',
    category: 'advisory',
    short: { en: 'Soil Health Card', hi: 'मृदा स्वास्थ्य कार्ड', pa: 'ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ' },
    name: { en: 'Soil Health Card Scheme', hi: 'मृदा स्वास्थ्य कार्ड योजना', pa: 'ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਯੋਜਨਾ' },
    amount: { en: 'A free soil test and card for your field, every 2 years', hi: 'हर 2 साल में खेत की मुफ़्त मिट्टी जाँच और कार्ड', pa: 'ਹਰ 2 ਸਾਲ ਖੇਤ ਦੀ ਮੁਫ਼ਤ ਮਿੱਟੀ ਜਾਂਚ ਤੇ ਕਾਰਡ' },
    summary: {
      en: 'The card shows your soil\'s N, P, K, pH and micronutrients, and how much fertiliser each crop needs.',
      hi: 'कार्ड में मिट्टी का N, P, K, pH और सूक्ष्म पोषक तत्व, और हर फ़सल के लिए कितनी खाद चाहिए, लिखा होता है।',
      pa: 'ਕਾਰਡ ਵਿੱਚ ਮਿੱਟੀ ਦਾ N, P, K, pH ਤੇ ਸੂਖਮ ਤੱਤ, ਤੇ ਹਰ ਫ਼ਸਲ ਲਈ ਕਿੰਨੀ ਖਾਦ ਚਾਹੀਦੀ ਹੈ, ਲਿਖਿਆ ਹੁੰਦਾ ਹੈ।',
    },
    eligible: {
      en: ['Every farmer with land. There is no fee.'],
      hi: ['ज़मीन वाला हर किसान। कोई फ़ीस नहीं।'],
      pa: ['ਜ਼ਮੀਨ ਵਾਲਾ ਹਰ ਕਿਸਾਨ। ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ।'],
    },
    steps: {
      en: [
        'Ask at your block agriculture office or KVK for a soil sample to be taken, ideally after harvest and before sowing.',
        'The field staff take a sample from your field and send it to a soil testing lab.',
        'Collect the card, or download it from soilhealth.dac.gov.in with your mobile number.',
        'Type the N, P, K and pH from the card into the Soil tab to see crops that suit it.',
      ],
      hi: [
        'अपने ब्लॉक कृषि दफ़्तर या KVK में मिट्टी का नमूना लेने के लिए कहें, अच्छा है कटाई के बाद और बुवाई से पहले।',
        'कर्मचारी आपके खेत से नमूना लेकर मिट्टी जाँच लैब भेजते हैं।',
        'कार्ड ले लें, या soilhealth.dac.gov.in से अपने मोबाइल नंबर से डाउनलोड करें।',
        'कार्ड के N, P, K और pH “मिट्टी” टैब में भरें और देखें कौन सी फ़सलें ठीक रहेंगी।',
      ],
      pa: [
        'ਆਪਣੇ ਬਲਾਕ ਖੇਤੀ ਦਫ਼ਤਰ ਜਾਂ KVK ਵਿੱਚ ਮਿੱਟੀ ਦਾ ਨਮੂਨਾ ਲੈਣ ਲਈ ਕਹੋ, ਚੰਗਾ ਹੈ ਵਾਢੀ ਤੋਂ ਬਾਅਦ ਤੇ ਬਿਜਾਈ ਤੋਂ ਪਹਿਲਾਂ।',
        'ਮੁਲਾਜ਼ਮ ਤੁਹਾਡੇ ਖੇਤ ’ਚੋਂ ਨਮੂਨਾ ਲੈ ਕੇ ਮਿੱਟੀ ਜਾਂਚ ਲੈਬ ਭੇਜਦੇ ਹਨ।',
        'ਕਾਰਡ ਲੈ ਲਓ, ਜਾਂ soilhealth.dac.gov.in ਤੋਂ ਆਪਣੇ ਮੋਬਾਈਲ ਨੰਬਰ ਨਾਲ ਡਾਊਨਲੋਡ ਕਰੋ।',
        'ਕਾਰਡ ਦੇ N, P, K ਤੇ pH “ਮਿੱਟੀ” ਟੈਬ ਵਿੱਚ ਭਰੋ ਤੇ ਦੇਖੋ ਕਿਹੜੀਆਂ ਫ਼ਸਲਾਂ ਠੀਕ ਰਹਿਣਗੀਆਂ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Mobile number', 'Field details (khasra number)'],
      hi: ['आधार कार्ड', 'मोबाइल नंबर', 'खेत का ब्योरा (खसरा नंबर)'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਮੋਬਾਈਲ ਨੰਬਰ', 'ਖੇਤ ਦਾ ਵੇਰਵਾ (ਖਸਰਾ ਨੰਬਰ)'],
    },
    link: 'https://soilhealth.dac.gov.in',
    keywords: 'soil test mitti card npk ph fertiliser khad मिट्टी जाँच खाद ਮਿੱਟੀ ਜਾਂਚ ਖਾਦ',
  },
  {
    id: 'pmksy',
    category: 'irrigation',
    short: { en: 'Drip and sprinkler subsidy (PMKSY)', hi: 'ड्रिप-स्प्रिंकलर सब्सिडी (PMKSY)', pa: 'ਤੁਪਕਾ-ਫ਼ੁਹਾਰਾ ਸਬਸਿਡੀ (PMKSY)' },
    name: { en: 'Pradhan Mantri Krishi Sinchayee Yojana: Per Drop More Crop', hi: 'प्रधानमंत्री कृषि सिंचाई योजना: पर ड्रॉप मोर क्रॉप', pa: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕ੍ਰਿਸ਼ੀ ਸਿੰਚਾਈ ਯੋਜਨਾ: ਪਰ ਡ੍ਰੌਪ ਮੋਰ ਕ੍ਰੌਪ' },
    amount: {
      en: 'Up to 55% of the cost of drip or sprinkler for small and marginal farmers, 45% for others',
      hi: 'छोटे और सीमांत किसानों को ड्रिप या स्प्रिंकलर की लागत का 55% तक, बाक़ी को 45%',
      pa: 'ਛੋਟੇ ਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨਾਂ ਨੂੰ ਤੁਪਕਾ ਜਾਂ ਫ਼ੁਹਾਰਾ ਸਿੰਚਾਈ ਦੀ ਲਾਗਤ ਦਾ 55% ਤੱਕ, ਬਾਕੀਆਂ ਨੂੰ 45%',
    },
    summary: {
      en: 'Help to buy drip and sprinkler systems, which save water and fertiliser.',
      hi: 'ड्रिप और स्प्रिंकलर लगवाने में मदद, जिनसे पानी और खाद दोनों बचते हैं।',
      pa: 'ਤੁਪਕਾ ਤੇ ਫ਼ੁਹਾਰਾ ਸਿੰਚਾਈ ਲਵਾਉਣ ਵਿੱਚ ਮਦਦ, ਜਿਨ੍ਹਾਂ ਨਾਲ ਪਾਣੀ ਤੇ ਖਾਦ ਦੋਵੇਂ ਬਚਦੇ ਹਨ।',
    },
    eligible: {
      en: ['All farmers with land and a water source.', 'Higher subsidy for small and marginal, SC/ST and women farmers. States may add their own top-up.'],
      hi: ['ज़मीन और पानी के स्रोत वाले सभी किसान।', 'छोटे, सीमांत, अनुसूचित जाति/जनजाति और महिला किसानों को ज़्यादा सब्सिडी। राज्य अपनी ओर से और जोड़ सकते हैं।'],
      pa: ['ਜ਼ਮੀਨ ਤੇ ਪਾਣੀ ਦੇ ਸਰੋਤ ਵਾਲੇ ਸਾਰੇ ਕਿਸਾਨ।', 'ਛੋਟੇ, ਸੀਮਾਂਤ, ਅਨੁਸੂਚਿਤ ਜਾਤੀ/ਜਨਜਾਤੀ ਤੇ ਔਰਤ ਕਿਸਾਨਾਂ ਨੂੰ ਵੱਧ ਸਬਸਿਡੀ। ਸੂਬੇ ਆਪਣੇ ਵੱਲੋਂ ਹੋਰ ਜੋੜ ਸਕਦੇ ਹਨ।'],
    },
    steps: {
      en: [
        'Apply on your state\'s horticulture or agriculture department portal, or at the district office.',
        'Get a quotation from a company registered with the department.',
        'After approval, the system is installed and checked by an officer.',
        'The subsidy is paid into your bank account or to the company.',
      ],
      hi: [
        'अपने राज्य के बागवानी या कृषि विभाग के पोर्टल पर, या ज़िला दफ़्तर में आवेदन करें।',
        'विभाग में पंजीकृत कंपनी से कोटेशन लें।',
        'मंज़ूरी के बाद सिस्टम लगता है और अधिकारी जाँच करते हैं।',
        'सब्सिडी आपके बैंक खाते में या कंपनी को दी जाती है।',
      ],
      pa: [
        'ਆਪਣੇ ਸੂਬੇ ਦੇ ਬਾਗ਼ਬਾਨੀ ਜਾਂ ਖੇਤੀ ਵਿਭਾਗ ਦੇ ਪੋਰਟਲ ’ਤੇ, ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਦਫ਼ਤਰ ਵਿੱਚ ਅਰਜ਼ੀ ਦਿਓ।',
        'ਵਿਭਾਗ ਕੋਲ ਰਜਿਸਟਰਡ ਕੰਪਨੀ ਤੋਂ ਕੁਟੇਸ਼ਨ ਲਓ।',
        'ਮਨਜ਼ੂਰੀ ਤੋਂ ਬਾਅਦ ਸਿਸਟਮ ਲੱਗਦਾ ਹੈ ਤੇ ਅਫ਼ਸਰ ਜਾਂਚ ਕਰਦੇ ਹਨ।',
        'ਸਬਸਿਡੀ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਾਂ ਕੰਪਨੀ ਨੂੰ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Land record', 'Bank passbook', 'Quotation from a registered company', 'Caste certificate, if it applies'],
      hi: ['आधार कार्ड', 'ज़मीन का रिकॉर्ड', 'बैंक पासबुक', 'पंजीकृत कंपनी का कोटेशन', 'जाति प्रमाणपत्र, अगर लागू हो'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ', 'ਬੈਂਕ ਪਾਸਬੁੱਕ', 'ਰਜਿਸਟਰਡ ਕੰਪਨੀ ਦੀ ਕੁਟੇਸ਼ਨ', 'ਜਾਤੀ ਸਰਟੀਫ਼ਿਕੇਟ, ਜੇ ਲਾਗੂ ਹੋਵੇ'],
    },
    link: 'https://pmksy.gov.in',
    keywords: 'drip sprinkler irrigation subsidy water pani sinchai ड्रिप स्प्रिंकलर सिंचाई सब्सिडी ਤੁਪਕਾ ਫ਼ੁਹਾਰਾ ਸਿੰਚਾਈ',
  },
  {
    id: 'enam',
    category: 'market_access',
    short: { en: 'e-NAM online mandi', hi: 'ई-नाम ऑनलाइन मंडी', pa: 'ਈ-ਨਾਮ ਆਨਲਾਈਨ ਮੰਡੀ' },
    name: { en: 'e-NAM (National Agriculture Market)', hi: 'ई-नाम (राष्ट्रीय कृषि बाज़ार)', pa: 'ਈ-ਨਾਮ (ਰਾਸ਼ਟਰੀ ਖੇਤੀ ਬਾਜ਼ਾਰ)' },
    amount: { en: 'Free to join. Buyers from other mandis can bid for your produce', hi: 'जुड़ना मुफ़्त है। दूसरी मंडियों के ख़रीदार भी आपकी उपज पर बोली लगा सकते हैं', pa: 'ਜੁੜਨਾ ਮੁਫ਼ਤ ਹੈ। ਹੋਰ ਮੰਡੀਆਂ ਦੇ ਖ਼ਰੀਦਦਾਰ ਵੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ’ਤੇ ਬੋਲੀ ਲਾ ਸਕਦੇ ਹਨ' },
    summary: {
      en: 'An online trading system that links mandis across India, so you see prices openly and get paid into your bank.',
      hi: 'देश भर की मंडियों को जोड़ने वाला ऑनलाइन व्यापार, जिसमें भाव खुलकर दिखते हैं और पैसा बैंक में आता है।',
      pa: 'ਦੇਸ਼ ਭਰ ਦੀਆਂ ਮੰਡੀਆਂ ਨੂੰ ਜੋੜਨ ਵਾਲਾ ਆਨਲਾਈਨ ਵਪਾਰ, ਜਿਸ ਵਿੱਚ ਭਾਅ ਖੁੱਲ੍ਹ ਕੇ ਦਿਸਦੇ ਹਨ ਤੇ ਪੈਸਾ ਬੈਂਕ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।',
    },
    eligible: {
      en: ['Farmers who sell at a mandi that is part of e-NAM.'],
      hi: ['वे किसान जो ई-नाम से जुड़ी मंडी में उपज बेचते हैं।'],
      pa: ['ਉਹ ਕਿਸਾਨ ਜੋ ਈ-ਨਾਮ ਨਾਲ ਜੁੜੀ ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲ ਵੇਚਦੇ ਹਨ।'],
    },
    steps: {
      en: [
        'Register free at enam.gov.in, on the e-NAM app, or at the e-NAM help desk in your mandi.',
        'Bring your produce to the mandi; it is weighed and its quality is checked.',
        'Traders bid online. You see the highest bid and accept it.',
        'Payment comes into your bank account.',
      ],
      hi: [
        'enam.gov.in, ई-नाम ऐप, या मंडी के ई-नाम सहायता केंद्र पर मुफ़्त पंजीकरण करें।',
        'उपज मंडी लाएँ; उसकी तौल और गुणवत्ता जाँच होती है।',
        'व्यापारी ऑनलाइन बोली लगाते हैं। आप सबसे ऊँची बोली देखकर मान लेते हैं।',
        'पैसा आपके बैंक खाते में आता है।',
      ],
      pa: [
        'enam.gov.in, ਈ-ਨਾਮ ਐਪ, ਜਾਂ ਮੰਡੀ ਦੇ ਈ-ਨਾਮ ਸਹਾਇਤਾ ਕੇਂਦਰ ’ਤੇ ਮੁਫ਼ਤ ਰਜਿਸਟਰ ਕਰੋ।',
        'ਫ਼ਸਲ ਮੰਡੀ ਲਿਆਓ; ਉਸ ਦਾ ਤੋਲ ਤੇ ਗੁਣਵੱਤਾ ਜਾਂਚ ਹੁੰਦੀ ਹੈ।',
        'ਵਪਾਰੀ ਆਨਲਾਈਨ ਬੋਲੀ ਲਾਉਂਦੇ ਹਨ। ਤੁਸੀਂ ਸਭ ਤੋਂ ਉੱਚੀ ਬੋਲੀ ਦੇਖ ਕੇ ਮੰਨ ਲੈਂਦੇ ਹੋ।',
        'ਪੈਸਾ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।',
      ],
    },
    docs: {
      en: ['Aadhaar card', 'Bank account details', 'Mobile number'],
      hi: ['आधार कार्ड', 'बैंक खाते का ब्योरा', 'मोबाइल नंबर'],
      pa: ['ਆਧਾਰ ਕਾਰਡ', 'ਬੈਂਕ ਖਾਤੇ ਦਾ ਵੇਰਵਾ', 'ਮੋਬਾਈਲ ਨੰਬਰ'],
    },
    link: 'https://www.enam.gov.in',
    keywords: 'enam mandi market price bhav sell online मंडी भाव बेचना ਮੰਡੀ ਭਾਅ ਵੇਚਣਾ',
  },
];

export const SCHEME_BY_ID = new Map(SCHEMES.map((s) => [s.id, s]));

export function searchSchemes(q: string, lang: Lang, category: string | null): SchemeDoc[] {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return SCHEMES.filter((s) => {
    if (category && s.category !== category) return false;
    if (!terms.length) return true;
    const hay = [s.short[lang], s.name[lang], s.summary[lang], s.amount[lang], s.short.en, s.name.en, s.keywords, ...s.eligible[lang]].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
