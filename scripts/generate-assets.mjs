// Generates raster brand assets into /public from vector sources.
// Run after changing the logo or OG design:  npm run assets
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { MARK, BRAND } from '../src/data/brand.ts';

const root = new URL('../', import.meta.url);
const pub = (p) => fileURLToPath(new URL(`public/${p}`, root));
const woffFile = (w) => fileURLToPath(new URL(`node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-${w}-normal.woff`, root));
const cacheDir = new URL('node_modules/.cache/okiyan-fonts/', root);

/** Pango needs TrueType: unpack WOFF 1.0 (zlib-compressed sfnt tables) into a .ttf. */
async function woffToTtf(src, dest) {
  const w = await readFile(src);
  const numTables = w.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = w.readUInt32BE(o);
    const offset = w.readUInt32BE(o + 4);
    const compLength = w.readUInt32BE(o + 8);
    const origLength = w.readUInt32BE(o + 12);
    const checksum = w.readUInt32BE(o + 16);
    const raw = w.subarray(offset, offset + compLength);
    tables.push({ tag, checksum, data: compLength < origLength ? inflateSync(raw) : raw });
  }
  let searchRange = 1;
  let entrySelector = 0;
  while (searchRange * 2 <= numTables) {
    searchRange *= 2;
    entrySelector++;
  }
  const head = Buffer.alloc(12 + numTables * 16);
  head.writeUInt32BE(w.readUInt32BE(4), 0);
  head.writeUInt16BE(numTables, 4);
  head.writeUInt16BE(searchRange * 16, 6);
  head.writeUInt16BE(entrySelector, 8);
  head.writeUInt16BE(numTables * 16 - searchRange * 16, 10);
  let offset = head.length;
  const bodies = [];
  tables.forEach((t, i) => {
    const o = 12 + i * 16;
    head.writeUInt32BE(t.tag, o);
    head.writeUInt32BE(t.checksum, o + 4);
    head.writeUInt32BE(offset, o + 8);
    head.writeUInt32BE(t.data.length, o + 12);
    const padded = Buffer.alloc((t.data.length + 3) & ~3);
    t.data.copy(padded);
    bodies.push(padded);
    offset += padded.length;
  });
  await writeFile(dest, Buffer.concat([head, ...bodies]));
}

const fonts = {};
async function fontFile(weight) {
  if (!fonts[weight]) {
    await mkdir(cacheDir, { recursive: true });
    const dest = fileURLToPath(new URL(`vazirmatn-${weight}.ttf`, cacheDir));
    await woffToTtf(woffFile(weight), dest);
    fonts[weight] = dest;
  }
  return fonts[weight];
}

const NAVY = BRAND.navy;
const PETROL = BRAND.petrol;
const ACCENT = BRAND.petrolLight; // accent on the dark OG card
const IVORY = BRAND.mist;

/**
 * The traced OKIYAN mark centred in a square canvas.
 * @param {number} size output px
 * @param {{ bg?: string, left?: string, right?: string, pad?: number, radius?: number, darkMode?: boolean }} opts
 */
const mark = (size, { bg, left = NAVY, right = PETROL, pad = 0.08, radius = 0, darkMode = false } = {}) => {
  const S = 1000;
  const inner = S * (1 - pad * 2);
  const scale = inner / Math.max(MARK.width, MARK.height);
  const w = MARK.width * scale;
  const h = MARK.height * scale;
  const style = darkMode
    ? `<style>.l{fill:${left}}.r{fill:${right}}@media (prefers-color-scheme: dark){.l{fill:${IVORY}}.r{fill:${ACCENT}}}</style>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${S} ${S}">${style}
  ${bg ? `<rect width="${S}" height="${S}" rx="${radius * S}" fill="${bg}"/>` : ''}
  <svg x="${(S - w) / 2}" y="${(S - h) / 2}" width="${w}" height="${h}" viewBox="${MARK.viewBox}">
    <path class="l" fill="${left}" d="${MARK.left}"/>
    <path class="r" fill="${right}" d="${MARK.right}"/>
  </svg>
</svg>`;
};

