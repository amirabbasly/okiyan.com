/**
 * Draws the sixth partner mark (Kavir Motor) as a clean colour vector-style
 * lockup: navy rounded badge with an orange rider chevron + the wordmark in the
 * project's own Vazirmatn ExtraBold. Run: node scripts/make-kavir-logo.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const woff = fileURLToPath(new URL('node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-800-normal.woff', root));
const cache = fileURLToPath(new URL('node_modules/.cache/okiyan-fonts/', root));
const ttf = cache + 'vazirmatn-800.ttf';

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
  let searchRange = 1, entrySelector = 0;
  while (searchRange * 2 <= numTables) { searchRange *= 2; entrySelector++; }
  const head = Buffer.alloc(12 + numTables * 16);
  head.writeUInt32BE(w.readUInt32BE(4), 0);
  head.writeUInt16BE(numTables, 4);
  head.writeUInt16BE(searchRange * 16, 6);
  head.writeUInt16BE(entrySelector, 8);
  head.writeUInt16BE(numTables * 16 - searchRange * 16, 10);
  tables.forEach((t, i) => {
    const o = 12 + i * 16;
    head.writeUInt32BE(t.tag, o);
    head.writeUInt32BE(t.checksum, o + 4);
    head.writeUInt32BE(t.offset, o + 8);
    head.writeUInt32BE(t.data.length, o + 12);
  });
  const bodies = [];
  let offset = 12 + numTables * 16;
  for (const t of tables) {
    const padded = Buffer.alloc((t.data.length + 3) & ~3);
    t.data.copy(padded);
    bodies.push(padded);
    t.offset = offset;
    offset += padded.length;
  }
  // offsets must be written after layout
  tables.forEach((t, i) => head.writeUInt32BE(t.offset, 12 + i * 16 + 8));
  await writeFile(dest, Buffer.concat([head, ...bodies]));
}

await mkdir(cache, { recursive: true });
await woffToTtf(woff, ttf);

const NAVY = '#02387e';
const ORANGE = '#fe5d02';

const word = await sharp({
  text: {
    text: `<span foreground="${NAVY}" size="${86 * 1024}">KAVIR MOTOR</span>`,
    font: 'Vazirmatn ExtraBold',
    fontfile: ttf,
    rgba: true,
    dpi: 72,
  },
}).png().toBuffer();
const wm = await sharp(word).metadata();

const badge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="190" height="190" viewBox="0 0 190 190">
  <rect width="190" height="190" rx="42" fill="${NAVY}"/>
  <path d="M38 118 L86 62 L104 84 L70 124 Z" fill="${ORANGE}"/>
  <path d="M78 128 L126 72 L152 102 L104 158 Z" fill="${ORANGE}" fill-opacity=".85"/>
  <circle cx="128" cy="52" r="14" fill="#ffffff"/>
</svg>`);

const W = 190 + 28 + wm.width + 28;
const H = 190;
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([
    { input: badge, left: 0, top: 0 },
    { input: word, left: 190 + 28, top: Math.round((H - wm.height) / 2) },
  ])
  .png()
  .toFile('public/clients/kavir-motor.png');
console.log('kavir-motor logo written', W, H);
