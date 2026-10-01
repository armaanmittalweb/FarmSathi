// Renders public/og.png (1200x630) with the app's own fonts and colours. Run once: `node scripts/og.mjs`.
import { rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const font = (p) => pathToFileURL(fileURLToPath(new URL(`../node_modules/@fontsource/${p}`, import.meta.url))).href;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Mukta; font-weight: 400; src: url(${font('mukta/files/mukta-latin-400-normal.woff2')}); }
@font-face { font-family: Mukta; font-weight: 700; src: url(${font('mukta/files/mukta-latin-700-normal.woff2')}); }
@font-face { font-family: Mukta; font-weight: 700; src: url(${font('mukta/files/mukta-devanagari-700-normal.woff2')}); unicode-range: U+0900-097F, U+200C-200D, U+20B9; }
@font-face { font-family: Mukta; font-weight: 400; src: url(${font('mukta/files/mukta-devanagari-400-normal.woff2')}); unicode-range: U+0900-097F, U+200C-200D, U+20B9; }
@font-face { font-family: Gur; font-weight: 600; src: url(${font('noto-sans-gurmukhi/files/noto-sans-gurmukhi-gurmukhi-600-normal.woff2')}); }
@font-face { font-family: Mono; font-weight: 400; src: url(${font('ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #f5f6f1; color: #18221b; font-family: Mukta, Gur, sans-serif; display: grid; grid-template-columns: 1fr 380px; gap: 56px; padding: 72px 80px; }
.k { font-family: Mono; font-size: 20px; letter-spacing: .1em; text-transform: uppercase; color: #4a564f; }
h1 { font-size: 92px; line-height: 1; letter-spacing: -.02em; margin: 18px 0 22px; }
p { font-size: 34px; line-height: 1.3; color: #2f3c35; }
.langs { display: flex; gap: 12px; margin-top: 40px; }
.langs span { border: 2px solid #b4bdb1; border-radius: 999px; padding: 6px 22px; font-size: 28px; font-weight: 700; background: #fff; }
.langs .pa { font-family: Gur; font-weight: 600; padding-top: 10px; padding-bottom: 2px; }
.phone { align-self: center; background: #fff; border: 1px solid #d3d9cf; border-radius: 28px; padding: 26px; display: grid; gap: 16px; align-content: start; }
.q { justify-self: end; background: #2b6a3c; color: #fff; border-radius: 18px 18px 4px 18px; padding: 14px 18px; font-size: 24px; font-weight: 700; line-height: 1.35; }
.a { border: 1px solid #d3d9cf; border-radius: 4px 18px 18px 18px; padding: 14px 18px; font-size: 21px; line-height: 1.45; }
.chip { display: inline-block; margin-top: 10px; background: #f7ecd4; color: #6b4600; border-radius: 999px; padding: 4px 14px; font-size: 18px; font-weight: 700; }
.mic { justify-self: end; width: 72px; height: 72px; border-radius: 50%; background: #2b6a3c; display: grid; place-items: center; }
</style></head><body>
<div><div class="k">farmsaathi.amittal.dev</div><h1>FarmSaathi</h1>
<p>Ask about your crops by speaking. Check a leaf, get crop advice from your Soil Health Card, and know when to spray.</p>
<div class="langs"><span>हिंदी</span><span class="pa">ਪੰਜਾਬੀ</span><span>English</span></div></div>
<div class="phone"><div class="q">पीएम-किसान की अगली किस्त कब आएगी?</div>
<div class="a">पीएम-किसान में साल में ₹6,000 तीन किस्तों में सीधे बैंक खाते में आते हैं। किस्त के लिए ई-केवाईसी ज़रूरी है।<br><span class="chip">पीएम-किसान</span></div>
<div class="mic"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5.5 11a6.5 6.5 0 0 0 13 0 M12 17.5V21 M8.5 21h7"/></svg></div></div>
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
const tmp = fileURLToPath(new URL('../node_modules/.cache/og.html', import.meta.url));
writeFileSync(tmp, html);
await p.goto(pathToFileURL(tmp).href);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: fileURLToPath(new URL('../public/og.png', import.meta.url)) });
await b.close();
rmSync(tmp);
console.log('og.png written');
