import { useEffect, useState, type FormEvent } from 'react';
import type { ChatTurn, Lang } from '../contract';
import { api, ApiFail } from '../api';
import { CROPS, PROFILE_CROPS, cropName } from '../content/crops';
import { STRINGS, shortDate, clock, useLang, useT } from '../i18n';
import { adopt, importGuest, signOut, updateProfile } from '../lib/account';
import { Link, navigate } from '../lib/router';
import { setState, toast, useStore, type Theme } from '../lib/store';
import { Icon } from '../ui/Icon';
import { Notice, Skeleton } from '../ui/parts';

const STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Himachal Pradesh', 'Uttarakhand', 'Delhi', 'Madhya Pradesh', 'Bihar', 'Gujarat', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Odisha', 'Chhattisgarh', 'Jharkhand', 'Assam', 'Kerala', 'Jammu and Kashmir'];
const VERSION = __APP_VERSION__;

/** "+919876543210" -> "+91 98765 43210" */
const showLogin = (l: string) => (/^\+91\d{10}$/.test(l) ? `+91 ${l.slice(3, 8)} ${l.slice(8)}` : l);

export function Me() {
  const t = useT();
  const me = useStore((s) => s.me);
  const checked = useStore((s) => s.meChecked);
  const offer = useStore((s) => s.importOffer);
  const guestCount = useStore((s) => s.guest.length);
  const place = useStore((s) => s.place);

  return (
    <div className="screen me">
      {!checked ? (
        <div className="card"><Skeleton lines={2} /></div>
      ) : me ? (
        <section className="card account" aria-labelledby="acct">
          <div className="acct-row">
            <span className="avatar on" aria-hidden="true"><Icon name="user" /></span>
            <h2 id="acct" className="h2">{t.me.signedInAs(showLogin(me.user.login))}</h2>
          </div>
          <button type="button" className="btn secondary" onClick={() => void signOut().then(() => toast(t.me.signOut))}>{t.me.signOut}</button>
        </section>
      ) : (
        <section className="card account" aria-labelledby="acct">
          <h2 id="acct" className="h2">{t.me.guestTitle}</h2>
          <p className="muted">{t.me.guestBody}</p>
          <div className="btn-row">
            <Link to="/me/signup" className="btn primary">{t.me.signUp}</Link>
            <Link to="/me/signin" className="btn secondary">{t.me.signIn}</Link>
          </div>
        </section>
      )}

      {me && offer > 0 && <ImportOffer n={offer} />}

      <Farm />

      <section className="card flush rows" aria-label={t.me.settings}>
        <Link to="/weather" className="row-link">
          <Icon name="pin" />
          <span><b>{t.me.village}</b><span className="small muted">{place ? (place.gps ? t.weather.nearYou : [place.name, place.region].filter(Boolean).join(', ')) : t.me.noVillage}</span></span>
          <Icon name="forward" />
        </Link>
        <Link to="/me/chats" className="row-link">
          <Icon name="chat" />
          <span><b>{t.me.chats}</b><span className="small muted">{me ? t.me.signedInAs(showLogin(me.user.login)) : `${t.me.chatsGuest} · ${guestCount}`}</span></span>
          <Icon name="forward" />
        </Link>
        <Link to="/about" className="row-link">
          <Icon name="info" />
          <span><b>{t.me.about}</b><span className="small muted">{t.about.howTitle}, {t.about.privacyTitle.toLowerCase()}</span></span>
          <Icon name="forward" />
        </Link>
      </section>

      <Settings />
      {me && <DeleteAccount />}
      <p className="small muted num">{t.brand} · {t.me.version} {VERSION}</p>
    </div>
  );
}

function ImportOffer({ n }: { n: number }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Notice kind="good" icon="chat" title={t.me.importTitle(n)}
      action={<>
        <button type="button" className="btn primary" disabled={busy} onClick={() => { setBusy(true); setFailed(false); importGuest().then(() => toast(t.me.imported), () => setFailed(true)).finally(() => setBusy(false)); }}>{t.me.importYes}</button>
        <button type="button" className="btn secondary" onClick={() => setState({ importOffer: 0 })}>{t.me.importNo}</button>
      </>}>
      {failed ? t.common.errorGeneric : t.me.importBody}
    </Notice>
  );
}

