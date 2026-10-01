import { useMemo, useState } from 'react';
import { SCHEMES, SCHEME_BY_ID, searchSchemes, type SchemeDoc } from '../content/schemes';
import { useLang, useT } from '../i18n';
import { Link, navigate } from '../lib/router';
import { setState } from '../lib/store';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/parts';

const CATS: SchemeDoc['category'][] = ['income_support', 'insurance', 'credit', 'advisory', 'irrigation', 'market_access'];

export function Schemes() {
  const t = useT();
  const lang = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const list = useMemo(() => searchSchemes(q, lang, cat), [q, lang, cat]);

  return (
    <div className="screen schemes">
      <div className="search-box">
        <label htmlFor="scheme-q" className="vh">{t.schemes.search}</label>
        <Icon name="search" />
        <input id="scheme-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.schemes.search} enterKeyHint="search" />
      </div>
      <div className="chips scroll" role="group" aria-label={t.schemes.search}>
        <button type="button" className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>{t.schemes.all}</button>
        {CATS.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{t.schemes.categories[c]}</button>
        ))}
      </div>
      <div className="section-head">
        <p className="small muted" aria-live="polite">{t.schemes.count(list.length)}</p>
        <p className="small muted offline-note"><Icon name="check" size={16} />{t.schemes.offline}</p>
      </div>
      {list.length === 0 ? (
        <Notice kind="info" icon="search" role="status">{t.schemes.none(q)}</Notice>
      ) : (
        <ul className="list scheme-list">
          {list.map((s) => (
            <li key={s.id}>
              <Link to={`/schemes/${s.id}`} className="scheme-row card">
                <span className="scheme-cat small">{t.schemes.categories[s.category]}</span>
                <b className="scheme-name">{s.short[lang]}</b>
                <span className="scheme-amount">{s.amount[lang]}</span>
                <Icon name="forward" className="scheme-go" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">{t.schemes.check}</p>
    </div>
  );
}

export function SchemeDetail({ id }: { id: string }) {
  const t = useT();
  const lang = useLang();
  const s = SCHEME_BY_ID.get(id) ?? SCHEMES[0];
  const ask = () => { setState({ draft: t.schemes.askPrefill(s.short[lang]) }); navigate('/'); };
  return (
    <article className="screen scheme">
      <header className="scheme-top">
        <span className="scheme-cat small">{t.schemes.categories[s.category]}</span>
        <h2 className="scheme-title">{s.name[lang]}</h2>
        <p className="lede">{s.summary[lang]}</p>
      </header>
      <section className="card amount" aria-labelledby="amt">
        <h3 id="amt" className="label">{t.schemes.amount}</h3>
        <p className="amount-text">{s.amount[lang]}</p>
      </section>
      <section className="section" aria-labelledby="who">
        <h3 id="who" className="h2">{t.schemes.eligible}</h3>
        <ul className="bullets">{s.eligible[lang].map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="section" aria-labelledby="how">
        <h3 id="how" className="h2">{t.schemes.apply}</h3>
        <ol className="steps">{s.steps[lang].map((x) => <li key={x}><span>{x}</span></li>)}</ol>
      </section>
      <section className="card docs" aria-labelledby="docs">
        <h3 id="docs" className="label">{t.schemes.docs}</h3>
        <ul className="list doc-list">{s.docs[lang].map((x) => <li key={x}><Icon name="check" size={20} />{x}</li>)}</ul>
      </section>
      <div className="btn-col">
        <a className="btn primary block" href={s.link} target="_blank" rel="noopener noreferrer">
          {t.schemes.link}<span className="link-host">{new URL(s.link).hostname.replace(/^www\./, '')}</span><Icon name="external" size={20} />
        </a>
        <button type="button" className="btn secondary block" onClick={ask}><Icon name="ask" />{t.schemes.askAbout}</button>
      </div>
      <p className="small muted">{t.schemes.check}</p>
    </article>
  );
}
