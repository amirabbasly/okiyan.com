/**
 * Layers for the live «پیش از هر تصمیم» scene:
 *   public/img/ship-vertical.webp – the vertical container ship + wake, keyed
 *     off its magenta isolation sheet (chroma key + despill), cropped tight;
 *   public/img/sea-tile.webp      – a seamless dark-water tile sampled from the
 *     original top-down photo, so the sea can scroll forever in CSS.
 * The horizontal ship of the first render is simply not part of these layers.
 * Run: node scripts/make-cta-sea.mjs
 */
import { rm } from 'node:fs/promises';
import sharp from 'sharp';

const SHIP_SRC = 'src/assets/brand/ship-vertical-src.png';
const SEA_SRC = 'src/assets/brand/sea-source.jpg';

/* ---- 1. chroma key the magenta sheet ---- */
{
  const { data, info } = await sharp(SHIP_SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const out = Buffer.alloc(N * 4);
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let p = 0; p < N; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    const d = Math.sqrt((r - 228) ** 2 + (g - 42) ** 2 + (b - 227) ** 2);
    const a = Math.min(1, Math.max(0, (d - 45) / 110));
    const A = Math.round(a * 255);
    out[p * 4 + 3] = A;
    if (!A) continue;
    let rr = (r - 228 * (1 - a)) / a;
    let gg = (g - 42 * (1 - a)) / a;
    let bb = (b - 227 * (1 - a)) / a;
    const spill = Math.min(rr, bb) - gg; // magenta fringe: red+blue over green
    if (spill > 0) { rr -= spill * 0.9; bb -= spill * 0.9; }
    out[p * 4] = Math.round(Math.min(255, Math.max(0, rr)));
    out[p * 4 + 1] = Math.round(Math.min(255, Math.max(0, gg)));
    out[p * 4 + 2] = Math.round(Math.min(255, Math.max(0, bb)));
    const x = p % W, y = (p / W) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  console.log('ship kept px bbox', minX, minY, maxX, maxY);
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize({ height: 1400 })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile('public/img/ship-vertical.webp');
}

/* ---- 2. seamless dark-water tile ---- */
{
  const S = 256, F = 64; // tile size + crossfade width
  const { data } = await sharp(SEA_SRC)
    .extract({ left: 48, top: 496, width: S, height: S })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x, y) => { const i = ((y + S) % S * S + ((x + S) % S)) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  const ramp = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t))); // 0→1
  const out = Buffer.alloc(S * S * 3);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // blend the patch with its mirrors near the edges so opposite sides agree
      const wx = x < F ? ramp(x / F) : x > S - 1 - F ? ramp((S - 1 - x) / F) : 1;
      const wy = y < F ? ramp(y / F) : y > S - 1 - F ? ramp((S - 1 - y) / F) : 1;
      const p = at(x, y), hx = at(S - 1 - x, y), vy = at(x, S - 1 - y), hv = at(S - 1 - x, S - 1 - y);
      const mx = (c, i) => p[i] * wx + hx[i] * (1 - wx);
      const my = (c, i) => vy[i] * wx + hv[i] * (1 - wx);
      const i = (y * S + x) * 3;
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(mx(c, c) * wy + my(c, c) * (1 - wy));
    }
  }
  await sharp(out, { raw: { width: S, height: S, channels: 3 } })
    .webp({ quality: 82 })
    .toFile('public/img/sea-tile.webp');
}

for (const f of ['public/img/ship-topdown-1200.webp', 'public/img/ship-topdown-800.webp']) {
  await rm(f, { force: true });
}
console.log('cta sea layers written');
