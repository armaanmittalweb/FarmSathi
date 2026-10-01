import type { ReactNode } from 'react';
import { num, useLang, useT } from '../i18n';
import { Icon, type IconName } from './Icon';

type Kind = 'warn' | 'error' | 'good' | 'info' | 'offline';
const KIND_ICON: Record<Kind, IconName> = { warn: 'warn', error: 'warn', good: 'check', info: 'info', offline: 'offline' };

/** Every designed state (offline, denied, limit, error, unsure) uses this one block, so they read the same everywhere. */
export function Notice({ kind, title, children, action, icon, role }: { kind: Kind; title?: ReactNode; children?: ReactNode; action?: ReactNode; icon?: IconName; role?: 'alert' | 'status' }) {
  return (
    <div className={`notice ${kind}`} role={role}>
      <Icon name={icon ?? KIND_ICON[kind]} />
      <div>
        {title && <b>{title}</b>}
        {children && <p>{children}</p>}
        {action && <div className="btn-row">{action}</div>}
      </div>
    </div>
  );
}

export function OfflineBanner({ savedAt }: { savedAt: string | null }) {
  const t = useT();
  return (
    <Notice kind="offline" role="status" title={savedAt ? t.common.offline(savedAt) : t.common.offlineShort} />
  );
}

export function Bar({ p, warn, thin, label }: { p: number; warn?: boolean; thin?: boolean; label?: string }) {
  return (
    <div className={`bar${warn ? ' warn' : ''}${thin ? ' thin' : ''}`} role="img" aria-label={label}>
      <i style={{ width: `${Math.max(2, Math.round(p * 100))}%` }} />
    </div>
  );
}

export function Pct({ p }: { p: number }) {
  const lang = useLang();
  const v = p * 100;
  return <span className="num">{v >= 1 || v === 0 ? num(Math.round(v), lang) : '<1'}%</span>;
}

/** The size and progress of a one-time model download. Motion explains: the bar moves only while bytes arrive. */
export function Download({ title, loaded, total }: { title: string; loaded: number; total: number }) {
  const t = useT();
  const lang = useLang();
  return (
    <div className="card progress" role="status" aria-live="polite">
      <div className="progress-row"><b>{title}</b><span className="num">{Math.round((loaded / total) * 100)}%</span></div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((loaded / total) * 100)} aria-label={title}>
        <i style={{ width: `${Math.max(1, (loaded / total) * 100)}%` }} />
      </div>
      <p className="small muted num">{t.common.downloaded(num(loaded / 1e6, lang, 1), num(total / 1e6, lang, 1))}</p>
    </div>
  );
}

export function Skeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true" style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: lines }, (_, i) => <div key={i} className="skel-line" style={{ width: `${i === lines - 1 ? 55 : 92 - i * 6}%` }} />)}
    </div>
  );
}
