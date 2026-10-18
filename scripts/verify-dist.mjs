// Post-build SEO / HTML checks over dist/. Run after a build:  npm run verify
// Fails (exit 1) on errors; prints warnings for things worth a look.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const pathOf = (file) => {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === '404.html') return '/404/';
  return '/' + rel.replace(/index\.html$/, '');
};
const pages = new Set(htmlFiles.map(pathOf));
const assets = new Set(files.map((f) => '/' + relative(dist, f).split(sep).join('/')));

const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
const production = /Allow: \//.test(robots);
const sitemap = await readFile(join(dist, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const origin = new URL(sitemapUrls[0]).origin;

const titles = new Map();
const descriptions = new Map();
const report = [];

for (const file of htmlFiles) {
  const page = pathOf(file);
  const html = await readFile(file, 'utf8');
  const is404 = page === '/404/';

  if (!/<html lang="fa" dir="rtl"/.test(html)) err(page, 'missing <html lang="fa" dir="rtl">');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) err(page, 'missing <title>');
  else {
    if (titles.has(title)) err(page, `duplicate title with ${titles.get(title)}`);
    titles.set(title, page);
    if (title.length > 65) warn(page, `title is ${title.length} chars`);
  }
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!desc) err(page, 'missing meta description');
  else {
    if (descriptions.has(desc)) err(page, `duplicate description with ${descriptions.get(desc)}`);
    descriptions.set(desc, page);
    if (desc.length < 70 || desc.length > 170) warn(page, `description is ${desc.length} chars`);
  }

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) err(page, `expected exactly one <h1>, found ${h1s.length}`);

  // Heading levels must not skip downwards (h2 → h4).
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      warn(page, `heading jumps from h${levels[i - 1]} to h${levels[i]}`);
      break;
    }
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const robotsMeta = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
  if (is404) {
    if (canonical) err(page, '404 page should not declare a canonical');
    if (!robotsMeta.includes('noindex')) err(page, '404 page must be noindex');
  } else {
    if (canonical !== origin + page) err(page, `canonical ${canonical} ≠ ${origin + page}`);
    if (!sitemapUrls.includes(origin + page)) err(page, 'missing from sitemap');
    if (production && robotsMeta.includes('noindex')) err(page, 'production page is noindex');
    if (!production && !robotsMeta.includes('noindex')) err(page, 'non-production page is indexable');
  }
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!html.includes(`property="${prop}"`)) err(page, `missing ${prop}`);
  }

  // Structured data must parse and be well-formed.
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of data['@graph'] ?? [data]) types.push(node['@type']);
    } catch (e) {
      err(page, `invalid JSON-LD: ${e.message}`);
    }
  }
  if (!types.includes('Organization')) err(page, 'no Organization in JSON-LD');
  if (page !== '/' && !is404 && !types.includes('BreadcrumbList')) err(page, 'no BreadcrumbList');
  if (page.startsWith('/guides/') && page !== '/guides/' && !types.includes('Article')) err(page, 'guide has no Article');
  if (/"@type":"(Review|AggregateRating)"/.test(html)) err(page, 'review/rating markup is not allowed');

  // Images need alt (empty allowed for decorative); inline SVGs need a role or aria-hidden.
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) err(page, `img without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<svg\b[^>]*>/g)) {
    if (!/aria-hidden="true"|role="img"/.test(m[0])) warn(page, `svg without aria-hidden/role: ${m[0].slice(0, 80)}`);
  }

  // Internal links must resolve and use trailing slashes.
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const href = m[1];
    if (/\.[a-z0-9]+$/i.test(href)) {
      if (!assets.has(href)) err(page, `broken asset link ${href}`);
    } else if (!href.endsWith('/')) err(page, `link without trailing slash ${href}`);
    else if (!pages.has(href)) err(page, `broken link ${href}`);
  }

  // Main content must be in the HTML (not injected by JS).
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  const text = main.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const words = text.trim().split(' ').length;
  if (!is404 && words < 250) warn(page, `only ${words} words of main content`);

  const scripts = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]);
  let jsGz = 0;
  for (const s of scripts) jsGz += gzipSync(await readFile(join(dist, s))).length;
  report.push({ page, words, htmlKB: +(gzipSync(html).length / 1024).toFixed(1), jsKB: +(jsGz / 1024).toFixed(1), jsonLd: types.join(',') });
}

for (const url of sitemapUrls) {
  const p = new URL(url).pathname;
  if (!pages.has(p) || p === '/404/') err('sitemap', `unexpected URL ${url}`);
}

console.log(`Origin: ${origin} · ${production ? 'PRODUCTION (indexable)' : 'non-production (noindex)'}`);
console.table(report);
console.log(`(htmlKB / jsKB are gzip sizes; CSS is inlined in the HTML.)`);
if (warnings.length) console.log('\nWarnings:\n  ' + warnings.join('\n  '));
if (errors.length) {
  console.error('\nErrors:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`\n✓ ${htmlFiles.length} pages checked, ${sitemapUrls.length} sitemap URLs, no errors.`);