/** Persian text rendered by Pango/HarfBuzz using the project's own Vazirmatn file. */
async function text(str, { size, weight = 800, color = IVORY, width }) {
  const buf = await sharp({
    text: {
      text: `<span foreground="${color}" size="${size * 1024}">${str}</span>`,
      font: `Vazirmatn ${weight >= 700 ? 'ExtraBold' : 'Regular'}`,
      fontfile: await fontFile(weight),
      rgba: true,
      align: 'right',
      width,
      dpi: 72,
    },
  })
    .png()
    .toBuffer();
  return { buf, meta: await sharp(buf).metadata() };
}

async function og() {
  const W = 1200;
  const H = 630;
  const grid = Array.from({ length: 30 }, (_, i) => `<path d="M${i * 48} 0V${H}" stroke="${IVORY}" stroke-opacity=".05"/>`).join('');
  const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#0d3f85"/><stop offset="1" stop-color="#001637"/></linearGradient>
    <radialGradient id="glow" cx=".2" cy=".1" r=".6"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".1"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${grid}
  <path d="M520 110C440 260 300 230 240 330S120 470 70 540" fill="none" stroke="#ffc29b" stroke-opacity=".45" stroke-width="3" stroke-dasharray="4 14" stroke-linecap="round"/>
  <path d="M520 110C440 260 300 230 240 330" fill="none" stroke="${ACCENT}" stroke-width="5" stroke-linecap="round"/>
  <path d="M520 110C470 10 260 20 160 150" fill="none" stroke="${IVORY}" stroke-opacity=".4" stroke-width="2.5" stroke-dasharray="1 10" stroke-linecap="round"/>
  <g transform="translate(359 44) rotate(175) scale(1.9)"><circle r="17" fill="${NAVY}" fill-opacity=".6"/><path d="M17 0C17 -1.6 15.6 -2.4 13 -2.4L5 -2.4L-3 -14H-7L-2.5 -2.4H-10L-13.5 -7H-16L-14 -1.4V1.4L-16 7H-13.5L-10 2.4H-2.5L-7 14H-3L5 2.4H13C15.6 2.4 17 1.6 17 0Z" fill="${IVORY}"/></g>
  <circle cx="520" cy="110" r="14" fill="${ACCENT}"/>
  <circle cx="70" cy="540" r="14" fill="none" stroke="${IVORY}" stroke-width="4"/>
  <g transform="translate(250 318) rotate(-18)">
    <path d="M-70 -12H66L56 12H-58Z" fill="#e8ecee"/>
    <rect x="-46" y="-40" width="48" height="28" rx="2" fill="${ACCENT}"/>
    <rect x="6" y="-40" width="30" height="28" rx="2" fill="#02387e"/>
    <rect x="40" y="-50" width="20" height="38" rx="2" fill="#e8ecee"/>
  </g>
  <rect x="640" y="470" width="480" height="4" rx="2" fill="${ACCENT}"/>
  <!-- the photo mark is composited on top, see below -->
</svg>`;

  const name = await text('اوکیان', { size: 104 });
  const line1 = await text('ترخیص کالا و واردات،', { size: 54, weight: 800 });
  const line2 = await text('با مسیر روشن', { size: 54, weight: 800, color: '#ffc29b' });
  const sub = await text('بررسی اسناد، برآورد شفاف هزینه، پیگیری تا تحویل', { size: 30, weight: 400, color: '#c5cbd2' });
  const right = 1120;
  const composites = [
    { input: name.buf, top: 190, left: right - name.meta.width },
    { input: line1.buf, top: 330, left: right - line1.meta.width },
    { input: line2.buf, top: 402, left: right - line2.meta.width },
    { input: sub.buf, top: 500, left: right - sub.meta.width },
  ];
  const markBuf = await sharp(pub('img/logo-mark-light.png')).resize(150).png().toBuffer();
  const markMeta = await sharp(markBuf).metadata();
  composites.push({ input: markBuf, top: 44, left: W - 44 - markMeta.width });
  await mkdir(pub('og'), { recursive: true });
  await sharp(Buffer.from(bg)).composite(composites).png({ compressionLevel: 9 }).toFile(pub('og/default.png'));
}

async function icons() {
  // The master logo file is the source of truth now: favicons, touch icon,
  // Organization logo and the transparent lockups all come from it.
  const { makeBrandAssets } = await import('./make-brand-logo.mjs');
  await makeBrandAssets();
}

await mkdir(pub(''), { recursive: true });
await icons();
await og();
console.log('Assets written to public/');
