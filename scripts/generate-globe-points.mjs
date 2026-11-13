/**
 * Builds the point set for the hero globe from real world geography.
 *
 * Run with `node scripts/generate-globe-points.mjs`. It reads Natural Earth land
 * polygons (world-atlas, 110m), rasterises them into an equirectangular mask
 * with sharp, then keeps every grid cell whose centre falls on land. The result
 * is packed into a small base64 string of (lon, lat) byte pairs, which the
 * canvas globe decodes at run time.
 *
 * The output is committed (src/data/globe-points.json) so a normal build never
 * needs world-atlas; the devDependency only exists to regenerate it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import sharp from 'sharp';

const W = 1440; // 4 px per degree — plenty for a dot grid
const H = 720;

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);

/** Equirectangular path: lon/lat → x/y in the raster. */
const project = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
const toPath = (rings) =>
  rings
    .map((ring) => {
      const pts = ring.map(project);
      return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
    })
    .join('');

/** world-atlas returns a FeatureCollection; flatten every ring set into one path. */
const features = land.features ?? [land];
const d = features
  .flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates))
  .map((poly) => toPath(poly))
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path d="${d}" fill="#fff"/></svg>`;
const { data } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
const isLand = (x, y) => data[y * W + x] > 127;

/**
 * Sample the sphere *uniformly* (Fibonacci lattice) rather than walking a
 * lon/lat grid: a grid bunches dots at the poles and, once projected
 * orthographically, smears them into bands near the limb. Uniform points keep
 * the same density everywhere, which is what makes the reference globe look
 * even while it turns.
 */
const TOTAL = 16000;
const golden = Math.PI * (3 - Math.sqrt(5));
const points = [];
for (let i = 0; i < TOTAL; i++) {
  const y = 1 - (i / (TOTAL - 1)) * 2; // 1 … -1 (sin of latitude)
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;

  const lat = (Math.asin(y) * 180) / Math.PI;
  // longitude measured from the map's central meridian (-180 … 180)
  const lon = (Math.atan2(z, x) * 180) / Math.PI;

  const [px, py] = project([lon, lat]);
  const col = Math.min(W - 1, Math.max(0, Math.round(px)));
  const row = Math.min(H - 1, Math.max(0, Math.round(py)));
  if (!isLand(col, row)) continue;

  const qLon = Math.round(((lon + 180) / 360) * 255);
  const qLat = Math.round(((lat + 90) / 180) * 255);
  points.push([qLon, qLat]);
}

const bytes = Buffer.alloc(points.length * 2);
points.forEach(([lon, lat], i) => {
  bytes[i * 2] = lon;
  bytes[i * 2 + 1] = lat;
});

const out = {
  generatedFrom: 'world-atlas land-110m (Natural Earth, public domain)',
  count: points.length,
  /* base64 of interleaved (lon, lat) bytes, each 0–255 over 360°/180° */
  data: bytes.toString('base64'),
};

writeFileSync('src/data/globe-points.json', JSON.stringify(out) + '\n');
console.log(`globe points: ${points.length} → ${(out.data.length / 1024).toFixed(1)} kB of base64`);
