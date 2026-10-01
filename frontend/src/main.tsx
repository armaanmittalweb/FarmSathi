import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/screens.css';
import { App } from './App';
import { apiReady } from './api';
import { countViews } from './beacon';
import { checkSession } from './lib/account';
import { pruneOld } from './models/runtime';

countViews('farmsaathi');

void apiReady().then(checkSession);

const root = document.getElementById('root')!;
document.getElementById('about-text')?.remove();
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && !__MOCK__ && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    void pruneOld();
  });
}
