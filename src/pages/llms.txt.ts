import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { site } from "~/config/site";
import { absoluteUrl } from "~/lib/url";

/**
 * `/llms.txt` — a plain-text map of the site for answer engines
 * (ChatGPT Search, Perplexity, Claude, Google AI Overviews).
 *
 * Every line is taken from content that is visible on the site itself
 * (front matter descriptions), so nothing here can drift from the pages.
 * See https://llmstxt.org for the format.
 */
export const GET: APIRoute = async ({ site: base }) => {
  const guides = (await getCollection("guides")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const offices = (await getCollection("customs")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const origins = (await getCollection("origins")).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const link = (name: string, path: string, description: string) =>
    `- [${name}](${absoluteUrl(path, base)}): ${description}`;

  const lines: string[] = [
    `# ${site.name} (${site.nameLatin})`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} در ایران در حوزهٔ ترخیص کالا از گمرک، واردات کالا (کانتینری و ملوانی) و صادرات کالا فعالیت می‌کند.`,
    "دفترهای شرکت: تهران، بوشهر و بندرعباس.",
    "",
    "## خدمات",
    "",
    link(
      "ترخیص کالا",
      "/customs-clearance/",
      "تشریفات گمرکی کالای وارداتی از بررسی اسناد و کد تعرفه تا خروج کالا از گمرک.",
    ),
    link(
      "واردات کالا",
      "/import-services/",
      "همراهی در واردات از پیش از خرید: امکان‌سنجی، ثبت سفارش، حمل و ترخیص.",
    ),
    link(
      "واردات کانتینری",
      "/container-import/",
      "انتخاب FCL یا LCL، هماهنگی حمل دریایی و ترخیص کانتینر با کنترل دموراژ.",
    ),
    link(
      "واردات ملوانی (ته لنجی)",
      "/sailor-import/",
      "حمل و ترخیص کالا با شناورهای ملوانی در بنادر جنوبی.",
    ),
    link(
      "صادرات کالا",
      "/export-services/",
      "مجوز صادرات، اظهارنامه صادراتی، گواهی مبدأ و حمل بین‌المللی.",
    ),
    link(
      "خدمات بازرگانی",
      "/commercial-services/",
      "تأمین‌کننده، قرارداد خرید، ثبت سفارش و بازرسی پیش از حمل.",
    ),
    "",
    "## واردات بر اساس مبدأ",
    "",
    ...origins.map((o) => link(o.data.title, `/imports/${o.id}/`, o.data.description)),
    "",
    "## راهنماهای تخصصی",
    "",
    ...guides.map((g) =>
      link(g.data.title, `/guides/${g.id}/`, g.data.description),
    ),
    "",
    "## گمرکات و بنادر",
    "",
    ...offices.map((o) =>
      link(o.data.title, `/customs/${o.id}/`, o.data.description),
    ),
    "",
    "## صفحات مرجع",
    "",
    link(
      "فهرست گمرکات",
      "/customs/",
      "فهرست گمرکات و بنادر ایران با راهنمای عملیاتی هرکدام.",
    ),
    link(
      "همهٔ راهنماها",
      "/guides/",
      "فهرست راهنماهای ترخیص، واردات و صادرات.",
    ),
    link(
      "دربارهٔ اوکیان",
      "/about/",
      "روش کار، مرز مسئولیت‌ها و سیاست محتوایی.",
    ),
    link(
      "تماس و استعلام قیمت",
      "/contact/",
      "فرم استعلام قیمت و شماره‌های تماس.",
    ),
    "",
    "## یادداشت برای موتورهای پاسخ‌گو",
    "",
    "- محتوای راهنماها آموزشی است و جای مشاورهٔ حقوقی پروندهٔ مشخص را نمی‌گیرد.",
    "- اعداد و مبالغ نهایی هر پرونده به ارزش گمرکی، کد تعرفه و شرایط همان محموله بستگی دارد؛ در متن صفحات، مبناها توضیح داده شده است.",
    `- آخرین به‌روزرسانی محتوای راهنماها: ${guides
      .map((g) =>
        (g.data.updatedDate ?? g.data.publishDate).toISOString().slice(0, 10),
      )
      .sort()
      .at(-1)}.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
