# Deploying okiyan.com (nginx)

The site is fully static. Deploy = copy `dist/` to the web root, then reload nginx.

```bash
cd /var/www/okiyan.com
git pull --ff-only origin main
npm ci
SITE_URL=https://okiyan.com npm run build:prod   # indexable build
npm run verify                                   # fails on a bad canonical / noindex page
sudo rsync -a --delete dist/ /var/www/okiyan.com/html/
sudo nginx -t && sudo systemctl reload nginx
```

> `SITE_URL` **must** be set. Without it the build falls back to the default in
> `astro.config.mjs` (`https://okiyan.com`), but setting it explicitly guarantees every
> canonical, sitemap entry, OG URL and JSON-LD `@id` points at the same host.

---

## 1. One canonical host: `okiyan.com`

Every page declares `https://okiyan.com/…` as canonical. If `okiyan.ir`, `www.okiyan.ir`
or `www.okiyan.com` still answer with a 200, Google sees **four copies of the site** and
splits ranking signals between them. Redirect all of them with a 301 to the canonical host.

`deploy/nginx-redirects.conf` is a ready block. Include it inside `server { … }` for the
old hostnames (or use it as the whole `server` block if those names point at the same IP):

```nginx
# /etc/nginx/sites-available/okiyan.com
server {
    listen 80;
    listen [::]:80;
    server_name okiyan.com www.okiyan.com okiyan.ir www.okiyan.ir;

    # ACME challenge must stay reachable over plain HTTP
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }

    location / { return 301 https://okiyan.com$request_uri; }
}
```

Check after reloading:

```bash
curl -sI https://okiyan.ir/ | head -3          # 301  Location: https://okiyan.com/
curl -sI https://okiyan.ir/guides/china/ | head -3   # path is preserved
```

The redirect must be **301 (permanent)** and must keep the path and query string —
`https://okiyan.ir/customs/bandar-abbas/` → `https://okiyan.com/customs/bandar-abbas/`.
A redirect to the homepage loses the page's history and is treated as a soft 404.

If the old domain is registered elsewhere, the same rule can be applied at the DNS/CDN
level (Cloudflare *Redirect Rules*, or the registrar's forwarding feature) — the
requirement is the same: 301, path preserved, single target host.

---

## 2. Verify the host before asking Google to crawl

```bash
curl -s https://okiyan.com/robots.txt     # Allow: / , Sitemap: …/sitemap-index.xml
curl -sI https://okiyan.com/ | grep -i 'HTTP\|content-type'
curl -s https://okiyan.com/ | grep -o '<link rel="canonical"[^>]*>'
```

Expected canonical: `https://okiyan.com/`.

## 3. Search-engine verification

Both verification tokens can be supplied at build time instead of pasting files:

```bash
GOOGLE_VERIFICATION_TOKEN=xxxxxxxx npm run build:prod
BING_VERIFICATION_TOKEN=xxxxxxxx npm run build:prod
```

`BaseHead.astro` emits `<meta name="google-site-verification">` and/or
`<meta name="msvalidate.01">` only when the variable is non-empty, so the markup of a
build without tokens is unchanged.

After verification:

1. Google Search Console → **Sitemaps** → submit `sitemap-index.xml`.
2. Google Search Console → **URL Inspection** → request indexing for `/`,
   `/guides/customs-clearance-guide/`, `/imports/china/`, `/customs/bandar-abbas/`.
3. Bing Webmaster Tools → **Sitemaps** → submit the same URL. Bing feeds
   ChatGPT Search, so this step matters for AI answers, not only for Bing.

## 4. Why the site stays reachable for AI crawlers

`src/pages/robots.txt.ts` lists the answer-engine crawlers explicitly (GPTBot,
OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot/User, PerplexityBot/User,
Google-Extended, Applebot-Extended, Bingbot, CCBot) and advertises `/llms.txt`.
If a WAF, bot-protection rule or CDN challenge is added later, make sure those user
agents are not blocked — a 403 for `GPTBot` removes the site from that answer engine.
