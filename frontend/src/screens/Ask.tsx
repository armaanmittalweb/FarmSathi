import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import type { ChatTurn, Lang } from '../contract';
import { api, ApiFail } from '../api';
import { clock, shortDate, useLang, useT } from '../i18n';
import { SCHEME_BY_ID } from '../content/schemes';
import { Link } from '../lib/router';
import { advise, cachedForecast } from '../lib/weather';
import { getState, setState, useStore } from '../lib/store';
import { MAX_SECONDS, record, speakAnswer, type MicError, type Playback, type Recording, type VoiceUsed } from '../lib/voice';
import { Icon } from '../ui/Icon';
import { Notice, Skeleton } from '../ui/parts';

let woke = false;
const newId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

type Problem = { kind: 'limit'; until: number } | { kind: 'offline' } | { kind: 'error'; retry: string } | { kind: 'mic'; err: MicError } | { kind: 'heard' } | { kind: 'short' } | null;
type Phase = 'idle' | 'listening' | 'transcribing' | 'thinking';

export function Ask() {
  const t = useT();
  const lang = useLang();
  const thread = useStore((s) => s.thread);
  const guest = useStore((s) => s.guest);
  const online = useStore((s) => s.online);
  const draft = useStore((s) => s.draft);
  const signedIn = useStore((s) => !!s.me);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [pending, setPending] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Wake the voice Space once per visit, so it is warm by the time an answer arrives.
  useEffect(() => {
    if (!woke && online) { woke = true; api.wake(lang).catch(() => undefined); }
  }, [online, lang]);

  // "Ask FarmSaathi about this" from Leaf or Schemes.
  useEffect(() => {
    if (draft) { setText(draft); setState({ draft: '' }); requestAnimationFrame(() => inputRef.current?.focus()); }
  }, [draft]);

  useLayoutEffect(() => {
    if (thread.length || pending || problem) endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length, pending, phase, problem]);

  const offline = !online;
  const limited = problem?.kind === 'limit' && problem.until > Date.now();

  async function send(message: string) {
    const q = message.trim();
    if (!q || phase === 'thinking') return;
    if (q.length > 1000) { setProblem({ kind: 'error', retry: '' }); return; }
    if (!getState().online) { setProblem({ kind: 'offline' }); return; }
    setProblem(null);
    setPending(q);
    setText('');
    setPhase('thinking');
    const s = getState();
    const history = s.thread.slice(-3).flatMap((x) => [{ role: 'user' as const, text: x.question }, { role: 'assistant' as const, text: x.answer }]);
    try {
      const r = await api.chat({ message: q, lang, history, profile: s.me ? undefined : s.profile });
      const turn: ChatTurn = { id: r.turnId ?? newId(), at: new Date().toISOString(), lang: r.lang, question: q, answer: r.text, sources: r.sources };
      setState((st) => ({ thread: [...st.thread, turn], guest: st.me ? st.guest : [...st.guest, turn] }));
    } catch (e) {
      const f = e instanceof ApiFail ? e : null;
      if (f?.status === 429) setProblem({ kind: 'limit', until: Date.now() + (f.retryAfter ?? 6 * 3600) * 1000 });
      else if (f?.offline) setProblem({ kind: 'offline' });
      else setProblem({ kind: 'error', retry: q });
    } finally {
      setPending(null);
      setPhase('idle');
    }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); void send(text); };

  return (
    <div className="ask">
      <div className="thread">
        {offline && <Notice kind="offline" role="status" title={t.ask.offlineTitle}>{t.ask.offlineBody}</Notice>}
        {thread.length === 0 && !pending && <FirstRun lang={lang} guest={guest} signedIn={signedIn} onPick={(q) => void send(q)} disabled={offline || limited} />}
        {thread.map((turn) => <Turn key={turn.id} turn={turn} />)}
        {pending && (
          <>
            <div className="q-bubble" lang={lang}><span className="vh">{t.ask.you}: </span>{pending}</div>
            <div className="a-card" aria-busy="true">
              <p className="a-status" role="status">{t.ask.thinking}</p>
              <Skeleton lines={4} />
            </div>
          </>
        )}
        <div ref={endRef} className="thread-end" />
      </div>

      <Composer
        text={text} setText={setText} inputRef={inputRef} phase={phase} setPhase={setPhase}
        disabled={offline || limited} onSubmit={submit} showHint={thread.length === 0 && !pending && !problem}
        onHeard={(said) => void send(said)} onProblem={setProblem}
        notice={problem && <ProblemNotice problem={problem} limited={limited} offline={offline} onRetry={(q) => void send(q)} onClose={() => setProblem(null)} />}
      />
    </div>
  );
}

