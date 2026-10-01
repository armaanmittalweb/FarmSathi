import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { cropName } from '../content/crops';
import { cropReason } from '../content/reasons';
import { num, useLang, useT } from '../i18n';
import { addCrop } from '../lib/account';
import { Link } from '../lib/router';
import { load, save } from '../lib/storage';
import { toast, useStore } from '../lib/store';
import { cachedForecast } from '../lib/weather';
import type { CropResult } from '../models/infer';
import type { CropInput } from '../models/preprocess';
import { downloadBytes, isReady, mb } from '../models/runtime';
import { Icon } from '../ui/Icon';
import { Bar, Download, Notice, Pct } from '../ui/parts';

type Key = keyof CropInput;
const CARD: Key[] = ['n', 'p', 'k', 'ph'];
const WEATHER: Key[] = ['temperature', 'humidity', 'rainfall'];
const LIMITS: Record<Key, [number, number]> = { n: [0, 300], p: [0, 300], k: [0, 400], ph: [3, 10], temperature: [-5, 50], humidity: [0, 100], rainfall: [0, 3000] };
const DECIMALS: Record<Key, number> = { n: 0, p: 0, k: 0, ph: 1, temperature: 1, humidity: 0, rainfall: 0 };

type Values = Record<Key, string>;
const EMPTY: Values = { n: '', p: '', k: '', ph: '', temperature: '', humidity: '', rainfall: '' };

