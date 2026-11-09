// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import indexing from './integrations/indexing.mjs';
import { guideLastmod } from './integrations/lastmod.mjs';
import samplePages from './src/data/sample-pages.json' with { type: 'json' };

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

/**
 * The canonical production origin.
 * Override with SITE_URL, e.g. for a staging host. Pick one host for production
 * and 301-redirect the other (www.okiyan.com → okiyan.com, and the old
 * okiyan.ir → okiyan.com) at the hosting level.
 */
const RANGES = {
  arabic: 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC',
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
};

/** One self-hosted Vazirmatn face (files copied from @fontsource/vazirmatn, OFL-1.1). */
const face = (/** @type {400 | 700 | 800} */ weight, /** @type {'arabic' | 'latin'} */ subset) => ({
  weight,
  style: /** @type {const} */ ('normal'),
  src: /** @type {[string]} */ ([`./src/assets/fonts/vazirmatn-${subset}-${weight}-normal.woff2`]),
  unicodeRange: /** @type {[string]} */ ([RANGES[subset]]),
});

const SITE_URL = (env.SITE_URL || 'https://okiyan.com').replace(/\/$/, '');
const IS_PRODUCTION = env.SITE_ENV === 'production';

export default defineConfig({
  site: SITE_URL,
  // Dev server only: sandbox preview hosts are random tunnels, so allow them.
  vite: { server: { allowedHosts: ['.e2b.app'] } },
  trailingSlash: 'always',
  // Inline page CSS: one fewer render-blocking request on slow mobile networks.
  build: { format: 'directory', inlineStylesheets: 'always' },
  output: 'static',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      // 404 and pages still holding sample content (src/data/sample-pages.json) stay out.
      filter: (page) => !page.includes('/404') && !samplePages.pages.includes(new URL(page).pathname),
      // lastmod only where we know the real edit date (guide front matter).
      serialize(item) {
        const date = guideLastmod(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
    indexing({ production: IS_PRODUCTION }),
  ],
  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['production', 'staging', 'development'],
        default: 'development',
      }),
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
  fonts: [
    {
      // Self-hosted Vazirmatn (OFL): 400/700/800 × Arabic/Latin subsets (~112 KB, only 400+800 preloaded).
      provider: fontProviders.local(),
      name: 'Vazirmatn',
      cssVariable: '--font-vazirmatn',
      fallbacks: ['Tahoma', 'sans-serif'],
      options: {
        variants: [
          face(400, 'arabic'),
          face(400, 'latin'),
          face(700, 'arabic'),
          face(700, 'latin'),
          face(800, 'arabic'),
          face(800, 'latin'),
        ],
      },
    },
  ],
});
