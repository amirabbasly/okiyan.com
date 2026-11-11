# راهنمای گوگل سرچ کنسول برای okiyan.com

این فایل دستور کار کامل است: از ثبت دامنه تا سابمیت سایت‌مپ، درخواست ایندکس و گزارش‌های ماهانه.
هر جایی که به کد این سایت وصل می‌شود، مسیر فایل هم نوشته شده تا لازم نباشد چیزی از حافظه بازسازی شود.

---

## ۰) آنچه از قبل در سایت آماده است

| مورد | وضعیت | محل |
|---|---|---|
| `robots.txt` با `Allow: /` و آدرس سایت‌مپ | آماده | `src/pages/robots.txt.ts` |
| سایت‌مپ (`sitemap-index.xml` + ۴۴ URL) | آماده | `@astrojs/sitemap` در `astro.config.mjs` |
| نقشهٔ سایت برای موتورهای پاسخ (`llms.txt`) | آماده | `src/pages/llms.txt.ts` |
| داده‌ساختاری Organization / WebSite / Service / Article / FAQPage / BreadcrumbList | آماده | `src/lib/schema.ts` |
| تگ تأیید گوگل (اختیاری) | آماده، فقط توکن لازم است | `GOOGLE_VERIFICATION_TOKEN` → `BaseHead.astro` |
| `hreflang="fa-IR"` + `x-default` روی هر صفحه | آماده | `src/components/seo/BaseHead.astro` |
| پیش‌بارگذاری تصویر LCP هیرو (`fetchpriority=high`) | آماده | `HeroSlider.astro` |
| خطای ۴۰۴ بدون ایندکس، hosts یکسان (`okiyan.com`) | آماده | `src/pages/404.astro`، `scripts/check-hosts.mjs` |
| ارسال خودکار به IndexNow (بینگ و موتورهای پاسخ) | آماده | `npm run seo:indexnow` |

تنها چیزی که از بیرون لازم است: دسترسی به DNS دامنه و یک حساب گوگل.

---

## ۱) ثبت دامنه در سرچ کنسول

1. برو به <https://search.google.com/search-console> و با همان حساب گوگلی وارد شو که بعداً می‌خواهی گزارش‌ها را در آن ببینی.
2. **Add property** → **Domain** را انتخاب کن (نه URL prefix). نوع Domain همهٔ حالت‌ها را یک‌جا می‌گیرد: `http`، `https`، `www` و `okiyan.ir`؛ پس اگر روزی ریدایرکت عوض شد، داده‌ات گم نمی‌شود.
3. مقدار دامنه را بدون `https://` و بدون اسلش انتهایی وارد کن: `okiyan.com`.
4. گوگل یک رکورد TXT مثل `google-site-verification=xxxxxxxx` می‌دهد. آن را در پنل DNS دامنه (ثبت‌کننده یا Cloudflare) به‌عنوان یک رکورد TXT روی `@` اضافه کن و **Verify** بزن.
   - اگر DNS روی Cloudflare است، رکورد را «DNS only» بگذار و پروکسی را روشن نکن.
   - انتشار DNS از چند دقیقه تا چند ساعت طول می‌کشد؛ رکورد را بعد از تأیید هم حذف نکن.

### روش جایگزین بدون دسترسی به DNS

اگر DNS در اختیار تو نیست، از نوع **URL prefix** با `https://okiyan.com/` استفاده کن و تگ متا را با توکن گوگل بساز:

```bash
GOOGLE_VERIFICATION_TOKEN=xxxxxxxxxxxxxxxxxxxx SITE_URL=https://okiyan.com npm run build:prod
sudo rsync -a --delete dist/ /var/www/okiyan.com/html/
```

`BaseHead.astro` تگ `<meta name="google-site-verification">` را فقط وقتی توکن خالی نباشد می‌نویسد، پس بیلد بدون توکن دست‌نخورده می‌ماند. (برای بینگ همین کار با `BING_VERIFICATION_TOKEN` و تگ `msvalidate.01`.)

---

## ۲) سابمیت سایت‌مپ

1. در سرچ کنسول: **Indexing → Sitemaps**.
2. در فیلد «Add a new sitemap» فقط این را وارد کن: `sitemap-index.xml` (بدون دامنه؛ گوگل خودش کاملش می‌کند).
3. **Submit**. وضعیت باید بعد از چند ساعت **Success** شود و تعداد URLs کشف‌شده ۴۴ باشد.
4. اگر عدد کمتر بود، اول `npm run verify` را روی همان بیلد اجرا کن؛ این اسکریپت روی canonical، noindex و وجود همهٔ صفحات در سایت‌مپ خطا می‌دهد.

قبل از سابمیت، این سه دستور را یک بار بزن تا مطمئن شوی سرور همان چیزی را می‌دهد که بیلد ساخته:

```bash
curl -s https://okiyan.com/robots.txt | head -5        # باید با «# okiyan.com» شروع شود
curl -s https://okiyan.com/ | grep -o '<link rel="canonical"[^>]*>'
curl -sI https://okiyan.com/sitemap-index.xml | head -3
```

اگر `robots.txt` با متن «As a condition of accessing this website…» شروع شد، Cloudflare دارد فایل ما را بازنویسی می‌کند: در پنل زون `okiyan.com` → **Security → Bots → AI Crawl Control / Managed robots.txt** را خاموش کن (جزئیات در `deploy/README.md`).