export function Soil() {
  const t = useT();
  const lang = useLang();
  const place = useStore((s) => s.place);
  const [values, setValues] = useState<Values>(() => ({ ...EMPTY, ...load<Partial<Values>>('soil', {}) }));
  const [prefilled, setPrefilled] = useState<Set<Key>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [phase, setPhase] = useState<'form' | 'downloading' | 'working' | 'result' | 'error'>('form');
  const [progress, setProgress] = useState({ loaded: 0, total: downloadBytes('crop') });
  const [result, setResult] = useState<{ r: CropResult; input: CropInput } | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const size = `${num(Number(mb(downloadBytes('crop'))), lang, 1)} MB`;

  useEffect(() => { void isReady('crop').then(setReady); }, []);

  // Fill the weather inputs from the saved village's forecast.
  useEffect(() => {
    const f = place ? cachedForecast(place) : null;
    if (!f) return;
    const auto: Partial<Values> = { temperature: f.week.temp.toFixed(1), humidity: f.week.hum.toFixed(0), rainfall: f.week.rain30.toFixed(0) };
    setValues((v) => ({ ...v, ...auto }));
    setPrefilled(new Set(WEATHER));
  }, [place]);

  const set = (k: Key, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setPrefilled((p) => { const n = new Set(p); n.delete(k); return n; });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<Key, string>> = {};
    const input = {} as CropInput;
    for (const k of [...CARD, ...WEATHER]) {
      const raw = values[k].replace(',', '.').trim();
      const n = Number(raw);
      if (raw === '') errs[k] = t.soil.required;
      else if (!Number.isFinite(n) || n < LIMITS[k][0] || n > LIMITS[k][1]) errs[k] = t.soil.range(LIMITS[k][0], LIMITS[k][1]);
      else input[k] = n;
    }
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`soil-${first}`)?.focus(); return; }
    save('soil', Object.fromEntries(CARD.map((k) => [k, values[k]])));
    const wasReady = await isReady('crop');
    setPhase(wasReady ? 'working' : 'downloading');
    try {
      const { adviseCrops } = await import('../models/infer');
      const r = await adviseCrops(input, (loaded, total) => {
        setProgress({ loaded, total });
        if (loaded >= total) setPhase('working');
      });
      setReady(true);
      setResult({ r, input });
      setSaved(false);
      setPhase('result');
      requestAnimationFrame(() => document.getElementById('crops-title')?.focus());
    } catch {
      setPhase('error');
    }
  }

  const field = (k: Key) => {
    const f = t.soil.fields[k];
    const hintId = `soil-${k}-hint`;
    const errId = `soil-${k}-err`;
    return (
      <div className="field soil-field" key={k}>
        <label htmlFor={`soil-${k}`}>{f.label}</label>
        {(f.card || f.hint || prefilled.has(k)) && (
          <span className="sub" id={hintId}>
            {prefilled.has(k)
              ? <span className="prefill"><Icon name="weather" size={16} />{k === 'rainfall' ? t.soil.fromRain : t.soil.fromWeather}</span>
              : [f.card, f.hint].filter(Boolean).join(' · ')}
          </span>
        )}
        <div className="with-unit">
          <input
            id={`soil-${k}`} className="input" inputMode="decimal" autoComplete="off" value={values[k]}
            onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]}
            aria-describedby={[f.card || f.hint || prefilled.has(k) ? hintId : '', errors[k] ? errId : ''].filter(Boolean).join(' ') || undefined}
            placeholder={k === 'ph' ? '6.5' : undefined}
          />
          {f.unit && <span className="unit">{f.unit}</span>}
        </div>
        {errors[k] && <span className="err" id={errId}><Icon name="warn" size={18} />{errors[k]}</span>}
      </div>
    );
  };

  const top = result?.r.top ?? [];
  const reasons = useMemo(() => (result ? result.r.top.map((x) => cropReason(x.crop, result.input, t)) : []), [result, t]);

  if (phase === 'result' && result) {
    const best = top[0];
    return (
      <div className="screen soil">
        <section className="card crops" aria-labelledby="crops-title">
          <h2 id="crops-title" className="h2" tabIndex={-1}>{t.soil.resultTitle}</h2>
          <ol className="list crop-list">
            {top.map((c, i) => (
              <li key={c.crop} className={`crop-row${i === 0 ? ' first' : ''}`}>
                <div className="crop-head">
                  <span className="crop-rank num">{i + 1}</span>
                  <b className="crop-name">{cropName(c.crop, lang)}</b>
                  <Pct p={c.p} />
                </div>
                <Bar p={c.p} thin={i > 0} label={`${Math.round(c.p * 100)}%`} />
                <p className="crop-why">{reasons[i]}</p>
              </li>
            ))}
          </ol>
          <button type="button" className="btn primary block" disabled={saved}
            onClick={() => { addCrop(best.crop); setSaved(true); toast(t.soil.savedCrops); }}>
            <Icon name={saved ? 'check' : 'plus'} />{saved ? t.soil.savedCrops : `${t.soil.save}: ${cropName(best.crop, lang)}`}
          </button>
        </section>
        <dl className="card used">
          {(['n', 'p', 'k', 'ph', 'temperature', 'humidity', 'rainfall'] as Key[]).map((k) => (
            <div key={k}><dt className="small muted">{t.soil.fields[k].label}</dt><dd className="num">{num(result.input[k], lang, DECIMALS[k])}{t.soil.fields[k].unit ? ` ${t.soil.fields[k].unit}` : ''}</dd></div>
          ))}
        </dl>
        <button type="button" className="btn secondary" onClick={() => setPhase('form')}>{t.soil.edit}</button>
        <p className="small muted">{t.soil.basis}</p>
      </div>
    );
  }

  return (
    <form className="screen soil" onSubmit={submit} noValidate>
      <p className="lede">{t.soil.intro}</p>
      <fieldset className="card group">
        <legend className="label">{t.soil.cardGroup}</legend>
        <div className="grid2">{CARD.map(field)}</div>
      </fieldset>
      <fieldset className="card group">
        <legend className="label">{t.soil.weatherGroup}</legend>
        {!place && <p className="small no-place"><Icon name="pin" size={18} /><span>{t.soil.noPlace} <Link to="/weather">{t.tabs.weather}</Link></span></p>}
        <div className="grid3">{WEATHER.map(field)}</div>
      </fieldset>
      {phase === 'downloading' && <Download title={t.soil.downloading} loaded={progress.loaded} total={progress.total} />}
      {phase === 'working' && <p className="small muted" role="status">{t.soil.working}</p>}
      {phase === 'error' && <Notice kind="error" role="alert" title={t.soil.error} />}
      <button type="submit" className="btn primary block" disabled={phase === 'downloading' || phase === 'working'}>{t.soil.submit}</button>
      <p className="small muted size-note">
        {ready ? <><Icon name="check" size={18} />{t.leaf.readyOffline}</> : <><Icon name="download" size={18} />{t.soil.sizeNote(size)}</>}
      </p>
    </form>
  );
}
