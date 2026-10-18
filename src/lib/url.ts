/** Absolute canonical URL for a site path, always with a trailing slash for pages. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const base = site ?? new URL('https://okiyan.example');
  const url = new URL(path, base);
  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += '/';
  return url.href;
}
