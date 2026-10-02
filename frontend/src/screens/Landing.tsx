import { landingCopy } from '../content/landing';
import { useLang, useT } from '../i18n';
import { Link } from '../lib/router';
import { Icon } from '../ui/Icon';
import { FarmIllustration } from '../ui/Mark';

/** The front page: what FarmSaathi does and how to use each tool, with real phone screenshots of each. */
export function Landing() {
  const t = useT();
  const lang = useLang();
  const c = landingCopy(lang, t);
  return (
    <div className="land">
      <section className="hero wrap">
        <div className="hero-text">
          <span className="eyebrow">{c.eyebrow}</span>
          <h1>{c.headline}</h1>
          <p className="hero-lede">{c.lede}</p>
          <div className="hero-actions">
            <Link to="/ask" className="btn primary"><Icon name="mic" />{c.primary}</Link>
            <a href="#how" className="btn secondary">{c.secondary}</a>
          </div>
          <ul className="facts">
            {c.facts.map((f) => <li key={f}><Icon name="check" size={20} />{f}</li>)}
          </ul>
        </div>
        <FarmIllustration className="hero-art" />
      </section>

      <section className="wrap tools-sec" aria-labelledby="tools-h">
        <h2 id="tools-h" className="sec-title">{c.toolsTitle}</h2>
        <ul className="tool-grid">
          {c.tools.map((x, i) => (
            <li key={x.id}>
              <a href={`#how-${x.id}`} className="tool-card">
                <span className={`tool-ico ${i % 2 ? 'clay' : 'moss'}`}><Icon name={x.icon} /></span>
                <span className="tool-words"><b>{t.tabs[x.id]}</b><span>{x.line}</span></span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="how" aria-labelledby="how-h">
        <div className="wrap how-head">
          <h2 id="how-h" className="sec-title">{c.howTitle}</h2>
          <p className="sec-lede">{c.howLede}</p>
        </div>
        {c.tools.map((x, i) => (
          <article key={x.id} id={`how-${x.id}`} className={`how-row wrap${i % 2 ? ' flip' : ''}`} aria-labelledby={`how-${x.id}-h`}>
            <div className="how-text">
              <p className="how-kicker"><span className={`tool-ico sm ${i % 2 ? 'clay' : 'moss'}`}><Icon name={x.icon} size={20} /></span>{t.titles[x.id]}</p>
              <h3 id={`how-${x.id}-h`}>{x.lead}</h3>
              <ol className="steps">{x.steps.map((s) => <li key={s}><span>{s}</span></li>)}</ol>
              <p className="tip"><b>{c.tipLabel}</b> {x.tip}</p>
              <Link to={x.path} className="btn primary">{x.cta}<Icon name="forward" /></Link>
            </div>
            <figure className="shot">
              <img src={`/landing/${x.id}.${lang}.webp`} width={300} height={650} loading="lazy" decoding="async" alt={x.shotAlt} />
            </figure>
          </article>
        ))}
      </section>

      <section className="wrap install" aria-labelledby="install-h">
        <h2 id="install-h" className="sec-title">{c.installTitle}</h2>
        <p className="sec-lede">{c.installBody}</p>
        <div className="install-grid">
          {[c.android, c.iphone].map((d) => (
            <div key={d.title} className="card">
              <h3 className="h2" lang="en">{d.title}</h3>
              <ol className="steps">{d.steps.map((s) => <li key={s}><span>{s}</span></li>)}</ol>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap faq" aria-labelledby="faq-h">
        <h2 id="faq-h" className="sec-title">{c.faqTitle}</h2>
        <div className="card flush faq-list">
          {c.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}<Icon name="plus" size={20} /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="land-foot wrap">
        <p className="land-brand"><b>{t.brand}</b><span>{t.titles.home}</span></p>
        <p className="foot-links">
          <Link to="/about">{t.titles.about}</Link>
          <a href="https://github.com/armaanmittalweb/FarmSathi" rel="noopener">{c.source}</a>
          <a href="https://www.amittal.dev/" rel="noopener">{c.madeBy}</a>
        </p>
      </footer>
    </div>
  );
}
