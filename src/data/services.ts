/**
 * Service definitions shared by the homepage and the service pages.
 *
 * REVIEW BEFORE LAUNCH: the scope and exclusions below describe a typical
 * customs-clearance / import-coordination offer. The business owner must
 * confirm each item (then set `site.scopeConfirmed = true`).
 */
export const services = {
  clearance: {
    href: '/customs-clearance/',
    name: 'ترخیص کالا',
    question: 'کالای شما در راه است یا به گمرک رسیده؟',
    summary:
      'تنظیم و پیگیری تشریفات گمرکی کالای وارداتی: از بررسی اسناد و کد تعرفه تا ثبت اظهارنامه، همراهی در ارزیابی و خروج کالا از گمرک.',
    includes: ['بررسی اسناد و تطبیق کد تعرفه', 'برآورد مکتوب هزینه‌های ترخیص', 'تنظیم و ثبت اظهارنامه و پیگیری ارزیابی', 'پیگیری مجوزها، پرداخت‌ها و خروج کالا'],
    fit: 'مناسب صاحبان کالایی که خرید را انجام داده‌اند و برای خروج کالا از گمرک به همراهی تخصصی نیاز دارند.',
  },
  import: {
    href: '/import-services/',
    name: 'واردات کالا',
    question: 'هنوز در مرحلهٔ برنامه‌ریزی خرید هستید؟',
    summary:
      'همراهی در واردات از پیش از خرید: امکان‌سنجی کالا، بررسی الزامات و هزینه‌ها، هماهنگی اسناد با تأمین‌کننده، حمل و در نهایت ترخیص.',
    includes: ['امکان‌سنجی واردات و بررسی الزامات کالا', 'برآورد هزینهٔ تمام‌شدهٔ تقریبی', 'هماهنگی اسناد با تأمین‌کننده و حمل‌کننده', 'اتصال مسیر حمل به ترخیص و تحویل'],
    fit: 'مناسب شرکت‌ها و بازرگانانی که پیش از سفارش می‌خواهند بدانند واردات یک کالا چه الزامات و هزینه‌هایی دارد.',
  },
} as const;