function Farm() {
  const t = useT();
  const lang = useLang();
  const p = useStore((s) => s.profile);
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState(p.farmSizeAcres?.toString() ?? '');
  useEffect(() => { setSize(p.farmSizeAcres?.toString() ?? ''); }, [p.farmSizeAcres]);
  const options = PROFILE_CROPS.filter((c) => !p.crops.includes(c));
  const text = (k: 'name' | 'district' | 'state', max: number) => ({
    defaultValue: p[k] ?? '',
    maxLength: max,
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => { const v = e.target.value.trim() || null; if (v !== p[k]) updateProfile({ [k]: v }); },
  });
  return (
    <section className="card farm" aria-labelledby="farm">
      <h2 id="farm" className="h2">{t.me.farm}</h2>
      <p className="small muted">{t.me.farmNote}</p>
      <div className="field"><label htmlFor="pf-name">{t.me.fieldName}</label><input id="pf-name" className="input" autoComplete="name" {...text('name', 80)} key={`n${p.name}`} /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="pf-district">{t.me.district}</label><input id="pf-district" className="input" autoComplete="address-level2" {...text('district', 60)} key={`d${p.district}`} /></div>
        <div className="field"><label htmlFor="pf-state">{t.me.state}</label><input id="pf-state" className="input" list="states" autoComplete="address-level1" {...text('state', 60)} key={`s${p.state}`} /></div>
      </div>
      <datalist id="states">{STATES.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="field">
        <span className="flabel" id="crops-l">{t.me.crops}</span>
        <div className="chips" role="group" aria-labelledby="crops-l">
          {p.crops.map((c) => (
            <button key={c} type="button" className="chip crop-chip" onClick={() => updateProfile({ crops: p.crops.filter((x) => x !== c) })} aria-label={t.me.removeCrop(cropName(c, lang))}>
              {CROPS[c] ? cropName(c, lang) : c}<Icon name="close" size={16} />
            </button>
          ))}
          {!adding && options.length > 0 && (
            <button type="button" className="chip add" onClick={() => setAdding(true)}><Icon name="plus" size={18} />{t.me.addCrop}</button>
          )}
        </div>
        {adding && (
          <select className="select input" aria-label={t.me.addCrop} defaultValue="" autoFocus
            onChange={(e) => { if (e.target.value) updateProfile({ crops: [...p.crops, e.target.value].slice(0, 20) }); setAdding(false); }}
            onBlur={() => setAdding(false)}>
            <option value="" disabled>{t.me.addCrop}</option>
            {options.map((c) => <option key={c} value={c}>{cropName(c, lang)}</option>)}
          </select>
        )}
      </div>
      <div className="field">
        <label htmlFor="pf-size">{t.me.farmSize}</label>
        <div className="with-unit narrow">
          <input id="pf-size" className="input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value)}
            onBlur={() => { const n = Number(size.replace(',', '.')); const v = size.trim() === '' ? null : Number.isFinite(n) && n >= 0 && n <= 100000 ? n : p.farmSizeAcres; if (v !== p.farmSizeAcres) updateProfile({ farmSizeAcres: v }); setSize(v?.toString() ?? ''); }} />
          <span className="unit">{t.me.acres}</span>
        </div>
      </div>
    </section>
  );
}

function Settings() {
  const t = useT();
  const lang = useLang();
  const theme = useStore((s) => s.theme);
  const setLang = (l: Lang) => { setState({ lang: l }); updateProfile({ lang: l }); };
  return (
    <section className="card settings" aria-labelledby="settings">
      <h2 id="settings" className="h2">{t.me.settings}</h2>
      <div className="field">
        <span className="flabel" id="lang-l">{t.common.language}</span>
        <div className="seg" role="group" aria-labelledby="lang-l">
          {(['hi', 'pa', 'en'] as Lang[]).map((l) => <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{STRINGS[l].name}</button>)}
        </div>
      </div>
      <div className="field">
        <span className="flabel" id="theme-l">{t.me.theme}</span>
        <div className="seg" role="group" aria-labelledby="theme-l">
          {(['auto', 'light', 'dark'] as Theme[]).map((v) => (
            <button key={v} type="button" aria-pressed={theme === v} onClick={() => setState({ theme: v })}>
              {v === 'auto' ? t.me.themeAuto : v === 'light' ? t.me.themeLight : t.me.themeDark}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeleteAccount() {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.deleteMe(pw, lang);
      setState({ me: null, thread: [], importOffer: 0 });
      toast(t.me.deleted);
      navigate('/me', { replace: true });
    } catch (x) {
      setErr(x instanceof ApiFail && (x.status === 403 || x.status === 401) ? t.me.errBadLogin : x instanceof ApiFail && x.status === 429 ? t.me.errTooMany : t.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  };
  if (!open) return <button type="button" className="btn quiet danger-text" onClick={() => setOpen(true)}><Icon name="trash" />{t.me.deleteTitle}</button>;
  return (
    <form className="card danger-zone" onSubmit={go}>
      <h2 className="h2">{t.me.deleteTitle}</h2>
      <p>{t.me.deleteBody}</p>
      <div className="field">
        <label htmlFor="del-pw">{t.me.password}</label>
        <input id="del-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'del-err' : undefined} />
        {err && <span className="err" id="del-err" role="alert"><Icon name="warn" size={18} />{err}</span>}
      </div>
      <div className="btn-row">
        <button type="submit" className="btn danger" disabled={busy || pw.length < 1}>{t.me.deleteButton}</button>
        <button type="button" className="btn secondary" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}

function normLogin(login: string): string | null {
  const v = login.trim().toLowerCase();
  if (v.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
  const d = v.replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function SignIn({ mode }: { mode: 'in' | 'up' }) {
  const t = useT();
  const lang = useLang();
  const online = useStore((s) => s.online);
  const [login, setLogin] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ field: 'login' | 'password' | 'form'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const id = normLogin(login);
    if (!id) { setErr({ field: 'login', text: t.me.errLogin }); document.getElementById('login')?.focus(); return; }
    if (mode === 'up' && pw.length < 8) { setErr({ field: 'password', text: t.me.errShort }); document.getElementById('pw')?.focus(); return; }
    setBusy(true);
    setErr(null);
    try {
      const me = mode === 'up' ? await api.signup({ login: login.trim(), password: pw, name: name.trim() || undefined, lang }) : await api.login({ login: login.trim(), password: pw, lang });
      adopt(me, true);
      navigate('/me', { replace: true });
    } catch (x) {
      const f = x instanceof ApiFail ? x : null;
      const text = !f ? t.common.errorGeneric
        : f.offline ? t.ask.offlineTitle
        : f.status === 401 ? t.me.errBadLogin
        : f.status === 409 ? t.me.errTaken
        : f.status === 429 ? t.me.errTooMany
        : f.status === 400 ? f.message
        : t.common.errorGeneric;
      setErr({ field: 'form', text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="screen sign" onSubmit={submit} noValidate>
      {!online && <Notice kind="offline" title={t.ask.offlineTitle} />}
      <Notice kind="info" icon="shield">{t.me.noOtp}</Notice>
      {mode === 'up' && (
        <div className="field">
          <label htmlFor="nm">{t.me.name}</label>
          <input id="nm" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
      )}
      <div className="field">
        <label htmlFor="login">{t.me.login}</label>
        <span className="sub" id="login-hint">{t.me.loginHint}</span>
        <input id="login" className="input" autoComplete="username" autoCapitalize="none" spellCheck={false} value={login} onChange={(e) => setLogin(e.target.value)}
          aria-invalid={err?.field === 'login'} aria-describedby={`login-hint${err?.field === 'login' ? ' login-err' : ''}`} />
        {err?.field === 'login' && <span className="err" id="login-err"><Icon name="warn" size={18} />{err.text}</span>}
      </div>
      <div className="field">
        <label htmlFor="pw">{t.me.password}</label>
        {mode === 'up' && <span className="sub" id="pw-hint">{t.me.passwordHint}</span>}
        <input id="pw" className="input" type={show ? 'text' : 'password'} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)}
          aria-invalid={err?.field === 'password'} aria-describedby={[mode === 'up' ? 'pw-hint' : '', err?.field === 'password' ? 'pw-err' : ''].filter(Boolean).join(' ') || undefined} />
        <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />{t.me.showPassword}</label>
        {err?.field === 'password' && <span className="err" id="pw-err"><Icon name="warn" size={18} />{err.text}</span>}
      </div>
      {err?.field === 'form' && <Notice kind="error" role="alert" title={err.text} />}
      <button type="submit" className="btn primary block" disabled={busy || !online}>{mode === 'up' ? t.me.signUp : t.me.signIn}</button>
      <p className="switch">
        {mode === 'up' ? t.me.haveAccount : t.me.needAccount}{' '}
        <Link to={mode === 'up' ? '/me/signin' : '/me/signup'}>{mode === 'up' ? t.me.signIn : t.me.signUp}</Link>
      </p>
    </form>
  );
}

export function Chats() {
  const t = useT();
  const lang = useLang();
  const me = useStore((s) => s.me);
  const guest = useStore((s) => s.guest);
  const online = useStore((s) => s.online);
  const [remote, setRemote] = useState<ChatTurn[] | null>(null);
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const page = async (before?: string) => {
    setFailed(false);
    try {
      const r = await api.chats(before);
      setRemote((x) => [...(before ? x ?? [] : []), ...r.chats]);
      setMore(r.more);
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => { if (me) void page(); }, [me]);

  const list = me ? remote : [...guest].reverse();
  return (
    <div className="screen chats">
      <p className="small muted"><Icon name={me ? 'user' : 'phone'} size={16} /> {me ? t.me.signedInAs(showLogin(me.user.login)) : t.me.chatsGuest}</p>
      {me && failed && <Notice kind={online ? 'error' : 'offline'} role="alert" title={online ? t.common.errorGeneric : t.ask.offlineTitle} action={<button type="button" className="btn secondary" onClick={() => void page()}>{t.common.retry}</button>} />}
      {list === null && !failed && <div className="card"><Skeleton lines={4} /></div>}
      {list && list.length === 0 && (
        <div className="empty">
          <Icon name="chat" size={32} />
          <p>{t.me.noChats}</p>
          <Link to="/" className="btn primary">{t.tabs.ask}</Link>
        </div>
      )}
      {list && list.length > 0 && (
        <ul className="list chat-list">
          {list.map((c) => (
            <li key={c.id}>
              <details className="card chat-item">
                <summary>
                  <span className="chat-q" lang={c.lang}>{c.question}</span>
                  <span className="small muted num">{shortDate(c.at, lang)}, {clock(new Date(c.at), lang)}</span>
                </summary>
                <div className="a-text" lang={c.lang}>{c.answer.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
                {c.sources.length > 0 && (
                  <div className="chips">{c.sources.map((s) => <Link key={s.id} className="chip src" to={`/schemes/${s.id}`}><Icon name="schemes" size={18} />{s.title}</Link>)}</div>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
      {me && more && <button type="button" className="btn secondary" onClick={() => void page(remote?.[remote.length - 1]?.id)}>{t.me.more}</button>}
    </div>
  );
}

export function About() {
  const t = useT();
  return (
    <div className="screen about">
      <p className="lede">{t.about.what}</p>
      <section className="section"><h2 className="h2">{t.about.howTitle}</h2><ul className="bullets">{t.about.how.map((x) => <li key={x}>{x}</li>)}</ul></section>
      <section className="section"><h2 className="h2">{t.about.privacyTitle}</h2><ul className="bullets">{t.about.privacy.map((x) => <li key={x}>{x}</li>)}</ul></section>
      <section className="section"><h2 className="h2">{t.about.limitsTitle}</h2><p>{t.about.limits}</p></section>
      <div className="card flush rows">
        <a className="row-link" href="https://amittal.dev" target="_blank" rel="noopener noreferrer"><Icon name="info" /><span><b>{t.about.caseStudy}</b><span className="small muted">amittal.dev</span></span><Icon name="external" /></a>
        <a className="row-link" href="https://github.com/armaanmittalweb/FarmSathi" target="_blank" rel="noopener noreferrer"><Icon name="globe" /><span><b>{t.about.source}</b><span className="small muted">github.com/armaanmittalweb/FarmSathi</span></span><Icon name="external" /></a>
      </div>
    </div>
  );
}
