// `node e2e/live.mjs`: drives the dev build against the deployed API (https://farmsaathi-api.amittal.dev,
// which allows http://localhost:5176) through the real flows: a question in Hindi and Punjabi, Listen
// (device fallback while the voice Space is down), sign-up with a throwaway email, profile sync,
// guest-chat import, saved chats, sign-out, sign-in, and account deletion. Screenshots go to shots/live-*.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5176';
const win = process.platform === 'win32';
try { await fetch(BASE); console.error('port 5176 is busy'); process.exit(1); } catch { /* free */ }
const server = spawn(win ? 'npx.cmd' : 'npx', ['vite', '--port', '5176', '--strictPort'], { cwd: WEB, stdio: 'ignore', shell: win, env: { ...process.env, VITE_API_URL: 'https://farmsaathi-api.amittal.dev' } });
const stop = () => { try { if (win) spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']); else server.kill(); } catch { /* gone */ } };
process.on('exit', stop);
for (let i = 0; i < 120; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* not yet */ } await new Promise((r) => setTimeout(r, 250)); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'hi-IN' });
const p = await ctx.newPage();
const problems = [];
p.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
p.on('pageerror', (e) => problems.push(`PAGEERROR ${e.message}`));
p.on('response', (r) => { if (r.url().includes('farmsaathi-api') && r.status() >= 400) problems.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
const step = async (name, fn) => {
  try { await fn(); console.log(`ok   ${name}`); } catch (e) { console.log(`FAIL ${name}: ${String(e.message).split('\n')[0]}`); await p.screenshot({ path: `${OUT}live-FAIL-${name}.png` }); }
};

await step('ask in Hindi', async () => {
  await p.goto(`${BASE}/?lang=hi`);
  await p.click('.example >> nth=0');
  await p.waitForSelector('.a-card .a-foot', { timeout: 60000 });
  await p.screenshot({ path: `${OUT}live-ask-hi.png` });
});
await step('listen falls back to the phone', async () => {
  await p.click('.listen-btn');
  await p.waitForSelector('.voice-used', { timeout: 40000 });
  console.log('     voice:', await p.textContent('.voice-used'));
});
await step('ask in Punjabi', async () => {
  await p.click('.langs button[lang=pa]');
  await p.fill('#q', 'ਝੋਨੇ ਦੀ ਵਾਢੀ ਤੋਂ ਬਾਅਦ ਕੀ ਬੀਜਾਂ?');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelectorAll('.a-card .a-foot').length >= 2, null, { timeout: 60000 });
  await p.screenshot({ path: `${OUT}live-ask-pa.png`, fullPage: true });
});
const email = `fs-test-${Date.now()}@example.com`;
const password = 'kanak-test-2026';
await step('sign up and import guest chats', async () => {
  await p.goto(`${BASE}/me/signup?lang=en`);
  await p.fill('#nm', 'Test Farmer');
  await p.fill('#login', email);
  await p.fill('#pw', password);
  await p.click('form.sign button[type=submit]');
  await p.waitForSelector('.notice.good', { timeout: 30000 });
  await p.click('.notice.good .btn.primary');
  await p.waitForSelector('.toast', { timeout: 30000 });
});
await step('profile saves to the account', async () => {
  await p.fill('#pf-district', 'Ludhiana');
  await p.click('#pf-name');
  await p.waitForTimeout(1500);
  const me = await p.evaluate(async () => (await fetch('https://farmsaathi-api.amittal.dev/api/auth/me', { credentials: 'include' })).json());
  if (me.profile.district !== 'Ludhiana') throw new Error(`district is ${me.profile.district}`);
});
await step('saved chats come from the account', async () => {
  await p.goto(`${BASE}/me/chats?lang=en`);
  await p.waitForSelector('.chat-list', { timeout: 20000 });
  const n = await p.locator('.chat-item').count();
  console.log('     chats in account:', n);
  if (n < 2) throw new Error('imported chats missing');
  await p.screenshot({ path: `${OUT}live-chats.png` });
});
await step('sign out and back in', async () => {
  await p.goto(`${BASE}/me?lang=en`);
  await p.click('.account .btn.secondary');
  await p.waitForSelector('.account .btn.primary');
  await p.goto(`${BASE}/me/signin?lang=en`);
  await p.fill('#login', email);
  await p.fill('#pw', 'wrong-password');
  await p.click('form.sign button[type=submit]');
  await p.waitForSelector('.notice.error', { timeout: 20000 });
  await p.fill('#pw', password);
  await p.click('form.sign button[type=submit]');
  await p.waitForURL(`${BASE}/me`, { timeout: 20000 });
});
await step('delete the account', async () => {
  await p.click('.danger-text');
  await p.fill('#del-pw', password);
  await p.click('.danger-zone .btn.danger');
  await p.waitForSelector('.account .btn.primary', { timeout: 20000 });
});

console.log('problems:', problems.length ? problems : 'none');
await browser.close();
stop();
process.exit(0);
