#!/usr/bin/env node
/**
 * IndexNow — tell Bing (and Yandex, Seznam, Naver) about changed URLs the moment
 * they are published, instead of waiting for a crawl.
 *
 * The key lives in `public/<key>.txt` and is copied verbatim into `dist/`, so
 * `https://okiyan.com/4a887474…594.txt` always contains the key. Nothing secret
 * is involved: IndexNow keys are public by design.
 *
 * Usage (on the server, after `npm run build:prod` and the rsync):
 *
 *   npm run seo:indexnow              # submit every sitemap URL
 *   npm run seo:indexnow -- --dry     # print what would be sent
 *   npm run seo:indexnow -- /guides/customs-valuation/ /customs/bushehr/
 *
 * Exit code is 0 when at least one endpoint accepted the batch (200/202),
 * 1 otherwise — so it can sit in a deploy script without breaking it silently.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const KEY = "4a887474e9928a0817887b96c3bdf594";
const HOST = process.env.SITE_HOST || "okiyan.com";
const ORIGIN = `https://${HOST}`;

/** Endpoints that speak the IndexNow protocol. api.indexnow.org fans out to all partners. */
const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

function sitemapUrls(dist = "dist") {
  if (!existsSync(dist)) throw new Error("dist/ not found — run the build first.");
  const files = readdirSync(dist).filter((f) => /^sitemap.*\.xml$/.test(f));
  if (!files.length) throw new Error("no sitemap*.xml in dist/ — is @astrojs/sitemap configured?");
  const urls = new Set();
  for (const f of files) {
    const xml = readFileSync(join(dist, f), "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = m[1].trim();
      // sitemap-index.xml lists sitemap-0.xml — that is not a page.
      if (u.startsWith(ORIGIN) && !u.endsWith(".xml")) urls.add(u);
    }
  }
  return [...urls];
}

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const explicit = args.filter((a) => a.startsWith("/")).map((p) => `${ORIGIN}${p}`);

const urls = explicit.length ? explicit : sitemapUrls();
if (!urls.length) {
  console.error("nothing to submit");
  process.exit(1);
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `${ORIGIN}/${KEY}.txt`,
  urlList: urls,
};

if (dry) {
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\n${urls.length} URL(s) — dry run, nothing sent.`);
  process.exit(0);
}

let accepted = 0;
for (const endpoint of ENDPOINTS) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const ok = res.status === 200 || res.status === 202;
    if (ok) accepted++;
    console.log(`${ok ? "✓" : "✗"} ${endpoint} → ${res.status}`);
  } catch (err) {
    console.log(`✗ ${endpoint} → ${err.message}`);
  }
}

console.log(`${urls.length} URL(s) submitted to ${accepted}/${ENDPOINTS.length} endpoint(s).`);
process.exit(accepted > 0 ? 0 : 1);
