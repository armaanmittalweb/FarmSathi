import type { Strings } from '../i18n/en';
import type { CropInput } from '../models/preprocess';
import { CROP_MEDIANS, FEATURES, STATS, TERTILES } from './cropProfiles';

type Level = 'low' | 'mid' | 'high';
type F = (typeof FEATURES)[number];

/** pH uses the agronomy bands; the rest use the dataset's thirds. */
function level(f: F, v: number): Level {
  if (f === 'ph') return v < 6 ? 'low' : v > 7.5 ? 'high' : 'mid';
  const [a, b] = TERTILES[f];
  return v < a ? 'low' : v > b ? 'high' : 'mid';
}

/**
 * One line in words: which of the farmer's conditions this crop typically grows in. Picks the features
 * where the crop's usual level matches the farmer's, preferring the ones that set this crop apart.
 */
export function cropReason(crop: string, input: CropInput, t: Strings): string {
  const med = CROP_MEDIANS[crop];
  if (!med) return '';
  const scored = FEATURES.map((f, i) => {
    const [mean, sd] = STATS[f];
    return { f, crop: level(f, med[i]), user: level(f, input[f]), weight: Math.abs(med[i] - mean) / sd };
  }).sort((a, b) => b.weight - a.weight);
  const match = scored.filter((x) => x.crop === x.user);
  const word = (x: { f: F; user: Level }) => t.soil.traits[x.f][x.user];
  if (match.length >= 2) return t.soil.reason(word(match[0]), word(match[1]));
  if (match.length === 1) return t.soil.reasonOne(word(match[0]));
  return t.soil.reasonOne(word(scored[0]));
}
