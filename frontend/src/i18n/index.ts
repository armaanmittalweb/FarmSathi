import type { Lang } from '../contract';
import { useStore } from '../lib/store';
import en, { type Strings } from './en';
import hi from './hi';
import pa from './pa';

export type { Strings };
export const STRINGS: Record<Lang, Strings> = { en, hi, pa };

export function useT(): Strings {
  return STRINGS[useStore((s) => s.lang)];
}

export function useLang(): Lang {
  return useStore((s) => s.lang);
}

/** "10:42" in the phone's 12-hour style for the language. */
export function clock(d: Date | number, lang: Lang): string {
  return new Intl.DateTimeFormat(STRINGS[lang].locale, { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function dayName(d: Date, lang: Lang, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(STRINGS[lang].locale, { weekday: style }).format(d);
}

export function shortDate(d: Date | string, lang: Lang): string {
  return new Intl.DateTimeFormat(STRINGS[lang].locale, { day: 'numeric', month: 'short' }).format(new Date(d));
}

export function num(n: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(STRINGS[lang].locale, { maximumFractionDigits: digits, minimumFractionDigits: digits, numberingSystem: 'latn' }).format(n);
}
