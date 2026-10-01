// Renders the PWA icons from public/favicon.svg (run once with `node scripts/icons.mjs`; the PNGs are committed).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const full = svg.replace('rx="14"', 'rx="0"');
// maskable: full-bleed background, the mark scaled into the 80% safe zone
const maskable = full.replace(/(<rect[^>]*\/>)/, '$1<g transform="translate(6.4 6.4) scale(0.8)">').replace('</svg>', '</g></svg>');
const out = (s, size, name) => sharp(Buffer.from(s), { density: 600 }).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icons/${name}`, import.meta.url)));

await out(svg, 192, 'icon-192.png');
await out(svg, 512, 'icon-512.png');
await out(maskable, 512, 'maskable-512.png');
await out(full, 180, 'apple-touch-icon.png');
console.log('icons written');
