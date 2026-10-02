import { useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './contract';
import { STRINGS, useLang, useT } from './i18n';
import { back, Link, usePath } from './lib/router';
import { setState, useStore } from './lib/store';
import { updateProfile } from './lib/account';
import { Icon, type IconName } from './ui/Icon';
import { Ask } from './screens/Ask';
import { Leaf } from './screens/Leaf';
import { Soil } from './screens/Soil';
import { Weather } from './screens/Weather';
import { SchemeDetail, Schemes } from './screens/Schemes';
import { About, Chats, Me, SignIn } from './screens/Me';
import { NotFound } from './screens/NotFound';
import { Landing } from './screens/Landing';
import { Logo } from './ui/Mark';
import { SCHEME_BY_ID } from './content/schemes';

const TABS: { path: string; key: 'ask' | 'leaf' | 'soil' | 'weather' | 'schemes'; icon: IconName }[] = [
  { path: '/ask', key: 'ask', icon: 'ask' },
  { path: '/leaf', key: 'leaf', icon: 'leaf' },
  { path: '/soil', key: 'soil', icon: 'soil' },
  { path: '/weather', key: 'weather', icon: 'weather' },
  { path: '/schemes', key: 'schemes', icon: 'schemes' },
];

interface Route { title: string; doc?: string; screen: ReactNode; tab: string | null; parent?: string; landing?: boolean }

function useRoute(path: string): Route {
  const t = useT();
  const lang = useLang();
  const p = path.replace(/\/+$/, '') || '/';
  switch (p) {
    case '/': return { title: t.brand, doc: t.titles.home, screen: <Landing />, tab: null, landing: true };
    case '/ask': return { title: t.titles.ask, screen: <Ask />, tab: '/ask' };
    case '/leaf': return { title: t.titles.leaf, screen: <Leaf />, tab: '/leaf' };
    case '/soil': return { title: t.titles.soil, screen: <Soil />, tab: '/soil' };
    case '/weather': return { title: t.titles.weather, screen: <Weather />, tab: '/weather' };
    case '/schemes': return { title: t.titles.schemes, screen: <Schemes />, tab: '/schemes' };
    case '/me': return { title: t.titles.me, screen: <Me />, tab: null };
    case '/me/signin': return { title: t.titles.signIn, screen: <SignIn mode="in" />, tab: null, parent: '/me' };
    case '/me/signup': return { title: t.titles.signUp, screen: <SignIn mode="up" />, tab: null, parent: '/me' };
    case '/me/chats': return { title: t.titles.chats, screen: <Chats />, tab: null, parent: '/me' };
    case '/about': return { title: t.titles.about, screen: <About />, tab: null, parent: '/me' };
  }
  const m = /^\/schemes\/([a-z0-9-]+)$/.exec(p);
  if (m && SCHEME_BY_ID.has(m[1])) return { title: t.tabs.schemes, doc: SCHEME_BY_ID.get(m[1])!.short[lang], screen: <SchemeDetail id={m[1]} />, tab: '/schemes', parent: '/schemes' };
  return { title: t.titles.notFound, screen: <NotFound />, tab: null };
}

function LangSwitch() {
  const lang = useLang();
  const t = useT();
  return (
    <div className="langs" role="group" aria-label={t.common.language}>
      {(['hi', 'pa', 'en'] as Lang[]).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} aria-label={STRINGS[l].name} onClick={() => { setState({ lang: l }); updateProfile({ lang: l }); }}>
          {STRINGS[l].short}
        </button>
      ))}
    </div>
  );
}

function Avatar({ current }: { current: boolean }) {
  const t = useT();
  const me = useStore((s) => s.me);
  const name = useStore((s) => s.profile.name);
  const initial = me && name ? [...name.trim()][0]?.toUpperCase() : null;
  return (
    <Link to="/me" className={`avatar${me ? ' on' : ''}`} aria-label={t.common.me} aria-current={current ? 'page' : undefined}>
      {initial ?? <Icon name="user" />}
    </Link>
  );
}

export function App() {
  const path = usePath();
  const route = useRoute(path);
  const t = useT();
  const lang = useLang();
  const theme = useStore((s) => s.theme);
  const toastMsg = useStore((s) => s.toast);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = document.documentElement;
    h.lang = lang;
    if (theme === 'auto') h.removeAttribute('data-theme');
    else h.dataset.theme = theme;
  }, [lang, theme]);

  useEffect(() => {
    document.title = route.landing ? `${t.brand}: ${route.doc}` : `${route.doc ?? route.title} · ${t.brand}`;
  }, [route.title, route.doc, route.landing, t]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

  const tabLinks = (cls: string) => TABS.map((tab) => (
    <Link key={tab.path} to={tab.path} className={cls} aria-current={route.tab === tab.path ? 'page' : undefined}>
      <span className="tab-ico"><Icon name={tab.icon} /></span>
      <span>{t.tabs[tab.key]}</span>
    </Link>
  ));

  return (
    <div className={`app${route.landing ? ' on-landing' : ''}`}>
      <a className="skip" href="#main">{t.common.skipToContent}</a>
      <header className={`top${scrolled ? ' scrolled' : ''}`}>
        <div className="top-inner">
          <Link to="/" className="brand" aria-label={`${t.brand}, ${t.titles.home}`}>
            <Logo />
            <b>{t.brand}</b>
          </Link>
          {/* Full nav on wide screens; phones get the thumb-reach tab bar at the bottom instead. */}
          <nav className="topnav" aria-label={t.common.mainNav}>{tabLinks('topnav-link')}</nav>
          <LangSwitch />
          <Avatar current={path.startsWith('/me') || path === '/about'} />
        </div>
      </header>
      <main id="main" className={`main${route.tab === '/ask' ? ' ask-main' : ''}${route.landing ? ' land-main' : ''}`} tabIndex={-1}>
        {route.landing ? route.screen : (
          <>
            <div className={`page-head${route.tab === '/ask' ? ' vh' : ''}`}>
              {route.parent && (
                <button type="button" className="icon-btn back" onClick={() => back(route.parent!)} aria-label={t.common.back}>
                  <Icon name="back" />
                </button>
              )}
              <h1>{route.title}</h1>
            </div>
            {route.screen}
          </>
        )}
      </main>
      <nav className="tabs" aria-label={t.common.mainNav}>{tabLinks('tab-link')}</nav>
      {toastMsg && <div className="toast" role="status"><Icon name="check" />{toastMsg}</div>}
    </div>
  );
}
