import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/** A tiny history router: seven screens do not need a library. history.state.i counts in-app steps, so Back never leaves the app. */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
if (typeof window !== 'undefined') window.addEventListener('popstate', notify);

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const snapshot = () => location.pathname;

export function usePath(): string {
  return useSyncExternalStore(subscribe, snapshot, () => '/');
}

const depth = (): number => (history.state && typeof history.state.i === 'number' ? history.state.i : 0);

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === location.pathname + location.search) return;
  if (opts.replace) history.replaceState({ i: depth() }, '', to);
  else history.pushState({ i: depth() + 1 }, '', to);
  notify();
  window.scrollTo(0, 0);
}

/** Go back inside the app, or to `fallback` if this screen was opened directly. */
export function back(fallback: string) {
  if (depth() > 0) history.back();
  else navigate(fallback, { replace: true });
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={click} {...rest} />;
}
