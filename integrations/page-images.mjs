/**
 * Which editorial photograph belongs to which URL, for the sitemap.
 *
 * Search engines treat an image listed in the sitemap as a first-class asset of
 * that page: it is eligible for Google Images without waiting to be crawled as
 * a link somewhere in the HTML. Only pages that really show the photo are
 * listed — declaring an image a page does not contain is a fast way to lose
 * trust in the whole sitemap.
 *
 * @type {Record<string, { file: string; title: string; caption: string; geo?: string }[]>}
 */
export const pageImages = {
  "/": [
    {
      file: "/img/port-cranes.jpg",
      title: "بندر کانتینری اوکیان در ساعت آبی",
      caption: "ترخیص کالا و واردات از بنادر جنوبی ایران",
    },
  ],
  "/about/": [
    {
      file: "/img/office-tehran.jpg",
      title: "دفتر اوکیان در تهران",
      caption: "دفتر مرکزی شرکت اوژن تجارت کیان (اوکیان)",
      geo: "تهران، ایران",
    },
  ],
  "/import-services/": [
    {
      file: "/img/port-cranes.jpg",
      title: "بندر کانتینری، مسیر ورود کالا",
      caption: "همراهی واردات کالا از برنامه‌ریزی خرید تا تحویل",
    },
  ],
  "/sailor-import/": [
    {
      file: "/img/lenj-bushehr.jpg",
      title: "لنج‌های باری سنتی در بندر بوشهر",
      caption: "رویهٔ واردات ملوانی (ته لنجی) از دبی به بنادر جنوبی",
      geo: "بوشهر، ایران",
    },
  ],
  "/sailor-import/bushehr/": [
    {
      file: "/img/lenj-bushehr.jpg",
      title: "تخلیهٔ بار لنج در بندر بوشهر",
      caption: "واردات ملوانی از دبی به گمرک بوشهر",
      geo: "بوشهر، ایران",
    },
  ],
  "/sailor-import/bandar-abbas/": [
    {
      file: "/img/container-yard.jpg",
      title: "محوطهٔ کانتینری بندرعباس",
      caption: "مسیر ملوانی و کانتینری بندرعباس",
      geo: "بندرعباس، ایران",
    },
  ],
  "/container-import/": [
    {
      file: "/img/container-yard.jpg",
      title: "محوطهٔ انبار کانتینر در بندر",
      caption: "واردات کانتینری FCL و LCL",
    },
  ],
  "/customs-clearance/": [
    {
      file: "/img/customs-desk.jpg",
      title: "اسناد ترخیص روی میز کارشناس گمرک",
      caption: "کنترل اسناد پیش از اظهار گمرکی",
    },
  ],
  "/customs-clearance/cost/": [
    {
      file: "/img/warehouse.jpg",
      title: "انبار کالا و هزینهٔ روزهای توقف",
      caption: "هزینهٔ انبارداری، یکی از اقلام صورتحساب ترخیص",
    },
  ],
  "/customs-clearance/required-documents/": [
    {
      file: "/img/customs-desk.jpg",
      title: "مدارک لازم برای ترخیص کالا",
      caption: "سیاههٔ خرید، بارنامه، گواهی مبدأ و مجوزها",
    },
  ],
  "/export-services/": [
    {
      file: "/img/export-truck.jpg",
      title: "کامیون‌های باری در گذرگاه مرزی",
      caption: "صادرات زمینی و اسناد حمل جاده‌ای",
    },
  ],
  "/special-projects/": [
    {
      file: "/img/heavy-cargo.jpg",
      title: "جابه‌جایی محمولهٔ فوق‌سنگین با جرثقیل",
      caption: "پروژه‌های خاص و حمل محموله‌های سنگین",
    },
  ],
  "/guides/": [
    {
      file: "/img/guides-desk.jpg",
      title: "میز مطالعهٔ راهنماهای اوکیان",
      caption: "راهنماهای ترخیص، واردات و گمرک",
    },
  ],
};
