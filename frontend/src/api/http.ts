import type { ApiError, ChatReply, ChatTurn, Lang, Me, Scheme } from '../contract';
import { ApiFail, type Api, type ChatRequest } from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'https://farmsaathi-api.amittal.dev';

async function fail(res: Response): Promise<never> {
  let body: Partial<ApiError> = {};
  try {
    body = (await res.json()) as ApiError;
  } catch {
    // not JSON (a proxy page, an empty 502): fall through with the status
  }
  throw new ApiFail(body.error || res.statusText || 'Request failed', res.status, body.code || 'server', body.retryAfter, body.fallback);
}

async function send(method: string, path: string, body?: unknown, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    const isForm = body instanceof FormData;
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: isForm ? undefined : method === 'GET' ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
      body: isForm ? body : method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      ...init,
    });
  } catch {
    throw new ApiFail('No connection', 0, 'network');
  }
  if (!res.ok) await fail(res);
  return res;
}

const json = async <T,>(method: string, path: string, body?: unknown): Promise<T> => (await send(method, path, body)).json() as Promise<T>;
const none = async (method: string, path: string, body?: unknown): Promise<void> => { await send(method, path, body); };

export const httpApi: Api = {
  signup: (b) => json<Me>('POST', '/api/auth/signup', b),
  login: (b) => json<Me>('POST', '/api/auth/login', b),
  logout: (lang) => none('POST', '/api/auth/logout', { lang }),
  async me() {
    try {
      return await json<Me>('GET', '/api/auth/me');
    } catch (e) {
      if (e instanceof ApiFail && e.status === 401) return null;
      throw e;
    }
  },
  patchMe: (patch, lang) => json<Me>('PATCH', '/api/me', { ...patch, lang }),
  deleteMe: (password, lang) => none('DELETE', '/api/me', { password, lang }),
  chats: (before) => json<{ chats: ChatTurn[]; more: boolean }>('GET', `/api/me/chats${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  importChats: (turns, lang) => none('POST', '/api/me/chats/import', { turns, lang }),
  chat: (req: ChatRequest) => json<ChatReply>('POST', '/api/chat', req),
  transcribe(audio, lang) {
    const form = new FormData();
    const ext = audio.type.includes('mp4') ? 'mp4' : audio.type.includes('ogg') ? 'ogg' : audio.type.includes('wav') ? 'wav' : 'webm';
    form.set('audio', audio, `question.${ext}`);
    form.set('lang', lang);
    return json<{ text: string; lang: Lang }>('POST', '/api/transcribe', form);
  },
  async speak(text, lang) {
    return (await send('POST', '/api/speak', { text, lang })).blob();
  },
  wake: (lang) => none('POST', '/api/voice/wake', { lang }),
  schemes: (lang) => json<Scheme[]>('GET', `/api/schemes?lang=${lang}`),
};
