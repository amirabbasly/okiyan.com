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

## 1b. `okiyan.ir` — the full runbook

The `.ir` domain is **not** a second website. It is a permanent signpost: every URL
answers `301` to the same path on `https://okiyan.com`. Two ways to get there; pick one.

### Path A — Cloudflare zone for `okiyan.ir` (recommended)

1. Cloudflare → **Add a site** → `okiyan.ir` → Free plan. Cloudflare gives you **two
   nameservers** (for example `ada.ns.cloudflare.com` / `bob.ns.cloudflare.com`).
2. At the `.ir` registrar (nic.ir panel or the reseller you bought from), replace the
   current nameservers with exactly those two. Nothing else is needed at the registrar.
3. **Before** switching NS, copy every existing DNS record into the new Cloudflare zone —
   especially `MX`, `TXT` (SPF/DKIM/DMARC) and any `A` record used for mail or a landing
   page. Switching nameservers without recreating mail records silently breaks email.
4. Add a **proxied** `A` record: name `@`, value = the same origin IP as `okiyan.com`,
   proxy **on**. Add `www` the same way (or `CNAME www → okiyan.ir`, proxied).
5. Rules → **Redirect Rules** → *Create rule*:

   | Field | Value |
   |---|---|
   | Rule name | `ir → com` |
   | When incoming requests match | `Custom filter expression` → `true` (all requests) |
   | Type | **Dynamic** |
   | Expression | `concat("https://okiyan.com", http.request.uri.path)` |
   | Status code | **301** |
   | Preserve query string | **on** |

6. SSL/TLS → **Always Use HTTPS: on**. That turns `http://okiyan.ir/x` into a single hop
   straight to `https://okiyan.com/x`.
7. Test: `curl -sI https://okiyan.ir/guides/china/ | head -3` → `301` + `location:
   https://okiyan.com/guides/china/`.

With this path nginx needs **no** certificate and **no** `server_name` for `okiyan.ir`;
the request never reaches the origin.

### Path B — DNS at the registrar, redirect in nginx

1. Point `okiyan.ir` (`A @` and `A www`) at the same server IP — or at the Cloudflare
   proxy of the `.com` zone if you prefer to keep one zone (Cloudflare only proxies
   hostnames that belong to the zone, so this only works with a separate `.ir` zone;
   otherwise leave the `.ir` records **DNS-only**).
2. Issue a certificate that also covers the `.ir` names:

   ```bash
   sudo certbot --nginx -d okiyan.ir -d www.okiyan.ir --redirect
   ```

3. Add the server blocks from `deploy/nginx-redirects.conf`:

   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name okiyan.ir www.okiyan.ir;
       location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
       location / { return 301 https://okiyan.com$request_uri; }
   }
   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name okiyan.ir www.okiyan.ir;
       ssl_certificate     /etc/letsencrypt/live/okiyan.ir/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/okiyan.ir/privkey.pem;
       location / { return 301 https://okiyan.com$request_uri; }
   }
   ```

### Rules that must not be broken

| Do | Don't |
|---|---|
| `301`, permanent | `302` / `307` (temporary) — passes no signal |
| Keep the **path** (`/a/b/` → `/a/b/`) | Redirect everything to the homepage (soft 404) |
| One hop | `http → https://okiyan.ir → https://okiyan.com` (chain) |
| `robots.txt` on `.ir` allows crawling | `Disallow: /` on `.ir` — the bot must fetch to see the 301 |
| Keep the domain registered and renewed | Let it expire — every backlink dies with it |
| Keep going for years | Remove the redirect after "migration is done" |

`meta refresh`, JavaScript redirects and a parked "this domain is for sale" page are all
worse than nothing: they either leak signals or create a thin page that can outrank the
real site for the brand query.

### Search Console side of the migration

1. Verify **both** properties (`okiyan.ir` and `okiyan.com`).
2. In the `.ir` property → **Settings → Change of address** → choose `okiyan.com`.
3. Submit only the `.com` sitemap.
4. Keep the `.ir` property for ~6 months and watch **Pages → Page with redirect** drop to zero.

---

## 1c. Tell Bing the moment you publish (IndexNow)

`public/4a887474e9928a0817887b96c3bdf594.txt` holds the IndexNow key, so the live site
serves `https://okiyan.com/4a887474e9928a0817887b96c3bdf594.txt`. After a deploy:

```bash
npm run seo:indexnow                      # all 40 sitemap URLs
npm run seo:indexnow -- --dry             # show the payload, send nothing
npm run seo:indexnow -- /guides/customs-valuation/ /customs/bushehr/
```

Bing, Yandex, Seznam and Naver accept the same call; `api.indexnow.org` fans it out.
Bing feeds ChatGPT Search, so this is an AI-visibility step as much as an SEO one.

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

---

## 5. Registration checklist (one pass, then quarterly)

| Service | What to register | Why it matters here |
|---|---|---|
| Google Search Console | Domain property for `okiyan.com` (DNS TXT), sitemap `sitemap-index.xml` | Indexing, queries, Core Web Vitals, change-of-address |
| Google Business Profile | One profile per real office (تهران، بوشهر، بندرعباس) | Map pack for «ترخیص کالا بوشهر»-type queries |
| Bing Webmaster Tools | Site + import from Search Console, sitemap, IndexNow | Feeds Bing *and* ChatGPT Search |
| Bing Places | Same three offices | The Bing equivalent of the local pack |
| Yandex Webmaster | Optional; verify + sitemap | Iran–Russia trade queries |
| Cloudflare (zone `okiyan.com`) | DNS, SSL Full (strict), HSTS, cache rules | Speed = ranking factor, and a single copy of each page |
| Analytics | GA4 linked to Search Console | Join clicks with behaviour |

Fill `site.social` in `src/config/site.ts` (Instagram / LinkedIn / Telegram) the moment
the profiles exist: they are emitted as `sameAs` on the Organization node, which is how
search engines tie the brand to one entity.
