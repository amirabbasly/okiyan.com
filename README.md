# اوکیان / OKIYAN — website

Persian (RTL) marketing site for a customs-clearance and import-services business.
Astro 7 + TypeScript, fully static, plain CSS, ~5 KB of gzipped JavaScript on the homepage.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies (Node ≥ 22.22) |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run check` | Astro + TypeScript diagnostics |
| `npm run test:journey` | Unit checks for the shipment-journey timeline |
| `npm run build` | Static build into `dist/` — **staging mode (noindex)** unless `SITE_ENV=production` |
| `npm run build:prod` | Same build with `SITE_ENV=production` (indexable) |
| `npm run verify` | Post-build SEO/HTML checks over `dist/` (titles, canonicals, H1s, sitemap, JSON-LD, links) |
| `npm run preview` | Serve `dist/` locally (genuine 404 status for unknown URLs) |
| `npm run assets` | Regenerate favicon, `logo.png` and `og/default.png` from the vector sources |

## Configuration

### Environment variables (see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical production origin. Defaults to `https://okiyan.ir` (the domain in the logo). Drives canonicals, sitemap, OG URLs. Redirect `www.okiyan.ir` to it with a 301 at the host. |
| `SITE_ENV` | `production` makes the site indexable. **Anything else** (default `development`) emits `<meta name="robots" content="noindex, nofollow">`, a `Disallow: /` robots.txt, and an `X-Robots-Tag: noindex` rule in `dist/_headers`. |
| `PUBLIC_FORM_ENDPOINT` | URL that receives the consultation form as a `POST` (multipart FormData). Empty = clearly labelled demo mode. |

**Production indexing checklist:** set `SITE_URL` to the final domain, `SITE_ENV=production`, build with
`npm run build:prod`, then `npm run verify` (it fails if any production page is noindex or any canonical is wrong).
Staging deployments must leave `SITE_ENV` unset; ideally also protect them with HTTP auth.

### Business details — `src/config/site.ts`

Brand name, contact channels, social links, company facts, service areas. **Every `null` is information that was not
supplied and was deliberately not invented.** Missing values:

- are hidden in production builds;
- appear as dashed “اطلاعات تکمیل‌نشده” placeholders in staging/development builds;
- are listed in a warning at the end of every build.

Contact/WhatsApp/Telegram/email links appear automatically once the values are set.
Service scope copy lives in `src/data/services.ts` and in the two service pages.

### Brand (logo and colours)

- Master logo: `src/assets/brand/okiyan-logo.webp` (as supplied).
- Brand palette (from the brand guide): deep navy `#162C47` (سرمه‌ای عمیق), petrol blue `#234D66` (آبی نفتی),
  neutral silver `#A8B0BA` (نقره‌ای خنثی), light grey `#E8ECEE` (خاکستری روشن) and white. These are the ★ tokens in
  `src/styles/global.css`; the other tokens there are tints/shades derived from them (e.g. `--petrol-300` is the
  accent used on navy backgrounds, `--slate-600` the muted body text). Petrol blue is the accent on light pages;
  silver is for rules and decoration only (too light for text on white).
- Vector mark: `src/data/brand.ts` holds the two traced crescents and the brand colours used by `Mark.astro`/`Logo.astro`,
  the illustrations and the asset script. The mark is drawn in deep navy + petrol blue on light backgrounds and in
  light grey + light petrol on navy. The supplied master logo file still has its original colours.
- After changing the mark, run `npm run assets` to regenerate the favicon, `logo.png` and the OG image.

## Content editing

- **Guides**: Markdown files in `src/content/guides/`. Front matter is validated (`src/content.config.ts`):
  `title` (H1 + `<title>`), `navTitle`, `description` (≤170 chars), `order`, `publishDate`, `updatedDate`,
  `relatedService`, `relatedGuides`, `summary` (2–5 bullets), `sources` (title/publisher/url/note) and
  `reviewNotes` (shown only in staging builds). A new file becomes `/guides/<file-name>/`, joins the guide index,
  footer and sitemap, and gets Article + BreadcrumbList markup.
- **Pages**: `src/pages/` (`index`, `customs-clearance`, `import-services`, `commercial-services`, `special-projects`,
  `price-calculator`, `guides`, `about`, `resume`, `partners`, `guarantee`, `contact`, `404`).
  Copy for lists, FAQs and steps sits at the top of each page file.
- **Navigation**: `nav` in `src/config/site.ts` drives the header (with the «خدمات» and «درباره ما» dropdowns),
  the mobile menu and the footer columns.
- **Sample-content pages**: رزومه، همکاران، خدمات بازرگانی، پروژه‌های خاص، ضمانت and محاسبه قیمت currently hold
  dummy text. Pages listed in `src/data/sample-pages.json` show a «محتوای نمونه» notice in every build, are
  `noindex`, stay out of the sitemap and are listed in a build warning. Replace a page's text (and, for the
  calculator, the rates in `src/data/pricing.ts`), then remove its path from the JSON file to publish it normally.
- **Journey stage text**: `src/components/journey/stages.ts`.

## Shipment-journey animation

Files in `src/components/journey/`:

