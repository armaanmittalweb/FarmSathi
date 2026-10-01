import type { Lang } from '../contract';

type Name = Record<Lang, string>;

/** Crop names in the three languages: the crop model's 22 classes, the leaf model's 3 crops, and common northern crops for the profile. */
export const CROPS: Record<string, Name> = {
  // crop model classes (ai-models/data/Crop_recommendation.csv)
  apple: { en: 'Apple', hi: 'सेब', pa: 'ਸੇਬ' },
  banana: { en: 'Banana', hi: 'केला', pa: 'ਕੇਲਾ' },
  blackgram: { en: 'Black gram (urad)', hi: 'उड़द', pa: 'ਮਾਂਹ' },
  chickpea: { en: 'Chickpea (chana)', hi: 'चना', pa: 'ਛੋਲੇ' },
  coconut: { en: 'Coconut', hi: 'नारियल', pa: 'ਨਾਰੀਅਲ' },
  coffee: { en: 'Coffee', hi: 'कॉफ़ी', pa: 'ਕੌਫ਼ੀ' },
  cotton: { en: 'Cotton', hi: 'कपास', pa: 'ਨਰਮਾ (ਕਪਾਹ)' },
  grapes: { en: 'Grapes', hi: 'अंगूर', pa: 'ਅੰਗੂਰ' },
  jute: { en: 'Jute', hi: 'जूट (पटसन)', pa: 'ਪਟਸਨ' },
  kidneybeans: { en: 'Kidney beans (rajma)', hi: 'राजमा', pa: 'ਰਾਜਮਾਂਹ' },
  lentil: { en: 'Lentil (masoor)', hi: 'मसूर', pa: 'ਮਸਰ' },
  maize: { en: 'Maize', hi: 'मक्का', pa: 'ਮੱਕੀ' },
  mango: { en: 'Mango', hi: 'आम', pa: 'ਅੰਬ' },
  mothbeans: { en: 'Moth bean', hi: 'मोठ', pa: 'ਮੋਠ' },
  mungbean: { en: 'Green gram (moong)', hi: 'मूंग', pa: 'ਮੂੰਗੀ' },
  muskmelon: { en: 'Muskmelon', hi: 'खरबूजा', pa: 'ਖ਼ਰਬੂਜ਼ਾ' },
  orange: { en: 'Orange (kinnow)', hi: 'संतरा', pa: 'ਸੰਤਰਾ (ਕਿੰਨੂ)' },
  papaya: { en: 'Papaya', hi: 'पपीता', pa: 'ਪਪੀਤਾ' },
  pigeonpeas: { en: 'Pigeon pea (arhar)', hi: 'अरहर (तुअर)', pa: 'ਅਰਹਰ' },
  pomegranate: { en: 'Pomegranate', hi: 'अनार', pa: 'ਅਨਾਰ' },
  rice: { en: 'Paddy (rice)', hi: 'धान', pa: 'ਝੋਨਾ' },
  watermelon: { en: 'Watermelon', hi: 'तरबूज', pa: 'ਤਰਬੂਜ਼' },
  // leaf model crops
  tomato: { en: 'Tomato', hi: 'टमाटर', pa: 'ਟਮਾਟਰ' },
  potato: { en: 'Potato', hi: 'आलू', pa: 'ਆਲੂ' },
  pepper: { en: 'Bell pepper', hi: 'शिमला मिर्च', pa: 'ਸ਼ਿਮਲਾ ਮਿਰਚ' },
  // common in the north, for the profile
  wheat: { en: 'Wheat', hi: 'गेहूँ', pa: 'ਕਣਕ' },
  mustard: { en: 'Mustard', hi: 'सरसों', pa: 'ਸਰ੍ਹੋਂ' },
  sugarcane: { en: 'Sugarcane', hi: 'गन्ना', pa: 'ਗੰਨਾ' },
  barley: { en: 'Barley', hi: 'जौ', pa: 'ਜੌਂ' },
  bajra: { en: 'Pearl millet (bajra)', hi: 'बाजरा', pa: 'ਬਾਜਰਾ' },
  onion: { en: 'Onion', hi: 'प्याज़', pa: 'ਪਿਆਜ਼' },
};

/** Suggestions offered when adding a crop to the profile (most common first). */
export const PROFILE_CROPS = ['wheat', 'rice', 'cotton', 'sugarcane', 'mustard', 'maize', 'potato', 'chickpea', 'bajra', 'barley', 'tomato', 'onion', 'mungbean', 'pigeonpeas', 'kidneybeans', 'lentil'];

export function cropName(id: string, lang: Lang): string {
  return CROPS[id]?.[lang] ?? id;
}

/** Short name for sentences ("Black gram (urad)" -> "Black gram"). */
export function cropShort(id: string, lang: Lang): string {
  return cropName(id, lang).replace(/\s*\(.*\)$/, '');
}
