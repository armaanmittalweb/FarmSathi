/**
 * The models' preprocessing, ported from ai-service.
 *
 * Leaf (vision.py): Image.open(path).convert('RGB').resize((224, 224)) -> float32 0..255, NHWC.
 * PIL's default resize filter is bicubic (a = -0.5) with antialiasing (the kernel widens when
 * shrinking), computed in two separable 8-bit passes with 22-bit fixed-point coefficients. This is a
 * line-for-line port of Pillow's Resample.c (precompute_coeffs, normalize_coeffs_8bpc,
 * ImagingResampleHorizontal_8bpc / Vertical_8bpc), so the bytes match PIL exactly; the parity test
 * checks that on 300 PlantVillage images.
 *
 * Crop (crop_recommend.py): a float32 row in FEATURE_ORDER.
 */
export const LEAF_SIZE = 224;

const PRECISION_BITS = 32 - 8 - 2;
const HALF = 1 << (PRECISION_BITS - 1);
const ONE = 1 << PRECISION_BITS;

function bicubic(x: number): number {
  const a = -0.5;
  if (x < 0) x = -x;
  if (x < 1) return ((a + 2.0) * x - (a + 3.0)) * x * x + 1;
  if (x < 2) return (((x - 5) * x + 8) * x - 4) * a;
  return 0;
}

interface Coeffs { ksize: number; bounds: Int32Array; kk: Int32Array }

function precompute(inSize: number, outSize: number): Coeffs {
  const scale = inSize / outSize;
  const filterscale = scale < 1 ? 1 : scale;
  const support = 2.0 * filterscale;
  const ksize = Math.ceil(support) * 2 + 1;
  const bounds = new Int32Array(outSize * 2);
  const kk = new Int32Array(outSize * ksize);
  const pre = new Float64Array(ksize);
  const ss = 1.0 / filterscale;
  for (let xx = 0; xx < outSize; xx++) {
    const center = (xx + 0.5) * scale;
    let ww = 0;
    let xmin = Math.trunc(center - support + 0.5);
    if (xmin < 0) xmin = 0;
    let xmax = Math.trunc(center + support + 0.5);
    if (xmax > inSize) xmax = inSize;
    xmax -= xmin;
    pre.fill(0);
    for (let x = 0; x < xmax; x++) {
      const w = bicubic((x + xmin - center + 0.5) * ss);
      pre[x] = w;
      ww += w;
    }
    for (let x = 0; x < xmax; x++) if (ww !== 0) pre[x] /= ww;
    for (let x = 0; x < ksize; x++) {
      const v = pre[x];
      kk[xx * ksize + x] = v < 0 ? Math.trunc(-0.5 + v * ONE) : Math.trunc(0.5 + v * ONE);
    }
    bounds[xx * 2] = xmin;
    bounds[xx * 2 + 1] = xmax;
  }
  return { ksize, bounds, kk };
}

function clip8(v: number): number {
  if (v >= ONE * 256) return 255;
  if (v <= 0) return 0;
  return Math.floor(v / ONE);
}

/**
 * Resize interleaved 8-bit pixels (3 = RGB, 4 = RGBA whose alpha is ignored) to outW x outH RGB,
 * exactly as PIL's Image.resize((outW, outH)) does for an RGB image.
 */
export function resizeRGB(src: ArrayLike<number>, w: number, h: number, channels: 3 | 4, outW: number, outH: number): Uint8Array {
  const horiz = precompute(w, outW);
  const vert = precompute(h, outH);
  const needH = outW !== w;
  const needV = outH !== h;

  // The horizontal pass only covers the rows the vertical pass will read (as Pillow does).
  const yFirst = needV ? vert.bounds[0] : 0;
  const yLast = needV ? vert.bounds[outH * 2 - 2] + vert.bounds[outH * 2 - 1] : h;
  const rows = yLast - yFirst;
  const tmp = new Uint8Array(outW * rows * 3);
  if (needH) {
    const { ksize, bounds, kk } = horiz;
    for (let y = 0; y < rows; y++) {
      const srow = (y + yFirst) * w * channels;
      const drow = y * outW * 3;
      for (let xx = 0; xx < outW; xx++) {
        const xmin = bounds[xx * 2];
        const xmax = bounds[xx * 2 + 1];
        const k = xx * ksize;
        let s0 = HALF, s1 = HALF, s2 = HALF;
        for (let x = 0; x < xmax; x++) {
          const c = kk[k + x];
          const p = srow + (x + xmin) * channels;
          s0 += src[p] * c;
          s1 += src[p + 1] * c;
          s2 += src[p + 2] * c;
        }
        const d = drow + xx * 3;
        tmp[d] = clip8(s0);
        tmp[d + 1] = clip8(s1);
        tmp[d + 2] = clip8(s2);
      }
    }
  } else {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < w; x++) {
        const s = ((y + yFirst) * w + x) * channels;
        const d = (y * w + x) * 3;
        tmp[d] = src[s];
        tmp[d + 1] = src[s + 1];
        tmp[d + 2] = src[s + 2];
      }
    }
  }
  if (!needV) return tmp;

  const out = new Uint8Array(outW * outH * 3);
  const { ksize, bounds, kk } = vert;
  for (let yy = 0; yy < outH; yy++) {
    const k = yy * ksize;
    const ymin = bounds[yy * 2] - yFirst;
    const ymax = bounds[yy * 2 + 1];
    for (let xx = 0; xx < outW; xx++) {
      let s0 = HALF, s1 = HALF, s2 = HALF;
      for (let y = 0; y < ymax; y++) {
        const c = kk[k + y];
        const p = ((y + ymin) * outW + xx) * 3;
        s0 += tmp[p] * c;
        s1 += tmp[p + 1] * c;
        s2 += tmp[p + 2] * c;
      }
      const d = (yy * outW + xx) * 3;
      out[d] = clip8(s0);
      out[d + 1] = clip8(s1);
      out[d + 2] = clip8(s2);
    }
  }
  return out;
}

/** Pixels in, model input out: vision.py's whole preprocessing (the model rescales by 1/255 itself). */
export function leafInput(src: ArrayLike<number>, w: number, h: number, channels: 3 | 4): Float32Array {
  return Float32Array.from(resizeRGB(src, w, h, channels, LEAF_SIZE, LEAF_SIZE));
}

/** Soil inputs in crop_recommend.py's FEATURE_ORDER, as the float32 row it builds. */
export const CROP_FEATURES = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall'] as const;
export type CropInput = Record<(typeof CROP_FEATURES)[number], number>;
export function cropInput(v: CropInput): Float32Array {
  return Float32Array.from(CROP_FEATURES.map((f) => v[f]));
}

/** Indices of the k largest probabilities, highest first (ties keep the lower index, like numpy argmax). */
export function topIndices(probs: ArrayLike<number>, k: number): number[] {
  return Array.from({ length: probs.length }, (_, i) => i)
    .sort((a, b) => probs[b] - probs[a] || a - b)
    .slice(0, k);
}
