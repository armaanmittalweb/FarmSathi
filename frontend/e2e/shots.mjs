// `npm run shots`: builds the mock build (vite --mode mock: in-memory API, fake forecast), serves it with
// the production headers from vercel.json (CSP included), and photographs every screen and state at
// 390x844 and 1440x900, light and dark, in English and Hindi (plus Punjabi for Ask, Leaf result and
// Schemes), running axe on each. Output: frontend/shots/ (gitignored) and shots/report.json.
// ONLY=name1,name2 limits scenarios; LANGS=en,hi limits languages; VARIANTS=phone-light,... limits variants; NOBUILD=1 skips the build.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../shots/', import.meta.url));
const REPO = fileURLToPath(new URL('../../', import.meta.url));
const PORT = 5176;
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });
const win = process.platform === 'win32';
const npx = win ? 'npx.cmd' : 'npx';

try { await fetch(BASE); console.error(`port ${PORT} is already in use; stop the old server first`); process.exit(1); } catch { /* free */ }

if (!process.env.NOBUILD) {
  const b = spawnSync(npx, ['vite', 'build', '--mode', 'mock'], { cwd: WEB, stdio: 'inherit', shell: win });
  if (b.status !== 0) process.exit(1);
}
const server = spawn(npx, ['vite', 'preview', '--mode', 'mock', '--port', String(PORT), '--strictPort'], { cwd: WEB, stdio: 'ignore', shell: win });
const cleanup = () => { try { if (win) spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']); else server.kill(); } catch { /* gone */ } };
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* not yet */ }
  await new Promise((r) => setTimeout(r, 250));
}

const only = process.env.ONLY?.split(',');
const langsEnv = process.env.LANGS?.split(',');
const onlyV = process.env.VARIANTS?.split(',');
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const report = { axe: {}, console: [] };
const wait = (p, ms = 300) => p.waitForTimeout(ms);

const LEAF = {
  blight: `${REPO}ai-models/plantvillage_repo/raw/color/Tomato___Late_blight/`,
  healthy: `${REPO}ai-models/plantvillage_repo/raw/color/Potato___healthy/`,
};
import { readdirSync } from 'node:fs';
const firstImg = (dir, n = 0) => dir + readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()[n];
const UNSURE_IMG = fileURLToPath(new URL('../public/icons/icon-512.png', import.meta.url));

const PLACE = { name: 'Ludhiana', region: 'Ludhiana, Punjab', lat: 30.9, lon: 75.85 };
const minsAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const GUEST = [
  { id: 'g1', at: minsAgo(60 * 26), lang: 'hi', question: 'गेहूँ के पत्ते पीले पड़ रहे हैं, क्या करूँ?', answer: 'गेहूँ के पत्ते पीले होने की आम तौर पर तीन वजहें होती हैं: नाइट्रोजन की कमी, पीला रतुआ, या ज़्यादा पानी।', sources: [{ id: 'soil-health-card', kind: 'scheme', title: 'मृदा स्वास्थ्य कार्ड' }] },
  { id: 'g2', at: minsAgo(60 * 50), lang: 'hi', question: 'किसान क्रेडिट कार्ड कैसे बनेगा?', answer: 'किसी भी बैंक शाखा में आधार, ज़मीन का रिकॉर्ड और फ़ोटो लेकर जाएँ।', sources: [{ id: 'kcc', kind: 'scheme', title: 'किसान क्रेडिट कार्ड' }] },
];

