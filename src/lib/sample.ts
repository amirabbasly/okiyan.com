/**
 * Pages that still carry temporary sample (dummy) content.
 *
 * While a page is listed in src/data/sample-pages.json it:
 * - shows a visible «محتوای نمونه» notice under the header (in every build, so sample
 *   text can never pass for real business information);
 * - is `noindex` and left out of the sitemap (astro.config.mjs, scripts/verify-dist.mjs);
 * - is listed in a warning at the end of every build.
 *
 * After replacing a page's content with real information, remove its path from the JSON file.
 */
import sample from '~/data/sample-pages.json';

export const samplePages: readonly string[] = sample.pages;

export const isSamplePage = (path: string) => samplePages.includes(path.endsWith('/') ? path : `${path}/`);
