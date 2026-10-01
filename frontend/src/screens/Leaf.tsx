import { useEffect, useRef, useState } from 'react';
import { condition } from '../content/diseases';
import { cropName, cropShort } from '../content/crops';
import { num, useLang, useT } from '../i18n';
import { navigate } from '../lib/router';
import { setState, useStore } from '../lib/store';
import type { LeafResult } from '../models/infer';
import { downloadBytes, isReady, mb } from '../models/runtime';
import { Icon } from '../ui/Icon';
import { Bar, Download, Notice, Pct } from '../ui/parts';

type View =
  | { s: 'intro' }
  | { s: 'downloading'; preview: string | null; loaded: number; total: number }
  | { s: 'checking'; preview: string | null }
  | { s: 'result'; preview: string; result: LeafResult }
  | { s: 'error'; kind: 'image' | 'download' | 'offline' };

const UNSURE = 0.5;

export function Leaf() {
  const t = useT();
  const lang = useLang();
  const online = useStore((s) => s.online);
  const [view, setView] = useState<View>({ s: 'intro' });
  const [ready, setReady] = useState<boolean | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const size = `${num(Number(mb(downloadBytes('leaf'))), lang, 1)} MB`;

  useEffect(() => { void isReady('leaf').then(setReady); }, []);

  async function run(file: File) {
    const was = await isReady('leaf');
    if (!was && !navigator.onLine) { setView({ s: 'error', kind: 'offline' }); return; }
    const local = URL.createObjectURL(file);
    setView(was ? { s: 'checking', preview: local } : { s: 'downloading', preview: local, loaded: 0, total: downloadBytes('leaf') });
    try {
      const { checkLeaf } = await import('../models/infer');
      let downloading = !was;
      const { result, preview } = await checkLeaf(file, (loaded, total) => {
        if (downloading && loaded >= total) { downloading = false; setView({ s: 'checking', preview: local }); }
        else if (downloading) setView({ s: 'downloading', preview: local, loaded, total });
      });
      setReady(true);
      setView({ s: 'result', preview, result });
    } catch (e) {
      console.error('leaf check failed', (e as Error)?.stack ?? e);
      const msg = String((e as Error)?.message ?? e);
      setView({ s: 'error', kind: /download|fetch|network|Failed/i.test(msg) ? 'download' : 'image' });
    } finally {
      URL.revokeObjectURL(local);
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) void run(f);
  };

  const buttons = (again = false) => (
    <div className="leaf-actions">
      <button type="button" className="btn primary" onClick={() => camRef.current?.click()}><Icon name="camera" />{again ? t.leaf.again : t.leaf.take}</button>
      <button type="button" className="btn secondary" onClick={() => fileRef.current?.click()}><Icon name="image" />{t.leaf.choose}</button>
    </div>
  );

  return (
    <div className="screen leaf">
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} aria-hidden="true" tabIndex={-1} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} aria-hidden="true" tabIndex={-1} />
      <p className="private-line"><Icon name="phone" size={18} />{t.leaf.private}</p>

      {view.s === 'intro' && (
        <>
          <section className="card guide-card" aria-labelledby="guide">
            <div className="frame" aria-hidden="true">
              <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
              <svg viewBox="0 0 100 100" className="frame-leaf"><path d="M22 80C22 46 42 22 80 18c-3 38-25 62-58 62Z M22 80l34-34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" /></svg>
            </div>
            <div className="guide-text">
              <h2 id="guide" className="h2">{t.leaf.introTitle}</h2>
              <p className="label">{t.leaf.guideTitle}</p>
              <ol className="guide-list">
                {t.leaf.guide.map((g, i) => <li key={g}><span className="num">{i + 1}</span>{g}</li>)}
              </ol>
            </div>
          </section>
          {buttons()}
          <p className="small muted size-note">
            {ready ? <><Icon name="check" size={18} />{t.leaf.readyOffline}</> : <><Icon name="download" size={18} />{t.leaf.sizeNote(size)}</>}
          </p>
          {!online && !ready && <Notice kind="offline" title={t.common.offlineShort}>{t.leaf.sizeNote(size)}</Notice>}
          <div className="knows">
            <p><b>{t.leaf.knows}</b></p>
            <p className="muted">{t.leaf.otherCrops}</p>
          </div>
          <details className="help">
            <summary>{t.leaf.cameraHelp.split(':')[0]}</summary>
            <p className="small">{t.leaf.cameraHelp}</p>
          </details>
        </>
      )}

      {(view.s === 'downloading' || view.s === 'checking') && (
        <>
          {view.preview && <img className="leaf-photo" src={view.preview} alt={t.leaf.photoAlt} />}
          {view.s === 'downloading'
            ? <Download title={t.leaf.downloading} loaded={view.loaded} total={view.total} />
            : (
              <div className="card result-skel" role="status" aria-live="polite">
                <p className="label">{t.leaf.checking}</p>
                <div className="skel" style={{ height: 30, width: '70%' }} />
                <div className="skel" style={{ height: 12 }} />
                <div className="skel-line" style={{ width: '55%' }} />
                <div className="skel-line" style={{ width: '48%' }} />
              </div>
            )}
        </>
      )}

      {view.s === 'result' && <Result preview={view.preview} result={view.result} />}
      {view.s === 'result' && buttons(true)}

      {view.s === 'error' && (
        <>
          {view.kind === 'image' && <Notice kind="error" role="alert" title={t.leaf.badImage} />}
          {view.kind === 'download' && <Notice kind="error" role="alert" title={t.leaf.downloadFailed} />}
          {view.kind === 'offline' && <Notice kind="offline" role="alert" title={t.common.offlineShort}>{t.leaf.sizeNote(size)}</Notice>}
          {buttons()}
        </>
      )}
    </div>
  );
}

