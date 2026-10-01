import { condition } from '../content/diseases';
import { CROP_FEATURES, LEAF_SIZE, cropInput, leafInput, topIndices, type CropInput } from './preprocess';
import { getSession, ortTensor } from './runtime';
import leafClasses from '../../public/models/leaf.classes.json';
import cropClasses from '../../public/models/crop.classes.json';

/** docs/live/contract.md, "In-browser models". */
export interface LeafResult { top: { label: string; crop: string; disease: string | null; p: number }[]; ms: number }
export interface CropResult { top: { crop: string; p: number }[]; ms: number }

type Progress = (loaded: number, total: number) => void;

/** Largest side we read pixels at; bigger photos are scaled down by the browser first. */
const MAX_SIDE = 1600;

/**
 * Crop to the centred square (the framing guide), read the pixels, then run vision.py's preprocessing
 * (PIL-exact bicubic resize to 224) and the model.
 */
export async function checkLeaf(file: Blob, onProgress?: Progress): Promise<{ result: LeafResult; preview: string }> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const side = Math.min(bmp.width, bmp.height);
  const out = Math.min(side, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const g = canvas.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  bmp.close();
  const px = g.getImageData(0, 0, out, out).data;
  const preview = canvas.toDataURL('image/jpeg', 0.82);

  const session = await getSession('leaf', onProgress);
  const t0 = performance.now();
  const x = leafInput(px, out, out, 4);
  const res = await session.run({ [session.inputNames[0]]: await ortTensor('float32', x, [1, LEAF_SIZE, LEAF_SIZE, 3]) });
  const probs = res[session.outputNames[0]].data as Float32Array;
  const ms = Math.round(performance.now() - t0);
  const top = topIndices(probs, 3).map((i) => {
    const c = condition((leafClasses as string[])[i]);
    return { label: c.label, crop: c.crop, disease: c.disease, p: probs[i] };
  });
  return { result: { top, ms }, preview };
}

export async function adviseCrops(v: CropInput, onProgress?: Progress): Promise<CropResult> {
  const session = await getSession('crop', onProgress);
  const t0 = performance.now();
  const res = await session.run({ features: await ortTensor('float32', cropInput(v), [1, CROP_FEATURES.length]) }, ['probabilities']);
  const probs = res.probabilities.data as Float32Array;
  return { top: topIndices(probs, 3).map((i) => ({ crop: (cropClasses as string[])[i], p: probs[i] })), ms: Math.round(performance.now() - t0) };
}
