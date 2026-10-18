// @ts-check
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../src/content/guides/', import.meta.url);

/** Map of guide URL path → ISO date from `updatedDate` (or `publishDate`) front matter. */
const dates = (() => {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const front = readFileSync(new URL(file, dir), 'utf8').split('---')[1] ?? '';
    const pick = (/** @type {string} */ key) => front.match(new RegExp(`^${key}:[ \\t]*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
    const date = pick('updatedDate') ?? pick('publishDate');
    if (date) map.set(`/guides/${file.replace(/\.md$/, '')}/`, new Date(date).toISOString());
  }
  const newest = [...map.values()].sort().at(-1);
  if (newest) map.set('/guides/', newest);
  return map;
})();

/** @param {string} pathname */
export function guideLastmod(pathname) {
  return dates.get(pathname);
}
