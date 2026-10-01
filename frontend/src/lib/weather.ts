import type { Lang } from '../contract';
import { MOCK } from '../api';
import { STRINGS, clock, dayName, num } from '../i18n';
import type { Place } from './store';
import { load, save } from './storage';

/** Open-Meteo, straight from the browser (no key). Cached an hour per village; the last copy is kept for offline. */
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const HOUR = 3600_000;

export interface Hour { t: number; temp: number; pop: number; rain: number; wind: number; hum: number }
export interface Day { date: string; t: number; code: number; max: number; min: number; rain: number; pop: number; wind: number }
export interface Forecast {
  at: number;
  current: { temp: number; feels: number; hum: number; wind: number; code: number; rain: number };
  hours: Hour[];
  days: Day[];
  /** Mean of the coming week's hourly values and the last 30 days' rain, for the Soil tab. */
  week: { temp: number; hum: number; rain30: number };
}

interface OM {
  utc_offset_seconds: number;
  current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; precipitation: number };
  hourly: { time: number[]; temperature_2m: number[]; precipitation_probability: (number | null)[]; precipitation: number[]; wind_speed_10m: number[]; relative_humidity_2m: number[] };
  daily: { time: number[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; precipitation_probability_max: (number | null)[]; wind_speed_10m_max: number[] };
}

