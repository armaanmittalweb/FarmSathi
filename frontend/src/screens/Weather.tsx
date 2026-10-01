import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { clock, dayName, num, shortDate, useLang, useT } from '../i18n';
import { updateProfile } from '../lib/account';
import { getState, setState, useStore, type Place } from '../lib/store';
import { advise, codeWord, getForecast, searchPlaces, type Forecast, type GeoHit } from '../lib/weather';
import { Icon, weatherIcon } from '../ui/Icon';
import { Notice, OfflineBanner } from '../ui/parts';

export function Weather() {
  const place = useStore((s) => s.place);
  const [picking, setPicking] = useState(false);
  if (!place || picking) return <PlacePicker onDone={() => setPicking(false)} canCancel={!!place} />;
  return <Forecast place={place} onChange={() => setPicking(true)} />;
}

function choose(p: Place) {
  setState({ place: p });
  const prof = getState().profile;
  updateProfile({
    lat: p.lat, lon: p.lon,
    ...(p.region && !prof.state ? { state: p.region.split(', ').pop() ?? null } : {}),
    ...(!p.gps && !prof.district ? { district: p.name.slice(0, 60) } : {}),
  });
}

function PlacePicker({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const t = useT();
  const lang = useLang();
  const online = useStore((s) => s.online);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<GeoHit[] | null>(null);
  const [busy, setBusy] = useState<'gps' | 'search' | null>(null);
  const [problem, setProblem] = useState<'denied' | 'error' | null>(null);

  const gps = () => {
    if (!navigator.geolocation) { setProblem('denied'); return; }
    setBusy('gps');
    setProblem(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(null);
        choose({ name: 'gps', region: null, lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), gps: true });
        onDone();
      },
      (err) => { setBusy(null); setProblem(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'); },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  };

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy('search');
    setProblem(null);
    try {
      setHits(await searchPlaces(q, lang));
    } catch {
      setProblem('error');
      setHits(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="screen weather-pick">
      <div className="pick-head">
        <h2 className="h2">{t.weather.noPlaceTitle}</h2>
        <p className="lede">{t.weather.noPlaceBody}</p>
      </div>
      {!online && <OfflineBanner savedAt={null} />}
      <button type="button" className="btn primary block" onClick={gps} disabled={busy !== null || !online}>
        <Icon name="locate" />{busy === 'gps' ? t.weather.locating : t.weather.useLocation}
      </button>
      {problem === 'denied' && <Notice kind="warn" role="alert" icon="pin" title={t.weather.deniedTitle}>{t.weather.deniedBody}</Notice>}
      {problem === 'error' && <Notice kind="error" role="alert" title={t.weather.error} />}
      <form className="search-form" onSubmit={search} role="search">
        <label htmlFor="place-q" className="flabel">{t.weather.search}</label>
        <div className="search-row">
          <input id="place-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.weather.searchPlaceholder} autoComplete="address-level2" enterKeyHint="search" disabled={!online} />
          <button type="submit" className="btn secondary" disabled={busy !== null || !online}><Icon name="search" /><span className="vh-sm">{t.weather.searchButton}</span></button>
        </div>
      </form>
      {busy === 'search' && <p className="small muted" role="status">{t.weather.searching}</p>}
      {hits && hits.length === 0 && <Notice kind="info" role="status" icon="search">{t.weather.noMatch}</Notice>}
      {hits && hits.length > 0 && (
        <ul className="list hits card flush">
          {hits.map((h) => (
            <li key={h.id}>
              <button type="button" className="hit" onClick={() => { choose({ name: h.name, region: [h.admin2, h.admin1].filter(Boolean).join(', ') || null, lat: h.latitude, lon: h.longitude }); onDone(); }}>
                <Icon name="pin" />
                <span><b>{h.name}</b><span className="small muted">{[h.admin2, h.admin1].filter(Boolean).join(', ')}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {canCancel && <button type="button" className="btn quiet" onClick={onDone}>{t.common.cancel}</button>}
    </div>
  );
}

function Forecast({ place, onChange }: { place: Place; onChange: () => void }) {
  const t = useT();
  const lang = useLang();
  const online = useStore((s) => s.online);
  const [data, setData] = useState<Forecast | null>(null);
  const [stale, setStale] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadIt = useCallback(async (force = false) => {
    setFailed(false);
    try {
      const r = await getForecast(place, { force });
      setData(r.data);
      setStale(r.stale || !navigator.onLine);
    } catch {
      setFailed(true);
    }
  }, [place]);

  useEffect(() => { void loadIt(); }, [loadIt]);

  const name = place.gps ? t.weather.nearYou : place.name;
  const sub = place.gps ? `${place.lat.toFixed(2)}°N, ${place.lon.toFixed(2)}°E` : place.region;

  const head = (
    <div className="place-head">
      <Icon name="pin" />
      <div className="place-name"><b>{name}</b>{sub && <span className={`small muted${place.gps ? ' num' : ''}`}>{sub}</span>}</div>
      <button type="button" className="btn secondary small-btn" onClick={onChange}>{t.weather.change}</button>
    </div>
  );

  if (failed && !data) {
    return (
      <div className="screen weather">
        {head}
        {!online ? <OfflineBanner savedAt={null} /> : <Notice kind="error" role="alert" title={t.weather.error} action={<button type="button" className="btn secondary" onClick={() => void loadIt(true)}>{t.common.retry}</button>} />}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="screen weather" aria-busy="true">
        {head}
        <div className="card today skel-today" aria-hidden="true">
          <div className="skel" style={{ width: 150, height: 64 }} />
          <div className="skel-line" style={{ width: '40%' }} />
          <div className="today-stats">{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 52 }} />)}</div>
        </div>
        <div className="card">{[0, 1, 2].map((i) => <div key={i} className="skel-line" style={{ width: `${90 - i * 15}%`, marginTop: 10 }} />)}</div>
        <div className="card flush">{Array.from({ length: 7 }, (_, i) => <div key={i} className="day-row"><div className="skel-line" style={{ width: '100%' }} /></div>)}</div>
      </div>
    );
  }

  const today = data.days[0];
  const advice = advise(data, lang);
  const word = codeWord(data.current.code);
  return (
    <div className="screen weather">
      {(stale || !online) && <OfflineBanner savedAt={clock(data.at, lang)} />}
      {head}
      <section className="card today" aria-labelledby="now">
        <h2 id="now" className="vh">{t.weather.now}</h2>
        <div className="today-main">
          <span className="temp num">{num(data.current.temp, lang)}°</span>
          <div className="today-word">
            <Icon name={weatherIcon(data.current.code)} size={32} />
            <b>{t.weather.codes[word]}</b>
            {today && <span className="num small muted">{num(today.max, lang)}° / {num(today.min, lang)}°</span>}
          </div>
        </div>
        <dl className="today-stats">
          <div><dt><Icon name="drop" size={18} />{t.weather.rainChance}</dt><dd className="num">{num(today?.pop ?? 0, lang)}%</dd></div>
          <div><dt><Icon name="wind" size={18} />{t.weather.wind}</dt><dd className="num">{num(data.current.wind, lang)} <small>km/h</small></dd></div>
          <div><dt><Icon name="thermo" size={18} />{t.weather.humidity}</dt><dd className="num">{num(data.current.hum, lang)}%</dd></div>
        </dl>
      </section>

      <section className="section" aria-labelledby="adv">
        <h2 id="adv" className="label">{t.weather.adviceTitle}</h2>
        <ul className="list advice">
          {advice.map((a) => (
            <li key={a.text} className={`adv ${a.kind}`}>
              <Icon name={a.kind === 'good' ? 'check' : 'warn'} />
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="week">
        <h2 id="week" className="label">{t.weather.sevenDays}</h2>
        <ul className="list card flush days">
          {data.days.map((d, i) => (
            <li key={d.date} className="day-row">
              <span className="day-name"><b>{i === 0 ? t.weather.todayCap : dayName(new Date(d.t), lang, 'short')}</b><span className="small muted num">{shortDate(new Date(d.t), lang)}</span></span>
              <span className="day-sky"><Icon name={weatherIcon(d.code)} /><span className="small">{t.weather.codes[codeWord(d.code)]}</span></span>
              <span className={`day-rain num${d.pop >= 50 ? ' wet' : ''}`}><Icon name="drop" size={16} />{num(d.pop, lang)}%{d.rain >= 1 ? <small> · {num(d.rain, lang)} mm</small> : null}</span>
              <span className="day-temp num"><b>{num(d.max, lang)}°</b><span className="muted">{num(d.min, lang)}°</span></span>
            </li>
          ))}
        </ul>
      </section>
      <p className="small muted">{t.weather.updated(clock(data.at, lang))} · {t.weather.source}</p>
    </div>
  );
}
