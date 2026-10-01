import { useSyncExternalStore } from 'react';
import type { ChatTurn, Lang, Me, Profile } from '../contract';
import { load, save } from './storage';

export type Theme = 'auto' | 'light' | 'dark';
export interface Place { name: string; region: string | null; lat: number; lon: number; gps?: boolean }

export interface State {
  lang: Lang;
  theme: Theme;
  online: boolean;
  me: Me | null;
  meChecked: boolean;
  /** The farm details on this phone; mirrors me.profile while signed in. */
  profile: Profile;
  place: Place | null;
  /** Guest history on this phone, oldest first (moved into the account on request). */
  guest: ChatTurn[];
  /** The conversation on the Ask tab during this visit, oldest first. */
  thread: ChatTurn[];
  /** Text to put in the Ask box (from "Ask FarmSaathi about this"). */
  draft: string;
  /** After sign-in: how many guest chats could be imported (0 = nothing to offer). */
  importOffer: number;
  toast: string | null;
}

const LANGS: Lang[] = ['en', 'hi', 'pa'];
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as string[]).includes(v);

/** URL ?lang= (shared links, screenshots), then the saved choice, then the phone's language. */
export function detectLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  const saved = load<string | null>('lang', null);
  if (isLang(saved)) return saved;
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().split('-')[0];
    if (base === 'hi') return 'hi';
    if (base === 'pa') return 'pa';
    if (base === 'en') return 'en';
  }
  return 'en';
}

const blankProfile = (lang: Lang): Profile => ({ name: null, lang, state: null, district: null, lat: null, lon: null, crops: [], farmSizeAcres: null });

function initial(): State {
  const lang = detectLang();
  const urlTheme = new URLSearchParams(location.search).get('theme');
  return {
    lang,
    theme: urlTheme === 'light' || urlTheme === 'dark' ? urlTheme : load<Theme>('theme', 'auto'),
    online: navigator.onLine,
    me: null,
    meChecked: false,
    profile: { ...blankProfile(lang), ...load<Partial<Profile>>('profile', {}) },
    place: load<Place | null>('place', null),
    guest: load<ChatTurn[]>('guest', []),
    thread: [],
    draft: '',
    importOffer: 0,
    toast: null,
  };
}

let state: State = initial();
const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  if ('lang' in next) save('lang', state.lang);
  if ('theme' in next) save('theme', state.theme === 'auto' ? null : state.theme);
  if ('profile' in next) save('profile', state.profile);
  if ('place' in next) save('place', state.place);
  if ('guest' in next) save('guest', state.guest.slice(-200));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string) {
  clearTimeout(toastTimer);
  setState({ toast: message });
  toastTimer = setTimeout(() => setState({ toast: null }), 3200);
}

if (typeof window !== 'undefined') {
  const forceOffline = new URLSearchParams(location.search).get('offline') === '1';
  if (forceOffline) state = { ...state, online: false };
  else {
    addEventListener('online', () => setState({ online: true }));
    addEventListener('offline', () => setState({ online: false }));
  }
}
