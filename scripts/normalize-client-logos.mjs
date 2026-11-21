/**
 * Normalise the partner logos the owner supplied (WhatsApp/jpeg exports) into
 * wall-ready PNGs: the paper-white background is keyed out so every mark sits
 * clean on the white cards, then the art is trimmed and capped to one height.
 *
 *   node scripts/normalize-client-logos.mjs <src> <dest>
 * or with no args: re-run the built-in map of the six supplied marks.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const JOBS = [
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.53.31.jpeg', 'public/clients/nadin-khodro.png'],
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.52.13.jpeg', 'public/clients/benelli.png'],
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.20.38.jpeg', 'public/clients/nikrun-motor.png'],
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.19.17.jpeg', 'public/clients/lian-sika.png'],
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.18.08.jpeg', 'public/clients/kia-kousha.png'],
  ['/tmp/arena-coding-uploads/WhatsApp Image 2026-11-21 at 11.16.22.jpeg', 'public/clients/kavir-motor.png'],
];

const keyWhite = async (src, dest) => {
  const img = sharp(src).flatten({ background: '#ffffff' });
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    if (min >= 240) data[i + 3] = 0;
    else if (min >= 228) data[i + 3] = Math.round((240 - min) * (255 / 12));
  }
  mkdirSync(dirname(dest), { recursive: true });
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .resize({ width: 560, height: 320, fit: 'inside', withoutEnlargement: true })
    .png()
    .toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`${dest}  ${meta.width}x${meta.height}`);
};

const args = process.argv.slice(2);
const jobs = args.length >= 2 ? [[args[0], args[1]]] : JOBS;
for (const [src, dest] of jobs) {
  await keyWhite(resolve(src), resolve(dest));
}
