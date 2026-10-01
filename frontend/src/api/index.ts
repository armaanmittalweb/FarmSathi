import { httpApi } from './http';
import type { Api } from './types';

export { ApiFail } from './types';
export type { Api, ChatRequest } from './types';

/** `vite --mode mock` (or VITE_API=mock) swaps in the in-memory API; other builds never include it. */
export const MOCK = __MOCK__;

let impl: Api = httpApi;
const ready: Promise<void> = MOCK ? import('./mock').then((m) => { impl = m.mockApi; }) : Promise.resolve();

export const apiReady = () => ready;

/** Calls are forwarded at call time, after the mock (if any) has loaded. */
export const api: Api = new Proxy({} as Api, {
  get: (_t, key: keyof Api) => (...args: unknown[]) => ready.then(() => (impl[key] as (...a: unknown[]) => unknown)(...args)),
});
