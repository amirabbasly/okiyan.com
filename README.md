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
| `SITE_URL` | Canonical production origin. Defaults to `https://okiyan.com`. Drives canonicals, sitemap, OG URLs. Redirect `www.okiyan.com` (and the old `okiyan.ir`) to it with a 301 at the host. |
| `SITE_ENV` | `production` makes the site indexable. **Anything else** (default `development`) emits `<meta name="robots" content="noindex, nofollow">`, a `Disallow: /` robots.txt, and an `X-Robots-Tag: noindex` rule in `dist/_headers`. |
| `PUBLIC_FORM_ENDPOINT` | URL that receives the consultation form as a `POST` (multipart FormData, including the packing-list file). Empty = the form says online sending is unavailable and shows the phone numbers; it never fakes a success. |

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
- **Pages**: `src/pages/` (`index`, `customs-clearance`, `container-import`, `import-services`, `sailor-import`,
  `export-services`, `special-projects`, `price-calculator`, `guides`, `about`, `resume`,
  `partners`, `guarantee`, `terms`, `contact`, `404`). Copy for lists, FAQs and steps sits at the top of each page file;
  the service pages share the same skeleton (hero + illustration, fit card, scope, steps, documents, pitfalls, FAQ,
  CTA) and each has its own plate in `src/components/illustrations/`.
- **Navigation**: `nav` in `src/config/site.ts` drives the header (with the «خدمات» and «درباره ما» dropdowns),
  the mobile menu and the footer columns. On desktop the whole menu is one **dark capsule** centred in the white
  header (white labels, petrol underline for the current page); the brand and the actions take equal space so the
  capsule stays centred. The top level is exactly **خدمات · واردات ملوانی · ترخیص · واردات کانتینری · صادرات ·
  بلاگ · درباره ما** — «بلاگ» points at `/guides/`, and «واردات ملوانی» also stays inside the «خدمات» dropdown.
  The former «خدمات گارانتی کالا» (warranty / after-sales) service was removed from the site on request: no page,
  no nav entry, no footer link and no option in the consultation form. The header shows the Tehran landline (`۰۲۱-۹۱۰۰۶۶۶۲`) and, next to it, the mobile
  number (`۰۹۱۷-۲۹۰۰۴۰۹`) with a «همراه» tag; below 1440px the mobile line hides, below 1280px both numbers hide,
  below 1120px the capsule tightens, below 980px the CTA steps aside, and below 860px the mobile menu takes over.
  Office addresses and their own phones live in `offices` in `src/config/site.ts` and are rendered by the footer. Both dropdowns render as a full-bleed **dark mega panel**
  (`Header.astro`): the slab spans the viewport below the header, the links sit on translucent cards with white
  text and each group carries a light “feature” card (`feature` on the group) that breaks out of the dark section.
  Add `icon` to a link to show it in the panel.
- **Support widget**: `src/components/layout/SupportWidget.astro`, rendered on every page by `BaseLayout`. The
  floating button opens a native popover (`popovertarget`, no JS required) listing `companyPhones` from
  `src/config/site.ts`. It lifts itself on the homepage so it never covers the journey's step bar.
- **Homepage tally**: `src/components/ui/Counters.astro` + `src/scripts/counters.ts`. The three numbers are
  server-rendered in their final form and only animated on first view (skipped with reduced motion), so they
  are correct without JavaScript. Pass `approx: true` to print a «+» after a number that is rounded.
- **Clients wall**: `src/components/ui/Clients.astro` + `src/data/clients.ts` + `public/clients/*.png` (the real
  logos, extracted and normalised from the strip the owner supplied). An infinite auto-scrolling marquee that
  is already full on the first paint: two identical rows (each repeating the list, with the gap baked into the row
  width) so shifting the track by -50% is exactly one row. It pauses on hover only for real pointers and slows down —
  never stops — under `prefers-reduced-motion` (its `!important` overrides beat the blanket reset in `global.css`,
  which otherwise freezes every CSS animation at `0.01ms`/one iteration). Logos are sized by height (`2.1rem`, width capped at `9.5rem`) so
  short and wide lockups share one baseline. Pass `title={null} note={false} compact` to use it as a bare strip under
  a lead line — that is how it appears before the closing CTA on the five service pages. **Confirm every brand and
  the right to display its logo before launch.**
- **Sample-content pages**: رزومه، همکاران، خدمات بازرگانی، پروژه‌های خاص، ضمانت and محاسبه قیمت currently hold
  dummy text. Pages listed in `src/data/sample-pages.json` show a «محتوای نمونه» notice in every build, are
  `noindex`, stay out of the sitemap and are listed in a build warning. Replace a page's text (and, for the
  calculator, the rates in `src/data/pricing.ts`), then remove its path from the JSON file to publish it normally.
- **Sailor import page**: `src/pages/sailor-import/` carries the carrier comparison the owner asked for —
  «مزایای حمل ملوانی نسبت به حمل کانتینری» (11 items), «انواع حمل» (دوبه/دوویه، لنج، مسیرها) and «امنیت حمل ملوانی»,
  three contract-backed guarantees. The two maps in `src/components/illustrations/RouteMap.astro` share one
  coastline: `variant="via-khasab"` (the old Dubai → Khasab → Bandar Abbas path) and `variant="direct"`
  (Dubai → Bushehr / Bandar Abbas). **The 15–25 day window and the fixed-price wording are the owner's promises** —
  they are marked REVIEW in the page file; confirm them (and the contract wording) before launch.
- **Terms**: `src/pages/terms/` — the conditions the consent checkbox in the consultation form links to
  (data use, quote validity, site content, responsibility limits). Linked from the footer's legal line.
