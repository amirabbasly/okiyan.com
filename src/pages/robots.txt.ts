import type { APIRoute } from "astro";
import { isProduction } from "~/config/site";

/**
 * Production: allow crawling and point to the sitemap.
 * Search crawlers and answer-engine crawlers (GPTBot / OAI-SearchBot /
 * ClaudeBot / PerplexityBot / Google-Extended) are listed explicitly: an
 * `Allow: /` for a named agent is a clearer signal than inheriting `*`, and it
 * keeps the site quotable in AI answers.
 * Any other SITE_ENV: block crawling (pages also carry `noindex`, and the build
 * writes an `X-Robots-Tag: noindex` header file — see integrations/indexing.mjs).
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("/sitemap-index.xml", site).href;
  const body = isProduction
    ? [
        "# okiyan.com — ترخیص کالا، واردات و صادرات",
        "# All public pages are readable by search and answer engines.",
        "",
        "User-agent: *",
        "Allow: /",
        "",
        ...AI_AGENTS.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
        "Sitemap: " + sitemap,
        "LLMs-Txt: " + new URL("/llms.txt", site).href,
        "",
      ].join("\n")
    : `# Non-production build (SITE_ENV != production): do not crawl.\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
