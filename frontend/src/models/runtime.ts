/**
 * Loads onnxruntime-web and the two models only when the Leaf or Soil tab needs them.
 * Everything is fetched gzipped (the build writes *.gz with a content hash in the name), unpacked with
 * DecompressionStream, and kept in the Cache API, so the second visit works without signal.
 * Single-threaded WASM: no SharedArrayBuffer, so no COOP/COEP headers are needed.
 */
import type { InferenceSession } from 'onnxruntime-web';

export interface Asset { url: string; bytes: number }
export const ASSETS = __MODEL_ASSETS__ as { wasm: Asset; leaf: Asset; crop: Asset };
export type ModelKind = 'leaf' | 'crop';
const CACHE = 'fs-models-v1';

/** What a model needs downloaded, in bytes. */
export const downloadBytes = (kind: ModelKind) => ASSETS.wasm.bytes + ASSETS[kind].bytes;
export const mb = (bytes: number) => (bytes / 1_000_000).toFixed(1);

async function cache(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(CACHE);
  } catch {
    return null;
  }
}

/** True when everything the model needs is already on this phone. */
export async function isReady(kind: ModelKind): Promise<boolean> {
  const c = await cache();
  if (!c) return false;
  const [a, b] = await Promise.all([c.match(ASSETS.wasm.url), c.match(ASSETS[kind].url)]);
  return !!a && !!b;
}

/** Drop files from older builds. */
export async function pruneOld(): Promise<void> {
  const c = await cache();
  if (!c) return;
  const keep = new Set(Object.values(ASSETS).map((a) => new URL(a.url, location.href).href));
  for (const req of await c.keys()) if (!keep.has(req.url)) await c.delete(req);
}

type Progress = (loaded: number, total: number) => void;

async function fetchGz(asset: Asset, onBytes: (n: number) => void): Promise<ArrayBuffer> {
  const c = await cache();
  let res = c ? await c.match(asset.url) : undefined;
  if (!res) {
    const net = await fetch(asset.url);
    if (!net.ok || !net.body) throw new Error(`download ${asset.url} ${net.status}`);
    const reader = net.body.getReader();
    const parts: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      onBytes(value.byteLength);
    }
    const blob = new Blob(parts as BlobPart[], { type: 'application/gzip' });
    res = new Response(blob);
    if (c) await c.put(asset.url, new Response(blob)).catch(() => undefined);
  } else {
    onBytes(asset.bytes);
  }
  const unpacked = res.body!.pipeThrough(new DecompressionStream('gzip'));
  return new Response(unpacked).arrayBuffer();
}

let ortPromise: Promise<typeof import('onnxruntime-web')> | null = null;
const sessions = new Map<ModelKind, Promise<InferenceSession>>();

/** The model's session, downloading what is missing (progress in bytes across the runtime and the model). */
export function getSession(kind: ModelKind, onProgress?: Progress): Promise<InferenceSession> {
  const existing = sessions.get(kind);
  if (existing) return existing;
  const total = downloadBytes(kind);
  let loaded = 0;
  const tick = (n: number) => { loaded = Math.min(total, loaded + n); onProgress?.(loaded, total); };
  const p = (async () => {
    const [ort, model] = await Promise.all([
      (ortPromise ??= (async () => {
        const [mod, wasm] = await Promise.all([import('onnxruntime-web/wasm'), fetchGz(ASSETS.wasm, tick)]);
        mod.env.wasm.numThreads = 1;
        mod.env.wasm.proxy = false;
        mod.env.wasm.wasmBinary = wasm;
        return mod as unknown as typeof import('onnxruntime-web');
      })().catch((e) => { ortPromise = null; throw e; })),
      fetchGz(ASSETS[kind], tick),
    ]);
    if (loaded < total) tick(total - loaded);
    return ort.InferenceSession.create(new Uint8Array(model), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  })();
  sessions.set(kind, p);
  p.catch(() => sessions.delete(kind));
  return p;
}

export async function ortTensor(type: 'float32', data: Float32Array, dims: number[]) {
  const ort = await (ortPromise ?? import('onnxruntime-web/wasm'));
  return new ort.Tensor(type, data, dims);
}