/** Problems show right above the mic and text box, where the farmer is looking, not at the end of the thread. */
function ProblemNotice({ problem, limited, offline, onRetry, onClose }: { problem: Problem; limited: boolean; offline: boolean; onRetry: (q: string) => void; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  if (!problem) return null;
  const close = <button type="button" className="btn secondary" onClick={onClose}>{t.common.close}</button>;
  switch (problem.kind) {
    case 'limit':
      return limited ? <Notice kind="warn" role="alert" title={t.ask.limitTitle}>{t.ask.limitBody(clock(problem.until, lang))}</Notice> : null;
    case 'offline':
      return offline ? null : <Notice kind="offline" role="alert" title={t.ask.offlineTitle} action={close}>{t.ask.offlineBody}</Notice>;
    case 'error':
      return (
        <Notice kind="error" role="alert" title={problem.retry ? t.ask.error : t.ask.tooLong}
          action={<>{problem.retry && <button type="button" className="btn primary" onClick={() => onRetry(problem.retry)}>{t.common.retry}</button>}{close}</>} />
      );
    case 'mic':
      return (
        <Notice kind={problem.err === 'denied' ? 'warn' : 'info'} role="alert" icon="mic" title={problem.err === 'denied' ? t.ask.micDeniedTitle : undefined} action={close}>
          {problem.err === 'denied' ? t.ask.micDeniedBody : t.ask.micMissing}
        </Notice>
      );
    case 'heard':
      return <Notice kind="info" role="alert" icon="mic" action={close}>{t.ask.heardNothing}</Notice>;
    case 'short':
      return <Notice kind="info" role="alert" icon="mic" action={close}>{t.ask.tooShort}</Notice>;
  }
}

function FirstRun({ lang, guest, signedIn, onPick, disabled }: { lang: Lang; guest: ChatTurn[]; signedIn: boolean; onPick: (q: string) => void; disabled: boolean }) {
  const t = useT();
  const earlier = [...guest].reverse().slice(0, 3);
  return (
    <div className="first-run">
      <div className="greet">
        <h2 className="greet-title">{t.ask.greetTitle}</h2>
        <p className="lede">{t.ask.greetBody}</p>
      </div>
      <TodayStrip />
      <section className="section" aria-labelledby="try">
        <h3 id="try" className="label">{t.ask.tryAsking}</h3>
        <ul className="examples list">
          {t.ask.examples.map((q) => (
            <li key={q}>
              <button type="button" className="example" lang={lang} onClick={() => onPick(q)} disabled={disabled}>
                <span>{q}</span><Icon name="forward" size={20} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      {earlier.length > 0 && !signedIn && (
        <section className="section" aria-labelledby="earlier">
          <div className="section-head">
            <h3 id="earlier" className="label">{t.ask.earlier}</h3>
            <Link to="/me/chats" className="small">{t.me.chats}</Link>
          </div>
          <ul className="list earlier">
            {earlier.map((c) => (
              <li key={c.id}>
                <Link to="/me/chats" lang={c.lang}>
                  <span>{c.question}</span>
                  <span className="num small muted">{shortDate(c.at, lang)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Today's weather and the first piece of field advice for the saved village, from the last saved forecast (no fetch). */
function TodayStrip() {
  const t = useT();
  const lang = useLang();
  const place = useStore((s) => s.place);
  const f = place ? cachedForecast(place) : null;
  if (!place || !f || Date.now() - f.at > 12 * 3600_000) return null;
  const first = advise(f, lang).find((a) => a.kind === 'warn') ?? advise(f, lang)[0];
  return (
    <Link to="/weather" className={first?.kind === 'warn' ? 'today-strip warn' : 'today-strip'}>
      <span className="ts-temp num">{Math.round(f.current.temp)}°</span>
      <span className="ts-text"><b>{place.gps ? t.weather.nearYou : place.name}</b><span>{first?.text}</span></span>
      <Icon name="forward" />
    </Link>
  );
}

let current: Playback | null = null;

const URL_RE = /(https?:\/\/[^\s)]+[^\s).,।]|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.gov\.in(?:\/[^\s).,।]*)?)/gi;

/** Paragraphs with web addresses made tappable (answers often name pmkisan.gov.in and the like). */
export function AnswerText({ text }: { text: string }) {
  return (
    <div className="a-text">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>
          {p.split(URL_RE).map((part, j) => (j % 2 === 1
            ? <a key={j} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\//, '')}</a>
            : part))}
        </p>
      ))}
    </div>
  );
}

export function Turn({ turn, compact }: { turn: ChatTurn; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  const at = new Date(turn.at);
  return (
    <article className={`turn${compact ? ' compact' : ''}`}>
      <div className="q-bubble" lang={turn.lang}><span className="vh">{t.ask.you}: </span>{turn.question}</div>
      <div className="a-card" lang={turn.lang}>
        <span className="vh">{t.ask.answer}: </span>
        <AnswerText text={turn.answer} />
        <div className="a-foot" lang={lang}>
          <Listen text={turn.answer} lang={turn.lang} />
          {turn.sources.length > 0 && (
            <div className="chips" aria-label={t.ask.sources}>
              {turn.sources.map((s) => s.kind === 'scheme' && SCHEME_BY_ID.has(s.id)
                ? <Link key={s.id} className="chip src" to={`/schemes/${s.id}`}><Icon name="schemes" size={18} />{SCHEME_BY_ID.get(s.id)!.short[lang]}</Link>
                : <span key={s.id} className="chip src">{s.title}</span>)}
            </div>
          )}
          <time className="a-time num" dateTime={turn.at}>{Date.now() - at.getTime() < 20 * 3600_000 ? clock(at, lang) : `${shortDate(at, lang)}, ${clock(at, lang)}`}</time>
        </div>
      </div>
    </article>
  );
}

function Listen({ text, lang }: { text: string; lang: Lang }) {
  const t = useT();
  const [state, setStateL] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [used, setUsed] = useState<VoiceUsed | null>(null);
  const mine = useRef<Playback | null>(null);
  useEffect(() => () => { if (current === mine.current) current?.stop(); }, []);

  const start = () => {
    current?.stop();
    const pb = speakAnswer(text, lang);
    current = pb;
    mine.current = pb;
    setStateL('loading');
    pb.used.then((u) => { if (mine.current === pb) { setUsed(u); setStateL(u === 'none' ? 'idle' : 'playing'); } });
    pb.finished.finally(() => { if (mine.current === pb) setStateL('idle'); });
  };
  const stop = () => { mine.current?.stop(); setStateL('idle'); };

  const label = used === 'server' ? t.ask.voiceServer : used === 'device' ? t.ask.voiceDevice : null;
  return (
    <div className="listen">
      {state === 'idle' ? (
        <button type="button" className="btn secondary listen-btn" onClick={start}><Icon name="speaker" />{t.ask.listen}</button>
      ) : (
        <button type="button" className="btn secondary listen-btn on" onClick={stop} aria-live="polite">
          <Icon name="stop" />{state === 'loading' ? t.ask.loadingVoice : t.ask.stop}
        </button>
      )}
      {label && state !== 'loading' && <span className="voice-used small muted">{label}</span>}
      {used === 'none' && <span className="voice-used small" role="status">{t.ask.voiceNone}</span>}
    </div>
  );
}

function Composer({ notice, showHint, text, setText, inputRef, phase, setPhase, disabled, onSubmit, onHeard, onProblem }: {
  notice: React.ReactNode; showHint: boolean; text: string; setText: (v: string) => void; inputRef: React.RefObject<HTMLTextAreaElement | null>; phase: Phase; setPhase: (p: Phase) => void;
  disabled: boolean; onSubmit: (e: FormEvent) => void; onHeard: (said: string) => void; onProblem: (p: Problem) => void;
}) {
  const t = useT();
  const lang = useLang();
  const rec = useRef<Recording | null>(null);
  const pressedAt = useRef(0);
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0));
  const [secs, setSecs] = useState(0);

  useEffect(() => () => rec.current?.cancel(), []);

  async function startListening() {
    if (disabled || phase !== 'idle') return;
    onProblem(null);
    try {
      setSecs(0);
      setLevels(Array(28).fill(0));
      setPhase('listening');
      const r = await record((v) => setLevels((l) => [...l.slice(1), v]), setSecs);
      rec.current = r;
      const blob = await r.done;
      rec.current = null;
      if (!blob) { setPhase('idle'); return; }
      setPhase('transcribing');
      const { text: said } = await api.transcribe(blob, lang);
      setPhase('idle');
      if (said.trim()) onHeard(said.trim());
      else onProblem({ kind: 'heard' });
    } catch (e) {
      rec.current = null;
      setPhase('idle');
      if (e === 'denied' || e === 'missing') onProblem({ kind: 'mic', err: e });
      else if (e instanceof ApiFail && e.status === 429) onProblem({ kind: 'limit', until: Date.now() + (e.retryAfter ?? 3600) * 1000 });
      else if (e instanceof ApiFail && e.offline) onProblem({ kind: 'offline' });
      else onProblem({ kind: 'error', retry: '' });
    }
  }

  const stop = () => rec.current?.stop();
  const cancel = () => { rec.current?.cancel(); setPhase('idle'); };

  // Tap to start and tap to stop, or hold while speaking and let go.
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pressedAt.current = performance.now();
    void startListening();
  };
  const up = () => {
    if (pressedAt.current && performance.now() - pressedAt.current > 700) stop();
    pressedAt.current = 0;
  };

  if (phase === 'listening') {
    return (
      <div className="composer listening" role="group" aria-label={t.ask.listening}>
        <div className="meter" aria-hidden="true">
          {levels.map((v, i) => <i key={i} style={{ transform: `scaleY(${0.08 + v * 0.92})` }} />)}
        </div>
        <div className="listen-row">
          <div className="listen-text">
            <b role="status">{t.ask.listening}</b>
            <span className="small muted">{t.ask.listeningHint}</span>
          </div>
          <span className="num timer">{`0:${String(Math.min(secs, MAX_SECONDS)).padStart(2, '0')}`}</span>
        </div>
        <div className="listen-actions">
          <button type="button" className="btn secondary" onClick={cancel}>{t.ask.cancelListening}</button>
          <button type="button" className="btn primary grow" onClick={stop} onPointerUp={up}><Icon name="stop" />{t.ask.stopListening}</button>
        </div>
      </div>
    );
  }

  if (phase === 'transcribing') {
    return (
      <div className="composer busy" role="status">
        <Icon name="mic" />
        <span>{t.ask.transcribing}</span>
      </div>
    );
  }

  const hasText = text.trim().length > 0;
  return (
    <form className="composer" onSubmit={onSubmit}>
      {notice && <div className="composer-notice">{notice}</div>}
      <label className="vh" htmlFor="q">{t.ask.inputLabel}</label>
      <div className="q-field">
        <textarea
          id="q" ref={inputRef} rows={1} className="q-input" value={text} lang={lang}
          placeholder={t.ask.placeholder} disabled={disabled} maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }}
        />
        {hasText && (
          <button type="submit" className="send" disabled={disabled || phase !== 'idle'} aria-label={t.ask.send}><Icon name="send" /></button>
        )}
      </div>
      <button
        type="button" className="mic" aria-label={t.ask.mic} disabled={disabled || phase !== 'idle'}
        onPointerDown={down} onPointerUp={up} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void startListening(); } }}
      >
        <Icon name="mic" size={30} />
      </button>
      {showHint && <p className="mic-hint small muted" aria-hidden={hasText}>{hasText ? ' ' : t.ask.micHint}</p>}
    </form>
  );
}

