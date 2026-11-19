/**
 * Brand assets from the master logo file (src/assets/brand/logo-lockup-source.jpg):
 * the flat navy/orange «O» crescent mark + OKIYAN wordmark on a near-white sheet.
 *
 * Writes:
 *   public/img/logo-lockup.png        transparent lockup (header)
 *   public/img/logo-lockup-light.png  on-dark lockup: navy→mist, orange→brighter
 *   public/img/logo-mark.png          transparent mark only (favicon, OG corner)
 *   public/logo.png                   lockup for search-engine Organization logo
 *   public/favicon.svg                mark wrapped in SVG (dark-mode friendly pair)
 *   public/favicon.ico                32px mark in an ICO container
 *   public/apple-touch-icon.png       mark on white, 180px
 *
 * Keying: the art is flat colour on white, so alpha = 1 − min(channel)/255 and the
 * colour is un-premultiplied from white; anti-aliased edges survive exactly.
 *
 * Run directly (node scripts/make-brand-logo.mjs) or via `npm run assets`,
 * which calls makeBrandAssets().
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const pub = (p) => fileURLToPath(new URL(`public/${p}`, root));
const SRC = fileURLToPath(new URL('src/assets/brand/logo-lockup-source.jpg', root));

/** measured artwork bounds inside the 1600×674 master */
const LOCKUP = { left: 113, top: 80, width: 1380, height: 479 };
const MARK = { left: 113, top: 80, width: 623, height: 477 };

const MIST = [238, 243, 248]; // wordmark/mark navy on dark backgrounds
const ORANGE_DARK_BG = [255, 122, 41];

async function keyed(crop) {
  const { data, info } = await sharp(SRC)
    .extract(crop)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const out = Buffer.alloc(n * 4);
  for (let p = 0; p < n; p++) {
    const r = data[p * 3];
    const g = data[p * 3 + 1];
    const b = data[p * 3 + 2];
    const a = 1 - Math.min(r, g, b) / 255;
    const A = Math.round(Math.min(1, Math.max(0, a)) * 255);
    if (A === 0) continue;
    const un = (c) => Math.round(Math.min(255, Math.max(0, (c - 255 * (1 - a)) / a)));
    out[p * 4] = un(r);
    out[p * 4 + 1] = un(g);
    out[p * 4 + 2] = un(b);
    out[p * 4 + 3] = A;
  }
  return { buf: out, width: info.width, height: info.height };
}

/** on-dark variant: navy pixels → mist, orange pixels → brighter orange */
function onDark({ buf, width, height }) {
  const out = Buffer.from(buf);
  for (let p = 0; p < width * height; p++) {
    const a = out[p * 4 + 3];
    if (!a) continue;
    const r = out[p * 4];
    const b = out[p * 4 + 2];
    const target = b > r ? MIST : ORANGE_DARK_BG;
    // keep the anti-aliased shade ratio: blend the original toward the target
    const shade = b > r ? Math.min(1, 0.55 + (b - r) / 200) : 1;
    out[p * 4] = Math.round(target[0] * shade);
    out[p * 4 + 1] = Math.round(target[1] * shade);
    out[p * 4 + 2] = Math.round(target[2] * shade);
  }
  return { buf: out, width, height };
}

const raw = (img) => sharp(img.buf, { raw: { width: img.width, height: img.height, channels: 4 } });

export async function makeBrandAssets() {
  const lockup = await keyed(LOCKUP);
  const mark = await keyed(MARK);
  const light = onDark(lockup);

  await raw(lockup).resize({ width: 480 }).png({ palette: true, colours: 48, quality: 90, effort: 10 }).toFile(pub('img/logo-lockup.png'));
  await raw(light).resize({ width: 480 }).png({ palette: true, colours: 48, quality: 90, effort: 10 }).toFile(pub('img/logo-lockup-light.png'));
  await raw(mark).resize({ width: 480 }).png({ palette: true, colours: 48, quality: 90, effort: 10 }).toFile(pub('img/logo-mark.png'));
  await raw(onDark(mark)).resize({ width: 480 }).png({ palette: true, colours: 48, quality: 90, effort: 10 }).toFile(pub('img/logo-mark-light.png'));
  await raw(lockup).resize({ width: 512 }).png({ palette: true, colours: 48, quality: 90, effort: 10 }).toFile(pub('logo.png'));

  /* favicon.svg: the mark as an embedded raster, so tabs keep the exact brand shape */
  const fav = await raw(mark).resize(64, 64).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><image width="64" height="64" href="data:image/png;base64,${fav.toString('base64')}"/></svg>`;
  await writeFile(pub('favicon.svg'), svg);

  /* apple-touch-icon: opaque white sheet, mark centred */
  await raw(mark)
    .resize(148, 148, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend(16)
    .png()
    .toFile(pub('apple-touch-icon.png'));

  /* favicon.ico: one 32×32 PNG in an ICO container */
  const png = await raw(mark).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile(pub('favicon.ico'), Buffer.concat([header, png]));

  console.log('brand logo assets written to public/');
}

if (process.argv[1] && process.argv[1].endsWith('make-brand-logo.mjs')) await makeBrandAssets();
