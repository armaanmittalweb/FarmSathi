import type { ChatReply, ChatTurn, Lang, Me, Profile, Scheme } from '../contract';

export interface ChatRequest { message: string; lang: Lang; profile?: Profile; history?: { role: 'user' | 'assistant'; text: string }[] }

/** Every call the app makes to the FarmSaathi API (docs/live/contract.md). */
export interface Api {
  signup(body: { login: string; password: string; name?: string; lang: Lang }): Promise<Me>;
  login(body: { login: string; password: string; lang: Lang }): Promise<Me>;
  logout(lang: Lang): Promise<void>;
  me(): Promise<Me | null>;
  patchMe(patch: Partial<Profile>, lang: Lang): Promise<Me>;
  deleteMe(password: string, lang: Lang): Promise<void>;
  chats(before?: string): Promise<{ chats: ChatTurn[]; more: boolean }>;
  importChats(turns: ChatTurn[], lang: Lang): Promise<void>;
  chat(req: ChatRequest): Promise<ChatReply>;
  transcribe(audio: Blob, lang: Lang): Promise<{ text: string; lang: Lang }>;
  /** Resolves to WAV audio; rejects with ApiFail (fallback 'device') when the voice is unavailable. */
  speak(text: string, lang: Lang): Promise<Blob>;
  wake(lang: Lang): Promise<void>;
  schemes(lang: Lang): Promise<Scheme[]>;
}

/** A failed call: the API's own error (localised `message`), or `network` when there was no answer at all. */
export class ApiFail extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryAfter?: number,
    readonly fallback?: 'device',
  ) {
    super(message);
  }
  get offline() { return this.code === 'network'; }
}
