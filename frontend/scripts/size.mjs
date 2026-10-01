// After `vite build`: the app shell (index.html + the entry JS and CSS it loads up front), gzipped.
// Fails the build above 200 KB. Lazy chunks (ONNX runtime, model code, the mock) are listed separately.
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const dir = process.argv[2] || 'dist';
const url = (p) => new URL(`../${dir}/${p}`, import.meta.url);
if (!existsSync(url('.vite/manifest.json'))) { console.error('no manifest; run vite build'); process.exit(1); }
const man = JSON.parse(readFileSync(url('.vite/manifest.json'), 'utf8'));
const gz = (p) => gzipSync(readFileSync(url(p)), { level: 9 }).length;
const entry = Object.values(man).find((c) => c.isEntry);
const seen = new Set();
const files = ['index.html'];
(function walk(c) {
  if (seen.has(c.file)) return;
  seen.add(c.file);
  files.push(c.file, ...(c.css ?? []));
  for (const k of c.imports ?? []) walk(man[k]);
})(entry);
let total = 0;
for (const f of [...new Set(files)]) { const n = gz(f); total += n; console.log(`  ${(n / 1024).toFixed(1).padStart(7)} KB  ${f}`); }
console.log(`app shell (gzip): ${(total / 1024).toFixed(1)} KB of 200 KB`);
for (const c of Object.values(man)) if (c.isDynamicEntry) console.log(`  lazy ${(gz(c.file) / 1024).toFixed(1).padStart(7)} KB  ${c.file}`);
if (total > 200 * 1024) { console.error('app shell is over 200 KB gzipped'); process.exit(1); }
