/// <reference types="vite/client" />

/** Set by vite.config.ts: the gzipped runtime and models, with content-hashed URLs and byte sizes. */
declare const __MODEL_ASSETS__: { wasm: { url: string; bytes: number; raw: number }; leaf: { url: string; bytes: number; raw: number }; crop: { url: string; bytes: number; raw: number } };
declare const __APP_VERSION__: string;
declare const __MOCK__: boolean;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API?: string;
}