- **Journey stage labels**: `src/components/journey/stages.ts` (titles only — the bar has no descriptions).
- **Day → night → day**: the scene starts in daylight; as the shipment leaves stage 2 (`skyState()` in
  `timeline.ts`, `NIGHT_FROM`/`NIGHT_TO`) the day sky fades out, the sun sinks behind the skyline, a full moon
  rises and the port cools down under a translucent veil. While the truck rolls up to the customs gate
  (`DAWN_FROM`/`DAWN_TO`) the night clears again, so the journey ends in daylight. The moon is a plain full disc
  with faint maria — deliberately no dark disc crossing it, so it can never read as an eclipse. Sun, moon and stars
  live in view space (no camera or parallax) so they always stay in the sky; the veil sits inside the camera group
  above the scenery but below the truck, barrier and container.
- **Autorun**: the “start”/“stop” button in the hero overlay plays the whole journey once (`AUTO_MS` in
  `journey-client.ts`) and keeps the page's scroll position in step with the timeline, so the scrollbar moves with
  the scene and it ends exactly on the delivered frame — no jump at the end. Wheel, touch and key scrolling, or a
  second click, stop it immediately.

## Shipment-journey animation

Files in `src/components/journey/`:

| File | Role |
| --- | --- |
| `timeline.ts` | Pure `computeFrame(p)` → pose of every moving part for progress `p ∈ [0,1]`. Camera keyframes, stage windows (`seg()` ranges), world coordinates. |
| `JourneyScene.astro` | The SVG world (decorative, `aria-hidden`). Server-renders the frame for `p = 0`, so it is meaningful before/without JS. |
| `journey-client.ts` | Reads native scroll position → progress → applies the frame. Light damping, swell only while on screen. |
| `ShipmentJourney.astro` | The homepage header: a pinned, framed scene (90% of the page width) with a minimal overlay (the H1 and CTA via the `intro` slot, fading out once the journey starts) and a five-step bar. Each step is a plain `<button>` — no card, no popup. |
| `stages.ts` | The five stage titles shown in the bar (keep the count equal to `STAGE_COUNT`). |

How it behaves:

- Progress comes from how far the pinned panel has travelled through its scroll track (pin vs. track; `--hj-scroll` sets the distance). No scroll hijacking; jumping or fast scrolling lands on the correct frame because frames depend only on `p`.
- Clicking a step scrolls the animation to it and does nothing else: nothing opens over the scene, so the frame stays fully visible.
- The client fits the SVG `viewBox` to the frame's shape (`data-base-w`/`data-base-h` on the SVG): the full scene height is always shown, and wider frames reveal more of the harbour to each side.
- One container element is handed from yard → ship → crane → truck; `npm run test:journey` asserts it never teleports.
- `prefers-reduced-motion: reduce`: the scene still follows the scroll position continuously (it never snaps a
  whole stage at a time) and playback still runs when the visitor presses play; only the easing, the ambient swell
  and the wave loop are switched off.
- No JavaScript: nothing is pinned or animated, and the five stage labels stay readable as a plain list.
- **Cost control**: the rAF loop, the ambient swell and the CSS wave drift all stop about
  700 ms after the last scroll/click (playback keeps them alive), so a still scene costs
  nothing. Attribute writes are cached and skipped when the value is unchanged, the layout
  is measured on resize only (no `getBoundingClientRect` per scroll frame), and the HUD bars
  are quantised to 1%.

Section entrances (`.reveal`) use a tiny IntersectionObserver (`src/scripts/reveal.ts`), not CSS
scroll-driven animations (`animation-timeline: view()`): in Chrome those stalled touchpad scrolling for
up to a minute after scrolling past the top/bottom edge, and the production CSS minifier silently dropped
them anyway. Keep it that way.

The hero is pinned for `--hj-scroll` (260svh; a `vh` fallback plus an `@supports` upgrade keeps the track height
correct in browsers without `svh`). To retime a stage, edit the `seg(t, a, b)` windows in `computeFrame`. To move scenery, change `WORLD` in `timeline.ts`
and the matching coordinates in `JourneyScene.astro`, then run `npm run test:journey`.

## Consultation form

`src/components/forms/` — accessible validation (error summary with jump links, inline messages, `aria-invalid`),
Persian/Latin digit normalisation, honeypot. Required: name, **mobile**, service, **stage** (a `<select>`), goods
description, the **packing-list upload** and the consent checkbox at the bottom of the form, which links to the
**قوانین و مقررات** page (`/terms/`). Optional but separate inputs: company, email, **tariff code
(HS)**, origin, port, **volume (m³)**, **weight (kg)**, **dollar value (USD)** and **CBM** — plus a free-text note.
The number fields accept Persian digits and only need to be numeric. The upload accepts PDF, Excel, CSV, Word or a
scanned JPG/PNG up to 10 MB and is checked in the browser before sending. With `PUBLIC_FORM_ENDPOINT` set the form
posts FormData via `fetch` (native multipart POST without JS) and shows success **only on a 2xx response**; errors
keep the entered data. Any service that accepts multipart POST with CORS works (e.g. Formspree, Basin, a Cloudflare
Worker, your own API). Field names: `name`, `company`, `mobile`, `email`, `service`, `stage`, `goods`, `tariff`,
`origin`, `port`, `volume`, `weight`, `value`, `cbm`, `packingList`, `message`, `consent`, `page`.

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

- WhatsApp, Telegram, email and response hours (`site.contact`); the mobile numbers, the Tehran landline and the
  three branch addresses (Tehran, Bushehr, Bandar Abbas) are already filled in via `companyPhones` and `offices`
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
