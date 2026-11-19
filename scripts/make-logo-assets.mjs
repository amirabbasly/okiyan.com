/**
 * Builds the two photo assets derived from the brand globe scene:
 *
 *   public/img/logo-globe.png  – the scene with its gradient background keyed out
 *                                (transparent), cropped to the artwork and scaled
 *                                for the header/footer lockup;
 *   public/img/globe-scene.webp – the original photo, compressed, for the dark
 *                                «از بندر تا انبار» band where its own background
 *                                belongs to the composition.
 *
 * Keying is done in two passes, no ML involved:
 *   1. region-grow from every border pixel while neighbouring pixels stay similar
 *      (the background is a smooth gradient, the artwork edges are not);
 *   2. pockets of background enclosed by the orbit rings are removed by comparing
 *      each opaque pixel with a bilinear estimate of the background built from the
 *      cells that pass 1 became transparent in.
 * Alpha is feathered by one pixel so edges do not alias on light backgrounds.
 *
 * Run:  node scripts/make-logo-assets.mjs
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'src/assets/brand/globe-scene-source.png';
const GROW_TOL = 17; // neighbour-to-neighbour distance the grow may cross
const POCKET_TOL = 26; // distance to the estimated background gradient
const CELL = 12;

const dist = (a, i, b, j) => {
  const dr = a[i] - b[j];
  const dg = a[i + 1] - b[j + 1];
  const db = a[i + 2] - b[j + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const { data: src, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;
/* ---- silhouette: orbit ellipse minus flat background pockets ----
 * The scene is a dark subject on a dark gradient, so plain colour keying eats
 * the vehicles. Three priors together split it cleanly:
 *   1. outside the orbit ellipse there is only gradient -> cut;
 *   2. inside, a pixel is background only if it matches a smooth background
 *      model interpolated from the border ring;
 *   3. ...and only if it sits far from any "feature" (warm glow, bright metal
 *      or a strong edge), which keeps the dark faces of the truck, ship and
 *      containers that carry rim light on their outlines.
 */
const BX0 = 44, BY0 = 62, BX1 = 941, BY1 = 620; // measured artwork bounds
const cx = (BX0 + BX1) / 2;
const cy = (BY0 + BY1) / 2;
const rx = (BX1 - BX0) / 2 + 6;
const ry = (BY1 - BY0) / 2 + 6;

const lum = (p) => 0.2126 * src[p * 3] + 0.7152 * src[p * 3 + 1] + 0.0722 * src[p * 3 + 2];
const feature = new Uint8Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const r = src[p * 3], g = src[p * 3 + 1], b = src[p * 3 + 2];
    let f = r - b > 35 || lum(p) > 115 ? 1 : 0;
    if (!f && x > 0 && y > 0 && x < W - 1 && y < H - 1) {
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (dist(src, p * 3, src, q * 3) > 22) { f = 1; break; }
      }
    }
    feature[p] = f;
  }
}
/* multi-source BFS distance to the nearest feature pixel */
const NEAR = 26;
const dfeat = new Int32Array(N).fill(1 << 20);
const queue = new Int32Array(N);
let qh = 0, qt = 0;
for (let p = 0; p < N; p++) if (feature[p]) { dfeat[p] = 0; queue[qt++] = p; }
while (qh < qt) {
  const p = queue[qh++];
  if (dfeat[p] >= NEAR) continue;
  const x = p % W, y = (p / W) | 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const q = ny * W + nx;
    if (dfeat[q] > dfeat[p] + 1) { dfeat[q] = dfeat[p] + 1; queue[qt++] = q; }
  }
}
/* smooth background model, seeded from the border ring and inpainted inward */
const gw = Math.ceil(W / CELL), gh = Math.ceil(H / CELL);
const gR = new Float64Array(gw * gh), gG = new Float64Array(gw * gh), gB = new Float64Array(gw * gh), gN = new Float64Array(gw * gh);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (x > 5 && y > 5 && x < W - 6 && y < H - 6) continue;
  const p = y * W + x;
  const c = (((y / CELL) | 0) * gw) + ((x / CELL) | 0);
  gR[c] += src[p * 3]; gG[c] += src[p * 3 + 1]; gB[c] += src[p * 3 + 2]; gN[c]++;
}
for (let pass = 0; pass < 60; pass++) {
  for (let c = 0; c < gw * gh; c++) {
    if (gN[c] > 2) continue;
    const x = c % gw, y = (c / gw) | 0;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
      const k = ny * gw + nx;
      if (gN[k] > 2) { r += gR[k] / gN[k]; g += gG[k] / gN[k]; b += gB[k] / gN[k]; n++; }
    }
    if (n) { gR[c] = r; gG[c] = g; gB[c] = b; gN[c] = 1e6; }
  }
}
/* normalise: border cells hold sums, inpainted cells already hold means */
for (let c = 0; c < gw * gh; c++) {
  if (gN[c] > 1e5) continue;
  if (gN[c] > 0) { gR[c] /= gN[c]; gG[c] /= gN[c]; gB[c] /= gN[c]; }
  gN[c] = 1e5;
}
const bg = [0, 0, 0];
const bgAt = (p) => {
  const c = (((p / W) | 0) / CELL | 0) * gw + (((p % W) / CELL) | 0);
  bg[0] = gR[c]; bg[1] = gG[c]; bg[2] = gB[c];
};
const alpha = new Uint8Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const inside = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    if (!inside) continue;
    bgAt(p);
    const dr = src[p * 3] - bg[0], dg = src[p * 3 + 1] - bg[1], db = src[p * 3 + 2] - bg[2];
    /* The night sky inside the orbit stays part of the mark (it is what makes
       the amber rings read); only the rectangle around the orbit is cut. */
    alpha[p] = 255;
  }
}

/* ---- feather: soft ramp on the ellipse edge ---- */
const soft = Uint8Array.from(alpha);
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (alpha[p] !== 255) continue;
    let edge = false;
    for (let d = -1; d <= 1 && !edge; d++)
      for (let e = -1; e <= 1; e++)
        if (alpha[(y + d) * W + x + e] === 0) {
          edge = true;
          break;
        }
    if (edge) soft[p] = 150;
  }
}

/* ---- compose RGBA, crop to the artwork, write both assets ---- */
const rgba = Buffer.alloc(N * 4);
let minX = W, minY = H, maxX = 0, maxY = 0, opaque = 0;
for (let p = 0; p < N; p++) {
  rgba[p * 4] = src[p * 3];
  rgba[p * 4 + 1] = src[p * 3 + 1];
  rgba[p * 4 + 2] = src[p * 3 + 2];
  rgba[p * 4 + 3] = soft[p];
  if (soft[p] > 0) {
    opaque++;
    const x = p % W;
    const y = (p / W) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
console.log(`badge: ${(100 * opaque / N).toFixed(1)}% of pixels kept · bbox ${minX},${minY} → ${maxX},${maxY}`);

mkdirSync('public/img', { recursive: true });
const cropped = sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({
  left: minX,
  top: minY,
  width: maxX - minX + 1,
  height: maxY - minY + 1,
});
await cropped.resize({ width: 520 }).png({ compressionLevel: 9, palette: false }).toFile('public/img/logo-globe.png');
await sharp(SRC).webp({ quality: 82 }).toFile('public/img/globe-scene.webp');
console.log('wrote public/img/logo-globe.png + public/img/globe-scene.webp');
