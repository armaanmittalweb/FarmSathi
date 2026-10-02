// `npm run landing-shots`: the phone screenshots on the landing page. Builds the mock build, opens each
// tool at 390x844 (light, 2x) in English, Hindi and Punjabi, brings it to the state the landing page
// describes, and writes public/landing/<tool>.<lang>.webp at 600px wide. Rerun after any UI change.
// NOBUILD=1 skips the build; LANGS=en,hi limits languages; ONLY=soil,leaf limits tools; SOIL=n=78,p=48,k=20,ph=6.3.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../public/landing/', import.meta.url));
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
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* not yet */ }
  await new Promise((r) => setTimeout(r, 250));
}

const BLIGHT = `${REPO}ai-models/plantvillage_repo/raw/color/Tomato___Late_blight/`;
const leafPhoto = BLIGHT + readdirSync(BLIGHT).filter((f) => /\.jpe?g$/i.test(f)).sort()[3];
const PLACE = { name: 'Ludhiana', region: 'Ludhiana, Punjab', lat: 30.9, lon: 75.85 };
const wait = (p, ms = 400) => p.waitForTimeout(ms);
/** Scroll so `sel` sits just under the sticky top bar. */
const bringUp = (p, sel) => p.locator(sel).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 76));

const TOOLS = {
  ask: async (p, L) => {
    await p.goto(`${BASE}/ask?lang=${L}&fast=1`); await p.waitForSelector('.first-run');
    await p.click('.example >> nth=0'); await p.waitForSelector('.a-card .a-foot'); await wait(p);
    await p.evaluate(() => window.scrollTo(0, 0));
  },
  leaf: async (p, L) => {
    await p.goto(`${BASE}/leaf?lang=${L}`); await p.waitForSelector('.guide-card');
    await p.setInputFiles('input[type=file]:not([capture])', leafPhoto);
    await p.waitForSelector('.leaf-result', { timeout: 90000 }); await wait(p);
  },
  soil: async (p, L) => {
    await p.goto(`${BASE}/weather?lang=${L}`); await p.waitForSelector('.temp', { timeout: 15000 });
    await p.goto(`${BASE}/soil?lang=${L}`); await p.waitForSelector('.prefill');
    for (const [k, v] of (process.env.SOIL ?? 'n=78,p=48,k=20,ph=6.3').split(',').map((x) => x.split('='))) await p.fill(`#soil-${k}`, v);
    await p.click('button[type=submit]'); await p.waitForSelector('.crops', { timeout: 60000 }); await wait(p);
    await bringUp(p, '.crops'); await wait(p, 200);
  },
  weather: async (p, L) => {
    await p.goto(`${BASE}/weather?lang=${L}`); await p.waitForSelector('.temp', { timeout: 15000 }); await wait(p);
  },
  schemes: async (p, L) => {
    await p.goto(`${BASE}/schemes/pm-kisan?lang=${L}`); await p.waitForSelector('.scheme'); await wait(p);
  },
};

const browser = await chromium.launch();
const langs = (process.env.LANGS?.split(',') ?? ['en', 'hi', 'pa']);
let failed = 0;
for (const L of langs) {
  for (const [tool, run] of Object.entries(TOOLS)) {
    if (process.env.ONLY && !process.env.ONLY.split(',').includes(tool)) continue;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: L === 'en' ? 'en-IN' : `${L}-IN`, serviceWorkers: 'block' });
    await ctx.addInitScript(({ PLACE }) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.clear();
      localStorage.setItem('fs.place', JSON.stringify(PLACE));
    }, { PLACE });
    const page = await ctx.newPage();
    try {
      await run(page, L);
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot();
      await sharp(png).resize({ width: 600 }).webp({ quality: 78 }).toFile(`${OUT}${tool}.${L}.webp`);
      process.stdout.write(`ok   ${tool} ${L}\n`);
    } catch (e) {
      failed++;
      process.stdout.write(`FAIL ${tool} ${L}: ${String(e.message).split('\n')[0]}\n`);
    }
    await ctx.close();
  }
}
await browser.close();
cleanup();
process.exit(failed ? 1 : 0);