| File | Role |
| --- | --- |
| `timeline.ts` | Pure `computeFrame(p)` → pose of every moving part for progress `p ∈ [0,1]`. Camera keyframes, stage windows (`seg()` ranges), world coordinates. |
| `JourneyScene.astro` | The SVG world (decorative, `aria-hidden`). Server-renders the frame for `p = 0`, so it is meaningful before/without JS. |
| `journey-client.ts` | Reads native scroll position → progress → applies the frame. Light damping, swell only while on screen. |
| `ShipmentJourney.astro` | The homepage header: a pinned, framed scene (90% of the page width) with a minimal overlay (the H1 and CTA via the `intro` slot, fading out once the journey starts) and a five-step bar; each step is a `<details>` whose description opens as a card on click. |
| `stages.ts` | Stage copy (the real content). |

How it behaves:

- Progress comes from how far the pinned panel has travelled through its scroll track (pin vs. track; `--hj-scroll` sets the distance). No scroll hijacking; jumping or fast scrolling lands on the correct frame because frames depend only on `p`.
- Clicking a step opens its description card and scrolls the animation to that stage; on wider screens the camera pans so the scene stays clear of the card.
- The client fits the SVG `viewBox` to the frame's shape (`data-base-w`/`data-base-h` on the SVG): the full scene height is always shown, and wider frames reveal more of the harbour to each side.
- One container element is handed from yard → ship → crane → truck; `npm run test:journey` asserts it never teleports.
- `prefers-reduced-motion: reduce`: each stage snaps to its completed state, no damping, no swell.
- No JavaScript: nothing is pinned, the stage titles still open natively, and all text remains readable.
- The rAF loop and the CSS wave loop run only while the section intersects the viewport.

Section entrances (`.reveal`) use a tiny IntersectionObserver (`src/scripts/reveal.ts`), not CSS
scroll-driven animations (`animation-timeline: view()`): in Chrome those stalled touchpad scrolling for
up to a minute after scrolling past the top/bottom edge, and the production CSS minifier silently dropped
them anyway. Keep it that way.

To retime a stage, edit the `seg(t, a, b)` windows in `computeFrame`. To move scenery, change `WORLD` in `timeline.ts`
and the matching coordinates in `JourneyScene.astro`, then run `npm run test:journey`.

## Consultation form

`src/components/forms/` — accessible validation (error summary, inline messages, `aria-invalid`), Persian/Latin
digit normalisation, honeypot. With `PUBLIC_FORM_ENDPOINT` set it posts FormData via `fetch` (native POST without
JS) and shows success **only on a 2xx response**; errors keep the entered data. Any service that accepts multipart
POST with CORS works (e.g. Formspree, Basin, a Cloudflare Worker, your own API). Field names: `name`, `company`,
`contactMethod`, `contact`, `service`, `goods`, `stage`, `origin`, `port`, `message`, `consent`, `page`.

## Deployment

Static output in `dist/`. Netlify and Cloudflare Pages pick up `dist/_headers` (immutable caching for `/_astro/*`, and
noindex on non-production builds) and serve `404.html` with a real 404 status. URLs use trailing slashes
(`trailingSlash: 'always'`); these hosts redirect `/guides` → `/guides/` automatically. On other hosts, configure the
same redirect and 404 handling, and serve `/_astro/*` with long-lived caching.

## Performance (measured)

Lighthouse 13.5 (CLI, default mobile profile: Moto G-class emulation, simulated slow 4G, 4× CPU throttling) against
`npm run preview` on a local machine:

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |
| `/customs-clearance/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `/import-services/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `/guides/customs-clearance-cost/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `/contact/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |

Reproduce: `npm run build:prod && npm run preview -- --port 4322`, then
`npx lighthouse@13.5.0 http://localhost:4322/ --chrome-flags="--headless=new"`.
These are lab numbers from localhost: they cannot establish real-user Core Web Vitals (LCP/INP/CLS), which need field
data (CrUX / RUM) after launch, from real networks, devices and a real CDN.

Budget notes: fonts are 2 Vazirmatn weights × Arabic/Latin subsets (~74 KB, preloaded, metric-matched fallback);
CSS is inlined; JS = prefetch helper (~1 KB gz) + journey (~4 KB gz, homepage only) + form (~2.5 KB gz, contact only).

## Missing business information / integrations

Fill these before launch (also printed by every build):

- Phone, WhatsApp, Telegram, email, office address, response hours (`site.contact`)
- Legal company name, founding year, customs-broker licence / registrations (`site.company`)
- Customs offices / ports actually served (`site.serviceAreas`)
- Social profiles (`site.social`)
- Confirmation of the service scope and exclusions on `/import-services/` and `/customs-clearance/`, and of the
  “how we work” principles on the homepage and About page (`site.scopeConfirmed`)
- Production domain (`SITE_URL`) and form endpoint (`PUBLIC_FORM_ENDPOINT`)
- Optional: privacy policy page, analytics (none is installed), real photography

## Content review (regulatory)

The guides avoid rates, percentages and deadlines and link to official sources. The official Iranian portals
(irica.ir, ntsw.ir, tpo.ir, cbi.ir) could not be reached from the build environment, so statements were kept general
and each guide lists specific `reviewNotes` (visible on staging builds) for a qualified customs professional to
confirm — e.g. the insurance-from-domestic-insurer requirement, the exchange-rate basis for duties, and current
sequencing of order registration and currency allocation.