function Result({ preview, result }: { preview: string; result: LeafResult }) {
  const t = useT();
  const lang = useLang();
  const [best, ...rest] = result.top;
  const c = condition(best.label);
  const unsure = best.p < UNSURE;
  const healthy = c.disease === null;
  const crop = cropName(c.crop, lang);
  const ask = () => {
    setState({ draft: t.leaf.askPrefill(cropShort(c.crop, lang), c.name[lang]) });
    navigate('/');
  };

  return (
    <>
      <section className="card leaf-result" aria-labelledby="verdict">
        <img className="leaf-photo band" src={preview} alt={t.leaf.photoAlt} />
        {unsure && <Notice kind="warn" title={t.leaf.unsureTitle}>{t.leaf.unsureBody}</Notice>}
        <p className="label">{t.leaf.mostLikely}</p>
        <h2 id="verdict" className={`verdict${healthy ? ' healthy' : ''}`}>
          {healthy && <Icon name="check" size={28} />}
          <span>{crop} <span className="dot" aria-hidden="true">·</span> {healthy ? t.leaf.healthyTitle : c.name[lang]}</span>
        </h2>
        <div className="conf">
          <div className="conf-row"><span>{t.leaf.confidence}</span><Pct p={best.p} /></div>
          <Bar p={best.p} warn={unsure} label={`${t.leaf.confidence} ${Math.round(best.p * 100)}%`} />
        </div>
        <div className="others">
          <p className="small muted">{t.leaf.others}</p>
          <ul className="list">
            {rest.map((r) => {
              const rc = condition(r.label);
              return (
                <li key={r.label} className="other-row">
                  <span>{cropShort(rc.crop, lang)} · {rc.disease ? rc.name[lang] : rc.name[lang]}</span>
                  <Pct p={r.p} />
                </li>
              );
            })}
          </ul>
        </div>
        <p className="small muted num-note">{t.leaf.tookMs(result.ms)}</p>
      </section>

      {!unsure && (
        <section className={`card todo${c.urgent ? ' urgent' : ''}`} aria-labelledby="todo">
          <h2 id="todo" className="label">{t.leaf.whatToDo}</h2>
          <ol className="steps">{c.steps[lang].map((s) => <li key={s}><span>{s}</span></li>)}</ol>
          {!healthy && (
            <button type="button" className="btn secondary block ask-about" onClick={ask}>
              <Icon name="ask" />{t.leaf.askAbout}
            </button>
          )}
          {!healthy && <p className="small muted">{t.leaf.notALab}</p>}
        </section>
      )}
    </>
  );
}
