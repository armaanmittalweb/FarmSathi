import type { Lang } from '../contract';
import { api, ApiFail, MOCK } from '../api';

export const MAX_SECONDS = 60;
const MAX_BYTES = 2 * 1024 * 1024;

export type MicError = 'denied' | 'missing';
export interface Recording {
  /** Resolves with the audio when stopped (null if cancelled or too short). */
  done: Promise<Blob | null>;
  stop(): void;
  cancel(): void;
}

function pickType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']) if (MediaRecorder.isTypeSupported(t)) return t;
  return undefined;
}

/**
 * Record a question. `onLevel` gets 0..1 about 30 times a second for the meter; recording stops by
 * itself at 60 seconds. Throws 'denied' or 'missing'.
 */
export async function record(onLevel: (v: number) => void, onTick: (seconds: number) => void): Promise<Recording> {
  const params = new URLSearchParams(location.search);
  if (MOCK && params.get('mic') === 'denied') throw 'denied' as MicError;
  if (MOCK && (params.get('mic') === 'fake' || !navigator.mediaDevices)) return fakeRecording(onLevel, onTick);
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw 'missing' as MicError;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    const name = (e as DOMException)?.name;
    throw (name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'missing') as MicError;
  }

  const type = pickType();
  const rec = new MediaRecorder(stream, { mimeType: type, audioBitsPerSecond: 32_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const buf = new Uint8Array(an.fftSize);
  const started = performance.now();
  let raf = 0;
  let lastTick = -1;
  const loop = () => {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3.2));
    const s = Math.floor((performance.now() - started) / 1000);
    if (s !== lastTick) { lastTick = s; onTick(s); }
    if (s >= MAX_SECONDS) { stop(); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  let cancelled = false;
  const cleanup = () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
  const done = new Promise<Blob | null>((resolve) => {
    rec.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
      const seconds = (performance.now() - started) / 1000;
      resolve(cancelled || seconds < 0.8 || blob.size === 0 || blob.size > MAX_BYTES ? null : blob);
    };
  });
  rec.start(250);
  function stop() { if (rec.state !== 'inactive') rec.stop(); }
  return { done, stop, cancel: () => { cancelled = true; stop(); } };
}

/** Screenshot/mock stand-in: a believable level wave, no microphone. */
function fakeRecording(onLevel: (v: number) => void, onTick: (s: number) => void): Recording {
  const started = performance.now();
  let resolve!: (b: Blob | null) => void;
  const done = new Promise<Blob | null>((r) => { resolve = r; });
  const timer = setInterval(() => {
    const t = (performance.now() - started) / 1000;
    onLevel(0.35 + 0.3 * Math.abs(Math.sin(t * 3.1)) * Math.abs(Math.sin(t * 1.7 + 1)));
    onTick(Math.floor(t));
  }, 33);
  return {
    done,
    stop: () => { clearInterval(timer); resolve(new Blob([new Uint8Array(4000)], { type: 'audio/webm' })); },
    cancel: () => { clearInterval(timer); resolve(null); },
  };
}

// ---- listening to answers --------------------------------------------------

export type VoiceUsed = 'server' | 'device' | 'none';

const BCP: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' };

/** Split a long answer into pieces under the API's 600-character limit, at sentence ends. */
export function chunks(text: string, max = 560): string[] {
  const parts = text.replace(/\s+/g, ' ').split(/(?<=[.!?।॥\n])\s+/);
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).trim().length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (p.length > max) { for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max)); continue; }
    cur += ' ' + p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function deviceVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  const want = BCP[lang].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().replace('_', '-') === want) ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

export interface Playback { used: Promise<VoiceUsed>; finished: Promise<void>; stop(): void }

/** Read an answer aloud: the FarmSaathi voice from the API, else the phone's own voice, else nothing (and say so). */
export function speakAnswer(text: string, lang: Lang): Playback {
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  let resolveUsed!: (v: VoiceUsed) => void;
  const used = new Promise<VoiceUsed>((r) => { resolveUsed = r; });
  const parts = chunks(text);

  const viaDevice = (): Promise<void> => new Promise((resolve) => {
    const v = deviceVoice(lang);
    if (!v) { resolveUsed('none'); resolve(); return; }
    resolveUsed('device');
    speechSynthesis.cancel();
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.voice = v;
      u.lang = v.lang;
      u.rate = 0.95;
      if (i === parts.length - 1) { u.onend = () => resolve(); u.onerror = () => resolve(); }
      speechSynthesis.speak(u);
    });
  });

  const finished = (async () => {
    for (let i = 0; i < parts.length; i++) {
      if (stopped) return;
      let blob: Blob;
      try {
        blob = await api.speak(parts[i], lang);
      } catch (e) {
        if (i === 0 && (!(e instanceof ApiFail) || e.fallback === 'device' || e.offline || e.status >= 500 || e.status === 429)) return viaDevice();
        return;
      }
      if (stopped) return;
      const url = URL.createObjectURL(blob);
      audio = new Audio(url);
      try {
        await new Promise<void>((resolve, reject) => {
          audio!.onended = () => resolve();
          audio!.onerror = () => reject(new Error('audio'));
          audio!.play().then(() => { if (i === 0) resolveUsed('server'); }, reject);
        });
      } catch {
        if (i === 0) return viaDevice();
        return;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  })();

  return {
    used,
    finished,
    stop() {
      stopped = true;
      audio?.pause();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    },
  };
}