---

## ۳) درخواست ایندکس برای صفحات کلیدی

**URL Inspection** → آدرس را بچسبان → **Request indexing**. این کار صف ایندکس را جلو می‌اندازد؛ سهمیهٔ روزانه محدود است، پس فقط این‌ها را بفرست:

| اولویت | آدرس | چرا |
|---|---|---|
| ۱ | `https://okiyan.com/` | صفحهٔ اصلی، FAQPage و WebSite دارد |
| ۲ | `https://okiyan.com/guides/` | هاب بلاگ و فیلترهایش |
| ۳ | `https://okiyan.com/guides/customs-clearance-guide/` | پرسش پرجست‌وجوی «ترخیص کالا چیست» |
| ۴ | `https://okiyan.com/customs-clearance/` | صفحهٔ خدمت اصلی |
| ۵ | `https://okiyan.com/sailor-import/` | تمایز اصلی برند (واردات ملوانی) |
| ۶ | `https://okiyan.com/about/` | اعتماد و هویت حقوقی |

بعد از هر دیپلوی، همین مسیر را برای هر URL تازه تکرار کن.

---

## ۴) کارهایی که فقط یک بار باید انجام شود

| کار | مسیر در سرچ کنسول | نتیجهٔ مورد انتظار |
|---|---|---|
| فعال‌کردن ایمیل هشدار | Settings → Users and permissions / Preferences | هشدار خطا و افت ایندکس به ایمیل برسد |
| بررسی صفحهٔ ۴۰۴ | URL Inspection روی یک آدرس ناموجود | `Not indexed` و کد ۴۰۴ |
| بازبینی داده‌ساختاری | Enhancements → Breadcrumbs / FAQ | بدون خطای «Invalid» |
| اتصال به GA4 (اگر نصب شد) | Admin → Product links → Search Console | کوئری‌ها داخل GA4 دیده شود |
| ثبت سایت در Bing Webmaster | <https://www.bing.com/webmasters> | چون Bing پاسخ‌های ChatGPT را تأمین می‌کند |

---

## ۵) روتین هفتگی (۲۰ دقیقه)

1. **Performance**: ۲۸ روز اخیر را با دورهٔ قبل مقایسه کن؛ کوئری‌های برند («اوکیان»، «okiyan») را فیلتر کن تا تصویر واقعی جست‌وجوی غیربرند دیده شود.
2. **Pages (Indexing)**: تعداد ایندکس‌شده‌ها، دلایل Excluded و اینکه هیچ صفحهٔ مهمی در Excluded نباشد.
3. **Sitemaps**: وضعیت Success و تعداد کشف‌شده.
4. **Core Web Vitals**: گروه URL جدید با وضعیت Poor؟

## ۶) روتین ماهانه

1. **Core Web Vitals**: LCP زیر ۲٫۵ ثانیه، INP زیر ۲۰۰ میلی‌ثانیه، CLS زیر ۰٫۱.
2. **Manual actions و Security issues**: باید هر دو خالی باشند؛ اگر نه، اولویت اول همان است.
3. **Links**: دامنه‌های ارجاع‌دهندهٔ تازه و لینک‌های شکسته.
4. **Search Console Insights** برای صفحه‌هایی که در ۲۸ روز گذشته افت داشته‌اند.

---

## ۷) نکته‌هایی که به این سایت مربوط است

- **بلاگ همان `/guides/` است.** گوگل آن را به‌عنوان هاب می‌شناسد و `ItemList` دارد؛ صفحهٔ جدا برای بلاگ نساز و محتوا را به دو مسیر نشکن.
- **`lastmod` سایت‌مپ فقط برای راهنماها واقعی است.** برای بقیه نوشته نمی‌شود تا گوگل به تاریخ‌های ساختگی اعتماد نکند.
- **`okiyan.ir` نباید ۲۰۰ بدهد.** اگر ریدایرکت ۳۰۱ به `okiyan.com` نباشد، گوگل دو نسخه از سایت می‌بیند و سیگنال‌ها نصف می‌شود. آزمون: `npm run seo:hosts`.
- **هیچ عدد یا مجوزی در داده‌ساختاری نیست که روی صفحه دیده نشود.** هر ادعای تازه اول باید در صفحه نوشته شود، بعد به schema برود.
- **Cloudflare را روی «Block AI bots» نگذار.** `robots.txt` عمداً GPTBot، OAI-SearchBot، ClaudeBot، PerplexityBot و Google-Extended را مجاز می‌کند؛ مسدودکردنشان سایت را از پاسخ‌های هوش مصنوعی حذف می‌کند.

---

## ۸) پس از پایان، این‌ها را چک کن

- [ ] ملک Domain تأیید شده و در لیست سرچ کنسول با تیک سبز نشسته است.
- [ ] `sitemap-index.xml` در وضعیت Success و با ۴۴ URL.
- [ ] شش URL بخش ۳ درخواست ایندکس شده‌اند.
- [ ] هیچ صفحه‌ای در گزارش Pages با وضعیت «Excluded by noindex» نیست جز صفحهٔ ۴۰۴ و صفحات نمونه.
- [ ] `curl -s https://okiyan.com/robots.txt` فایل خودمان را برمی‌گرداند.
- [ ] Bing Webmaster ثبت شده و همان سایت‌مپ را گرفته است.
