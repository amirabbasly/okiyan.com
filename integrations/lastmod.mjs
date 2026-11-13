// @ts-check
import { readdirSync, readFileSync } from "node:fs";

/**
 * Map content collection → URL prefix.
 * Guides live at /guides/<id>/, customs offices at /customs/<id>/,
 * origin-country pages at /imports/<id>/ and commodity pages at /goods/<id>/.
 */
const collections = [
  {
    dir: new URL("../src/content/guides/", import.meta.url),
    prefix: "/guides/",
  },
  {
    dir: new URL("../src/content/customs/", import.meta.url),
    prefix: "/customs/",
  },
  {
    dir: new URL("../src/content/origins/", import.meta.url),
    prefix: "/imports/",
  },
  {
    dir: new URL("../src/content/goods/", import.meta.url),
    prefix: "/goods/",
  },
];

/** Map of URL path → ISO date from `updatedDate` (or `publishDate`) front matter. */
const dates = (() => {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const { dir, prefix } of collections) {
    /** @type {string[]} */
    let files = [];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
      continue; // collection not present in this checkout
    }
    for (const file of files) {
      const front =
        readFileSync(new URL(file, dir), "utf8").split("---")[1] ?? "";
      const pick = (/** @type {string} */ key) =>
        front.match(
          new RegExp(`^${key}:[ \\t]*['"]?(\\d{4}-\\d{2}-\\d{2})`, "m"),
        )?.[1];
      const date = pick("updatedDate") ?? pick("publishDate");
      if (date)
        map.set(
          `${prefix}${file.replace(/\.md$/, "")}/`,
          new Date(date).toISOString(),
        );
    }
    const newest = [...map.entries()]
      .filter(([p]) => p.startsWith(prefix))
      .map(([, d]) => d)
      .sort()
      .at(-1);
    if (newest) map.set(prefix, newest);
  }
  return map;
})();

/** @param {string} pathname */
export function guideLastmod(pathname) {
  return dates.get(pathname);
}
