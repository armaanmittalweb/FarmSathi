/**
 * Proves the browser pipeline (this repo's TypeScript preprocessing + the converted ONNX models)
 * gives the same answers as ai-service's Python (fixtures from models-web/parity.py).
 * Uses onnxruntime-node, which runs the same ONNX graph and CPU kernels as onnxruntime-web's WASM
 * build, and sharp to decode the JPEGs (its libjpeg-turbo output is checked byte-for-byte against PIL).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { LEAF_SIZE, cropInput, leafInput, resizeRGB, topIndices } from '../src/models/preprocess';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const json = <T,>(p: string): T => JSON.parse(readFileSync(here(p), 'utf8')) as T;
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

interface CropFix { classes: string[]; rows: number[][]; top: number[]; probs: number[][] }
interface LeafFix { classes: string[]; items: { path: string; decodedSha: string; resizedSha: string; top: number; probs: number[] }[] }

describe('crop model parity (2,200 rows)', () => {
  it('matches scikit-learn: same top class on every row, probabilities within 1e-4', async () => {
    const fx = json<CropFix>('./fixtures/crop-parity.json');
    expect(json<string[]>('../public/models/crop.classes.json')).toEqual(fx.classes);
    const s = await ort.InferenceSession.create(here('../public/models/crop.onnx'));
    const C = fx.classes.length;
    let maxDiff = 0;
    let topMismatch = 0;
    const B = 200;
    for (let i = 0; i < fx.rows.length; i += B) {
      const rows = fx.rows.slice(i, i + B);
      const data = new Float32Array(rows.length * 7);
      rows.forEach(([n, p, k, temperature, humidity, ph, rainfall], j) => data.set(cropInput({ n, p, k, temperature, humidity, ph, rainfall }), j * 7));
      const out = await s.run({ features: new ort.Tensor('float32', data, [rows.length, 7]) }, ['probabilities']);
      const probs = out.probabilities.data as Float32Array;
      rows.forEach((_, j) => {
        const row = probs.subarray(j * C, j * C + C);
        if (topIndices(row, 1)[0] !== fx.top[i + j]) topMismatch++;
        row.forEach((v, c) => { maxDiff = Math.max(maxDiff, Math.abs(v - fx.probs[i + j][c])); });
      });
    }
    console.log(`crop parity: ${fx.rows.length} rows, top-class mismatches ${topMismatch}, max |p diff| ${maxDiff.toExponential(2)}`);
    expect(topMismatch).toBe(0);
    expect(maxDiff).toBeLessThan(1e-4);
  });
});

describe('leaf model parity (300 images, 15 classes)', () => {
  it('resize is byte-identical to PIL, and the model matches Keras within 1e-3', async () => {
    const fx = json<LeafFix>('./fixtures/leaf-parity.json');
    expect(json<string[]>('../public/models/leaf.classes.json')).toEqual(fx.classes);
    expect(new Set(fx.items.map((i) => i.path.split('/')[4])).size).toBe(15);
    const s = await ort.InferenceSession.create(here('../public/models/leaf.onnx'));
    const input = s.inputNames[0];
    let maxDiff = 0;
    let topMismatch = 0;
    let decodeMismatch = 0;
    let resizeMismatch = 0;
    for (const it of fx.items) {
      const { data, info } = await sharp(here(`../../${it.path}`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      if (sha(data) !== it.decodedSha) decodeMismatch++;
      if (sha(resizeRGB(data, info.width, info.height, 3, LEAF_SIZE, LEAF_SIZE)) !== it.resizedSha) resizeMismatch++;
      const x = leafInput(data, info.width, info.height, 3);
      const out = await s.run({ [input]: new ort.Tensor('float32', x, [1, LEAF_SIZE, LEAF_SIZE, 3]) });
      const probs = out[s.outputNames[0]].data as Float32Array;
      if (topIndices(probs, 1)[0] !== it.top) topMismatch++;
      probs.forEach((v, c) => { maxDiff = Math.max(maxDiff, Math.abs(v - it.probs[c])); });
    }
    console.log(`leaf parity: ${fx.items.length} images, decode mismatches ${decodeMismatch}, resize mismatches ${resizeMismatch}, top-class mismatches ${topMismatch}, max |p diff| ${maxDiff.toExponential(2)}`);
    expect(decodeMismatch).toBe(0);
    expect(resizeMismatch).toBe(0);
    expect(topMismatch).toBe(0);
    expect(maxDiff).toBeLessThan(1e-3);
  }, 300_000);
});

describe('onnxruntime-web (the WASM build the app ships) runs both graphs the same way', () => {
  it('matches the fixtures on a sample of rows and images', async () => {
    const web = await import('onnxruntime-web');
    web.env.wasm.numThreads = 1;
    const crop = json<CropFix>('./fixtures/crop-parity.json');
    const cs = await web.InferenceSession.create(readFileSync(here('../public/models/crop.onnx')));
    const rows = crop.rows.filter((_, i) => i % 50 === 0);
    const data = new Float32Array(rows.length * 7);
    rows.forEach(([n, p, k, temperature, humidity, ph, rainfall], j) => data.set(cropInput({ n, p, k, temperature, humidity, ph, rainfall }), j * 7));
    const cp = (await cs.run({ features: new web.Tensor('float32', data, [rows.length, 7]) })).probabilities.data as Float32Array;
    rows.forEach((_, j) => crop.probs[j * 50].forEach((v, c) => expect(Math.abs(cp[j * 22 + c] - v)).toBeLessThan(1e-4)));

    const leaf = json<LeafFix>('./fixtures/leaf-parity.json');
    const ls = await web.InferenceSession.create(readFileSync(here('../public/models/leaf.onnx')));
    for (const it of leaf.items.filter((_, i) => i % 30 === 0)) {
      const { data: px, info } = await sharp(here(`../../${it.path}`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const out = await ls.run({ [ls.inputNames[0]]: new web.Tensor('float32', leafInput(px, info.width, info.height, 3), [1, LEAF_SIZE, LEAF_SIZE, 3]) });
      const probs = out[ls.outputNames[0]].data as Float32Array;
      expect(topIndices(probs, 1)[0]).toBe(it.top);
      probs.forEach((v, c) => expect(Math.abs(v - it.probs[c])).toBeLessThan(1e-3));
    }
  }, 120_000);
});

describe('resize edge cases', () => {
  it('upscales, reads RGBA, and copies an already-224 image unchanged', () => {
    const src = new Uint8Array(5 * 3 * 4).map((_, i) => (i * 37) % 256);
    expect(resizeRGB(src, 5, 3, 4, 224, 224).length).toBe(224 * 224 * 3);
    expect(resizeRGB(new Uint8Array(224 * 224 * 3).fill(9), 224, 224, 3, 224, 224).every((v) => v === 9)).toBe(true);
  });
});