const key = (p: Place) => `wx:${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

export function cachedForecast(p: Place): Forecast | null {
  return load<Forecast | null>(key(p), null);
}

function parse(d: OM): Forecast {
  const now = Date.now();
  const H = d.hourly;
  const hoursAll: Hour[] = H.time.map((t, i) => ({ t: t * 1000, temp: H.temperature_2m[i], pop: H.precipitation_probability[i] ?? 0, rain: H.precipitation[i] ?? 0, wind: H.wind_speed_10m[i], hum: H.relative_humidity_2m[i] }));
  const D = d.daily;
  const daysAll: Day[] = D.time.map((t, i) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10), t: t * 1000, code: D.weather_code[i], max: D.temperature_2m_max[i], min: D.temperature_2m_min[i],
    rain: D.precipitation_sum[i] ?? 0, pop: D.precipitation_probability_max[i] ?? 0, wind: D.wind_speed_10m_max[i],
  }));
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const days = daysAll.filter((x) => x.t >= startOfToday - HOUR * 12).slice(-7);
  const past = daysAll.filter((x) => x.t < startOfToday - HOUR * 12).slice(-30);
  const hours = hoursAll.filter((h) => h.t >= now - HOUR);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  return {
    at: now,
    current: { temp: d.current.temperature_2m, feels: d.current.apparent_temperature, hum: d.current.relative_humidity_2m, wind: d.current.wind_speed_10m, code: d.current.weather_code, rain: d.current.precipitation },
    hours,
    days,
    week: { temp: mean(hours.map((h) => h.temp)), hum: mean(hours.map((h) => h.hum)), rain30: past.reduce((a, x) => a + x.rain, 0) },
  };
}

export async function getForecast(p: Place, opts: { force?: boolean } = {}): Promise<{ data: Forecast; stale: boolean }> {
  const cached = cachedForecast(p);
  if (cached && !opts.force && Date.now() - cached.at < HOUR) return { data: cached, stale: false };
  const url = `${FORECAST}?latitude=${p.lat}&longitude=${p.lon}&timezone=auto&timeformat=unixtime&forecast_days=7&past_days=30&wind_speed_unit=kmh`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation'
    + '&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,relative_humidity_2m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max';
  try {
    let raw: OM;
    if (MOCK && !new URLSearchParams(location.search).has('realwx')) {
      if (!navigator.onLine || new URLSearchParams(location.search).get('offline') === '1') throw new Error('offline');
      raw = (await import('../api/mock')).fakeOpenMeteo() as OM;
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`open-meteo ${res.status}`);
      raw = (await res.json()) as OM;
    }
    const data = parse(raw);
    save(key(p), data);
    return { data, stale: false };
  } catch (e) {
    if (cached) return { data: cached, stale: true };
    throw e;
  }
}

export interface GeoHit { id: number; name: string; admin1?: string; admin2?: string; latitude: number; longitude: number }
export async function searchPlaces(q: string, lang: Lang): Promise<GeoHit[]> {
  if (MOCK && !new URLSearchParams(location.search).has('realwx')) return (await import('../api/mock')).fakeGeocode(q) as GeoHit[];
  const res = await fetch(`${GEOCODE}?name=${encodeURIComponent(q.trim())}&count=8&language=${lang}&format=json&countryCode=IN`);
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const body = (await res.json()) as { results?: GeoHit[] };
  return body.results ?? [];
}

export type CodeWord = keyof (typeof STRINGS)['en']['weather']['codes'];
export function codeWord(code: number): CodeWord {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 65 || code === 82) return 'heavyRain';
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

// ---- advice ---------------------------------------------------------------

export interface Advice { kind: 'good' | 'warn'; text: string }
type Part = 'morning' | 'afternoon' | 'evening' | 'night';
const partOf = (h: number): Part => (h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night');

/** "today", "tomorrow" or the weekday, for a timestamp. */
function dayWord(t: number, now: number, lang: Lang): string {
  const W = STRINGS[lang].weather;
  const d0 = new Date(now).setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(t).setHours(0, 0, 0, 0) - d0) / 86_400_000);
  if (diff === 0) return W.today;
  if (diff === 1) return W.tomorrow;
  return dayName(new Date(t), lang);
}

const SPRAY_WIND = 15; // km/h
const DRY_HOURS = 6;

/**
 * Plain advice lines from the forecast:
 * - a spraying window: daylight hours with wind under 15 km/h and no rain for the 6 hours after;
 * - "don't spray" before the next rain;
 * - skip-watering days (10 mm or more of rain), heat (40° or more), frost (3° or less), strong wind (30 km/h or more).
 */
export function advise(f: Forecast, lang: Lang, now = Date.now()): Advice[] {
  const W = STRINGS[lang].weather;
  const out: Advice[] = [];
  const hrs = f.hours.filter((h) => h.t >= now - HOUR && h.t < now + 72 * HOUR);
  const wet = (h: Hour) => h.pop >= 40 || h.rain >= 0.3;

  // spraying window
  const ok = hrs.map((h, i) => {
    const hour = new Date(h.t).getHours();
    if (hour < 6 || hour >= 18 || h.wind >= SPRAY_WIND) return false;
    const next = hrs.slice(i, i + DRY_HOURS);
    return next.length === DRY_HOURS && next.every((x) => !wet(x));
  });
  let window: [number, number] | null = null;
  for (let i = 0; i < ok.length && !window; i++) {
    if (!ok[i]) continue;
    let j = i;
    while (j + 1 < ok.length && ok[j + 1] && new Date(hrs[j + 1].t).getDate() === new Date(hrs[i].t).getDate()) j++;
    if (j - i >= 1) window = [hrs[i].t, hrs[j].t + HOUR];
    i = j;
  }
  const firstRain = hrs.find(wet);
  if (window) {
    out.push({ kind: 'good', text: W.sprayGood(W.between(dayWord(window[0], now, lang), clock(window[0], lang), clock(window[1], lang))) });
  }
  if (firstRain) {
    const before = firstRain.t - DRY_HOURS * HOUR;
    if (before > now) {
      out.push({
        kind: 'warn',
        text: W.sprayAvoid(W.on(dayWord(before, now, lang), W.parts[partOf(new Date(before).getHours())]), W.on(dayWord(firstRain.t, now, lang), W.parts[partOf(new Date(firstRain.t).getHours())])),
      });
    }
  }
  if (!window && hrs.length) out.push({ kind: 'warn', text: W.sprayNone });

  // day-level warnings over the week
  const days = f.days.filter((d) => d.t >= new Date(now).setHours(0, 0, 0, 0));
  let warnings = 0;
  for (const d of days.filter((x) => x.rain >= 10).slice(0, 2)) {
    out.push({ kind: 'warn', text: W.skipWater(dayWord(d.t + 12 * HOUR, now, lang), num(d.rain, lang)) });
    warnings++;
  }
  const hot = days.find((d) => d.max >= 40);
  if (hot) { out.push({ kind: 'warn', text: W.heat(dayWord(hot.t + 12 * HOUR, now, lang), num(hot.max, lang)) }); warnings++; }
  const frost = days.find((d) => d.min <= 3);
  if (frost) { out.push({ kind: 'warn', text: W.frost(dayWord(frost.t + 12 * HOUR, now, lang), num(frost.min, lang)) }); warnings++; }
  const windy = days.find((d) => d.wind >= 30);
  if (windy) { out.push({ kind: 'warn', text: W.windy(dayWord(windy.t + 12 * HOUR, now, lang), num(windy.wind, lang)) }); warnings++; }
  if (!warnings && !firstRain) out.push({ kind: 'good', text: W.allClear });
  return out;
}
