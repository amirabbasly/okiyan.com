import type { APIRoute } from 'astro';
import { isProduction } from '~/config/site';

/**
 * Production: allow crawling and point to the sitemap.
 * Any other SITE_ENV: block crawling (pages also carry `noindex`, and the build
 * writes an `X-Robots-Tag: noindex` header file — see integrations/indexing.mjs).
 */
export const GET: APIRoute = ({ site }) => {
  const body = isProduction
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : `# Non-production build (SITE_ENV != production): do not crawl.\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