// [name, langs ('base' = en+hi, 'all' = en+hi+pa), run(page, shot, lang)]
const scenarios = [
  ['landing', 'all', async (p, shot, L) => {
    await p.goto(`${BASE}/?lang=${L}`); await p.waitForSelector('.hero'); await shot('landing'); await shot('landing-full', { full: true });
    await p.click('.faq-list summary >> nth=0'); await p.locator('.faq').scrollIntoViewIfNeeded(); await wait(p); await shot('landing-faq');
  }],
  ['ask', 'all', async (p, shot, L) => {
    await p.goto(`${BASE}/ask?lang=${L}&fast=1`); await p.waitForSelector('.first-run'); await shot('ask-first-run');
    await p.click('.example >> nth=0'); await p.waitForSelector('.a-card .a-foot'); await wait(p); await shot('ask-answer');
  }],
  ['ask-states', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/ask?lang=${L}&mic=fake`); await p.waitForSelector('.first-run');
    await p.click('button.mic'); await p.waitForSelector('.composer.listening'); await wait(p, 1200); await shot('ask-listening');
    await p.click('.listen-actions .btn.primary'); await p.waitForSelector('.composer.busy'); await shot('ask-transcribing');
    await p.goto(`${BASE}/ask?lang=${L}&chat=slow`); await p.waitForSelector('.first-run'); await p.click('.example >> nth=0'); await p.waitForSelector('.a-card[aria-busy=true]'); await wait(p); await shot('ask-thinking');
    await p.goto(`${BASE}/ask?lang=${L}&chat=limit&fast=1`); await p.waitForSelector('.first-run'); await p.click('.example >> nth=1'); await p.waitForSelector('.notice.warn'); await wait(p); await shot('ask-daily-limit');
    await p.goto(`${BASE}/ask?lang=${L}&chat=error&fast=1`); await p.waitForSelector('.first-run'); await p.click('.example >> nth=2'); await p.waitForSelector('.notice.error'); await wait(p); await shot('ask-error');
    await p.goto(`${BASE}/ask?lang=${L}&mic=denied`); await p.waitForSelector('.first-run'); await p.click('button.mic'); await p.waitForSelector('.notice'); await wait(p); await shot('ask-mic-denied');
    await p.goto(`${BASE}/ask?lang=${L}&offline=1`, { waitUntil: 'load' }); await p.waitForSelector('.first-run'); await wait(p); await shot('ask-offline');
    await p.goto(`${BASE}/ask?lang=${L}&voice=asleep&fast=1`); await p.waitForSelector('.first-run'); await p.click('.example >> nth=0'); await p.waitForSelector('.listen-btn');
    await p.click('.listen-btn'); await p.waitForSelector('.voice-used'); await wait(p, 400); await shot('ask-listen-fallback');
  }, { guest: true }],
  ['leaf', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/leaf?lang=${L}`); await p.waitForSelector('.guide-card'); await shot('leaf-intro');
    // hold the model download to photograph the progress state
    let release;
    const held = new Promise((r) => { release = r; });
    await p.route('**/models/leaf.*', async (route) => { await held; await route.continue(); });
    await p.setInputFiles('input[type=file]:not([capture])', firstImg(LEAF.blight, 3));
    await p.waitForSelector('.progress'); await wait(p, 1500); await shot('leaf-downloading');
    release();
    await p.waitForSelector('.leaf-result', { timeout: 90000 }); await wait(p, 400); await shot('leaf-result'); await shot('leaf-result-full', { full: true });
    await p.unroute('**/models/leaf.*');
    await p.setInputFiles('input[type=file]:not([capture])', firstImg(LEAF.healthy, 2));
    await p.waitForSelector('.verdict.healthy', { timeout: 60000 }); await wait(p, 300); await shot('leaf-healthy');
    await p.setInputFiles('input[type=file]:not([capture])', UNSURE_IMG);
    await p.waitForSelector('.leaf-result', { timeout: 60000 }); await wait(p, 300); await shot('leaf-unsure');
    await p.goto(`${BASE}/leaf?lang=${L}`); await p.waitForSelector('.guide-card'); await shot('leaf-intro-ready');
  }],
  ['leaf-pa', 'pa', async (p, shot, L) => {
    await p.goto(`${BASE}/leaf?lang=${L}`); await p.waitForSelector('.guide-card');
    await p.setInputFiles('input[type=file]:not([capture])', firstImg(LEAF.blight, 3));
    await p.waitForSelector('.leaf-result', { timeout: 90000 }); await wait(p, 400); await shot('leaf-result'); await shot('leaf-result-full', { full: true });
  }],
  ['leaf-offline', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/leaf?lang=${L}&offline=1`); await p.waitForSelector('.guide-card'); await shot('leaf-offline-first-run');
  }],
  ['soil', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/soil?lang=${L}`); await p.waitForSelector('form.soil'); await shot('soil-no-village');
    await p.goto(`${BASE}/weather?lang=${L}`); await p.waitForSelector('.temp', { timeout: 15000 });
    await p.goto(`${BASE}/soil?lang=${L}`); await p.waitForSelector('.prefill'); await shot('soil-prefilled');
    await p.click('button[type=submit]'); await p.waitForSelector('.err'); await wait(p); await shot('soil-errors');
    for (const [k, v] of [['n', '90'], ['p', '42'], ['k', '43'], ['ph', '6.5']]) await p.fill(`#soil-${k}`, v);
    let release;
    const held = new Promise((r) => { release = r; });
    await p.route('**/models/crop.*', async (route) => { await held; await route.continue(); });
    await p.click('button[type=submit]'); await p.waitForSelector('.progress'); await wait(p, 1200); await shot('soil-downloading');
    release();
    await p.waitForSelector('.crops', { timeout: 60000 }); await wait(p, 300); await shot('soil-result'); await shot('soil-result-full', { full: true });
    await p.click('.crops .btn.primary'); await wait(p, 300); await shot('soil-saved');
  }, { place: true }],
  ['weather', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/weather?lang=${L}`); await p.waitForSelector('.weather-pick'); await shot('weather-no-village');
    await p.fill('#place-q', L === 'hi' ? 'लुधियाना' : 'Ludhiana'); await p.click('.search-row button'); await p.waitForSelector('.hits'); await shot('weather-search');
    await p.fill('#place-q', 'Zzzqx'); await p.click('.search-row button'); await p.waitForSelector('.notice'); await shot('weather-no-match');
    await p.click('button.btn.primary.block'); await p.waitForSelector('.notice.warn, .notice.error', { timeout: 20000 }); await shot('weather-location-denied');
    await p.fill('#place-q', 'Ludhiana'); await p.click('.search-row button'); await p.waitForSelector('.hits'); await p.click('.hit >> nth=0');
    await p.waitForSelector('.temp'); await wait(p, 300); await shot('weather-forecast'); await shot('weather-forecast-full', { full: true });
    await p.goto(`${BASE}/weather?lang=${L}&offline=1`); await p.waitForSelector('.temp'); await shot('weather-offline');
    await p.goto(`${BASE}/weather?lang=${L}&wx=heat`); await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('fs.wx:')).forEach((k) => localStorage.removeItem(k)));
    await p.goto(`${BASE}/weather?lang=${L}&wx=heat`); await p.waitForSelector('.temp'); await shot('weather-heat');
  }],
  ['weather-loading', 'base', async (p, shot, L) => {
    await p.route('**/assets/mock-*', async (route) => { await new Promise((r) => setTimeout(r, 4000)); await route.continue(); });
    await p.goto(`${BASE}/weather?lang=${L}`); await p.waitForSelector('[aria-busy=true]', { timeout: 3000 }).catch(() => undefined); await shot('weather-loading');
  }, { place: true }],
  ['schemes', 'all', async (p, shot, L) => {
    await p.goto(`${BASE}/schemes?lang=${L}`); await p.waitForSelector('.scheme-list'); await shot('schemes'); await shot('schemes-full', { full: true });
    await p.click('.scheme-row >> nth=0'); await p.waitForSelector('.scheme'); await shot('scheme-detail'); await shot('scheme-detail-full', { full: true });
  }],
  ['schemes-search', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/schemes?lang=${L}`); await p.waitForSelector('.scheme-list');
    await p.click('.chips .chip >> nth=2'); await wait(p, 200); await shot('schemes-category');
    await p.fill('#scheme-q', 'tractor'); await p.waitForSelector('.notice'); await shot('schemes-no-match');
  }],
  ['me', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/me?lang=${L}`); await p.waitForSelector('.farm'); await wait(p, 300); await shot('me-guest'); await shot('me-guest-full', { full: true });
    await p.goto(`${BASE}/me/signin?lang=${L}&login=bad&fast=1`); await p.waitForSelector('form.sign'); await shot('signin');
    await p.fill('#login', '98765 43210'); await p.fill('#pw', 'wrongpassword'); await p.click('form.sign button[type=submit]'); await p.waitForSelector('.notice.error'); await shot('signin-error');
    await p.goto(`${BASE}/me/signup?lang=${L}&fast=1`); await p.waitForSelector('form.sign'); await shot('signup');
    await p.fill('#login', '12345'); await p.click('form.sign button[type=submit]'); await p.waitForSelector('.err'); await shot('signup-invalid');
    await p.fill('#nm', 'Gurpreet'); await p.fill('#login', '98140 11223'); await p.fill('#pw', 'kanak-2026'); await p.click('form.sign button[type=submit]');
    await p.waitForSelector('.notice.good'); await wait(p, 300); await shot('me-import-offer');
    await p.click('.notice.good .btn.primary'); await p.waitForSelector('.toast'); await shot('me-imported');
    await p.click('.row-link >> nth=1'); await p.waitForSelector('.chats'); await wait(p, 600); await shot('chats-signed-in');
  }, { guest: true }],
  ['me-signed-in', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/me?lang=${L}&seed=signedin`); await p.waitForSelector('.account #acct'); await wait(p, 300); await shot('me-signed-in'); await shot('me-signed-in-full', { full: true });
    await p.click('.danger-text'); await p.waitForSelector('.danger-zone'); await shot('me-delete');
  }],
  ['chats', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/me/chats?lang=${L}`); await p.waitForSelector('.chats'); await shot('chats-empty');
  }],
  ['chats-guest', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/me/chats?lang=${L}`); await p.waitForSelector('.chat-list'); await p.click('.chat-item summary >> nth=0'); await wait(p, 200); await shot('chats-guest');
    await p.goto(`${BASE}/ask?lang=${L}`); await p.waitForSelector('.first-run'); await shot('ask-with-history');
  }, { guest: true }],
  ['about', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/about?lang=${L}`); await p.waitForSelector('.about'); await shot('about'); await shot('about-full', { full: true });
  }],
  ['404', 'base', async (p, shot, L) => {
    await p.goto(`${BASE}/khet/nahin?lang=${L}`); await p.waitForSelector('.not-found'); await shot('404');
  }],
];

const VARIANTS = [
  { id: 'phone-light', viewport: { width: 390, height: 844 }, scheme: 'light', mobile: true },
  { id: 'phone-dark', viewport: { width: 390, height: 844 }, scheme: 'dark', mobile: true },
  { id: 'desk-light', viewport: { width: 1440, height: 900 }, scheme: 'light', mobile: false },
  { id: 'desk-dark', viewport: { width: 1440, height: 900 }, scheme: 'dark', mobile: false },
].filter((v) => !onlyV || onlyV.includes(v.id));

for (const [name, langSet, run, seed = {}] of scenarios) {
  if (only && !only.includes(name)) continue;
  const langs = (langSet === 'all' ? ['en', 'hi', 'pa'] : langSet === 'pa' ? ['pa'] : ['en', 'hi']).filter((l) => !langsEnv || langsEnv.includes(l));
  for (const L of langs) {
    for (const v of VARIANTS) {
      const ctx = await browser.newContext({ viewport: v.viewport, colorScheme: v.scheme, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.mobile ? 2 : 1, locale: L === 'en' ? 'en-IN' : `${L}-IN`, serviceWorkers: 'block' });
      await ctx.addInitScript(({ place, guest, GUEST, PLACE }) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.clear();
        if (place) localStorage.setItem('fs.place', JSON.stringify(PLACE));
        if (guest) localStorage.setItem('fs.guest', JSON.stringify(GUEST));
      }, { place: !!seed.place, guest: !!seed.guest, GUEST, PLACE });
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error') report.console.push(`${name}/${L}/${v.id}: ${m.text()}`); });
      page.on('pageerror', (e) => report.console.push(`${name}/${L}/${v.id}: PAGEERROR ${e.message}`));
      const shot = async (label, opts = {}) => {
        await page.evaluate(() => document.fonts.ready);
        const file = `${label}.${L}.${v.id}.png`;
        await page.screenshot({ path: OUT + file, fullPage: !!opts.full });
        if (!opts.full) {
          const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
          if (r.violations.length) report.axe[file] = r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, targets: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
        }
      };
      try {
        await run(page, shot, L);
        process.stdout.write(`ok   ${name} ${L} ${v.id}\n`);
      } catch (e) {
        process.stdout.write(`FAIL ${name} ${L} ${v.id}: ${String(e.message).split('\n')[0]}\n`);
        report.console.push(`${name}/${L}/${v.id}: FAIL ${e.message}`);
        await page.screenshot({ path: `${OUT}FAIL-${name}.${L}.${v.id}.png` }).catch(() => undefined);
      }
      await ctx.close();
    }
  }
}

await browser.close();
writeFileSync(OUT + 'report.json', JSON.stringify(report, null, 2));
const nAxe = Object.values(report.axe).reduce((a, x) => a + x.length, 0);
console.log(`axe violations: ${nAxe} across ${Object.keys(report.axe).length} shots; console errors: ${report.console.length}`);
cleanup();
process.exit(0);
