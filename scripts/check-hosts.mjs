#!/usr/bin/env node
/**
 * Canonical-host audit — run after any DNS / redirect change.
 *
 * Confirms the promise the whole SEO setup depends on:
 *   every hostname that still resolves answers ONE permanent redirect
 *   to https://okiyan.com + the same path + the same query string.
 *
 *   npm run seo:hosts
 *
 * Exit code 0 = every scenario passed, 1 = something needs fixing.
 * `--base <origin>` overrides the expected target (used by the local self-test).
 */

const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1].replace(/\/$/, "") : "https://okiyan.com";
})();

// Positional URLs are custom targets; skip the value that belongs to --base.
const argv = process.argv.slice(2);
const baseArgIndex = argv.indexOf("--base");
const positional = argv.filter(
  (a, i) => /^https?:\/\//.test(a) && i !== baseArgIndex + 1,
);

/** Scenarios that must hold on the live site. */
const DEFAULTS = [
  { url: "http://okiyan.com/", path: "/", note: "http → https، بدون www" },
  { url: "https://www.okiyan.com/", path: "/", note: "www حذف شود" },
  { url: "https://okiyan.ir/", path: "/", note: "دامنهٔ قدیم → دامنهٔ اصلی" },
  { url: "https://www.okiyan.ir/", path: "/", note: "www دامنهٔ قدیم" },
  { url: "https://okiyan.ir/guides/customs-valuation/", path: "/guides/customs-valuation/", note: "مسیر حفظ شود" },
  {
    url: "https://okiyan.ir/guides/?utm_source=test&utm_medium=qa",
    path: "/guides/",
    query: "?utm_source=test&utm_medium=qa",
    note: "query string حفظ شود",
  },
];

const targets = positional.length
  ? positional.map((url) => {
      const u = new URL(url);
      return { url, path: u.pathname, query: u.search, note: "custom" };
    })
  : DEFAULTS;

const MAX_HOPS = 3;

async function trace(startUrl) {
  const chain = [];
  let current = startUrl;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const res = await fetch(current, { redirect: "manual", headers: { "user-agent": "okiyan-host-audit/1.0" } });
    const location = res.headers.get("location");
    chain.push({ url: current, status: res.status, location });
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }
    return { chain, finalUrl: current, finalStatus: res.status };
  }
  return { chain, finalUrl: current, finalStatus: -1, tooManyHops: true };
}

const rows = [];
for (const t of targets) {
  const problems = [];
  let chain = [];
  let finalUrl = "";
  let finalStatus = 0;
  try {
    const out = await trace(t.url);
    ({ chain, finalUrl, finalStatus } = out);
    if (out.tooManyHops) problems.push("زنجیرهٔ ریدایرکت طولانی‌تر از حد");

    const expected = BASE + t.path + (t.query ?? "");
    const redirects = chain.length - 1;
    const first = chain[0];

    // A URL that already sits on the canonical origin may answer 200 directly.
    const alreadyCanonical = redirects === 0 && finalStatus === 200 && finalUrl === expected;

    if (!alreadyCanonical) {
      const permanent = first.status === 301 || first.status === 308;
      if (!permanent) problems.push(`پرش اول ${first.status} است، نه 301`);
      if (redirects > 1) problems.push(`${redirects} پرش (باید ۱ باشد)`);
      if (finalUrl !== expected) problems.push(`مقصد نهایی: ${finalUrl}`);
      if (finalStatus !== 200) problems.push(`وضعیت نهایی ${finalStatus}`);
    }
  } catch (err) {
    problems.push(`خطا: ${err.message}`);
  }

  rows.push({ url: t.url, note: t.note, hops: Math.max(0, chain.length - 1), finalUrl, finalStatus, problems });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nهدف: ${BASE}\n`);
console.log(pad("URL", 46), pad("پرش", 5), pad("کد", 5), "نتیجه");
console.log("-".repeat(88));
let failed = 0;
for (const r of rows) {
  const ok = r.problems.length === 0;
  if (!ok) failed++;
  console.log(pad(r.url, 46), pad(r.hops, 5), pad(r.finalStatus, 5), ok ? "✓" : "✗ " + r.problems.join(" | "));
}

console.log("-".repeat(88));
if (failed) {
  console.log(`\n${failed} از ${rows.length} سناریو شکست خورد.`);
  process.exit(1);
}
console.log(`\nهمهٔ ${rows.length} سناریو درست است: یک پرش، ۳۰۱، مسیر و query حفظ شده.`);
