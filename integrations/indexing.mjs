// @ts-check
import { writeFile } from 'node:fs/promises';

/**
 * Writes host header rules after the build:
 * - non-production builds get `X-Robots-Tag: noindex, nofollow` on every response
 *   (honoured by Netlify / Cloudflare Pages `_headers` files);
 * - all builds get long-lived caching for hashed assets.
 *
 * @param {{ production: boolean }} opts
 * @returns {import('astro').AstroIntegration}
 */
export default function indexing({ production }) {
  return {
    name: 'okiyan:indexing',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const rules = ['/_astro/*', '  Cache-Control: public, max-age=31536000, immutable', ''];
        if (!production) rules.push('/*', '  X-Robots-Tag: noindex, nofollow', '');
        await writeFile(new URL('_headers', dir), rules.join('\n'), 'utf8');
        logger.info(production ? 'Production build: indexing allowed.' : 'Non-production build: noindex headers + blocking robots.txt written.');
      },
    },
  };
}
