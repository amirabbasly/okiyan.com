/**
 * Company identity, people and licences — the facts that must never be
 * guessed. Everything on this page is reproduced from the company's own
 * registry extract and licence certificates, supplied by the business.
 *
 * Rules for editing:
 *  - Numbers are stored exactly as they appear on the official document.
 *  - Jalali dates stay Jalali (they are legal dates, not display strings).
 *  - Nothing is added here that the company cannot produce a document for.
 */

export interface Field {
  label: string;
  value: string;
  /** Emphasise the value (name, status). */
  strong?: boolean;
}

/** شناسنامهٔ حقوقی شرکت — اداره ثبت شرکتها */
export const registry: Field[] = [
  { label: 'نام شرکت', value: 'اوژن تجارت کیان', strong: true },
  { label: 'نام تجاری', value: 'اوکیان (OKIYAN)', strong: true },
  { label: 'شناسه ملی', value: '۱۴۰۰۴۰۴۸۴۳۳' },
  { label: 'شمارهٔ ثبت', value: '۴۵۳۹۴۷' },
  { label: 'تاریخ تأسیس', value: '۱۳۹۳/۰۲/۲۰' },
  { label: 'کد اقتصادی', value: '۴۱۱۴۴۸۹۷۷۸۸۷' },
  { label: 'نوع شرکت', value: 'شرکت با مسئولیت محدود' },
  { label: 'منطقهٔ ثبتی', value: 'ادارهٔ ثبت شرکتها و مؤسسات غیرتجاری تهران' },
  { label: 'وضعیت شرکت', value: 'فعال', strong: true },
  { label: 'آخرین سرمایهٔ ثبتی', value: '۲۰۰٬۱۰۰٬۰۰۰٬۰۰۰ ریال' },
  { label: 'آخرین آگهی رسمی', value: '۱۴۰۵/۰۴/۲۳' },
];

/**
 * ستون راه‌های ارتباطی رسمی.
 * شمارهٔ تلفن/فکس ثبت‌شده در سوابق ثبتی، به‌تصریح کارفرما، شمارهٔ فعالی نیست
 * و عمداً منتشر نمی‌شود؛ مسیرهای تماس از سایت، همان دفاتر است.
 */
export const registryContact: Array<{ label: string; value: string; href?: string }> = [
  { label: 'وب‌سایت', value: 'okiyan.com', href: 'https://okiyan.com/' },
];

export interface Person {
  name: string;
  role: string;
}

export interface PeopleGroup {
  id: string;
  title: string;
  note?: string;
  people: Person[];
}

export const people: PeopleGroup[] = [
  {
    id: 'board',
    title: 'هیئت‌مدیره و مدیریت',
    people: [
      { name: 'میلاد عبدالحسین‌زاده', role: 'رئیس هیئت‌مدیره' },
      { name: 'الهام لیواری', role: 'مدیرعامل' },
    ],
  },
  {
    id: 'tehran',
    title: 'دفتر تهران',
    note: 'مدیریت، بازرگانی و پشتیبانی',
    people: [
      { name: 'بابک نصرتی', role: 'مدیر توسعهٔ کسب‌وکار' },
      { name: 'نورا ایلخانی', role: 'کارشناس ارشد توسعهٔ بازار' },
      { name: 'امید اورنگی', role: 'مدیر داخلی' },
      { name: 'علی آقابی', role: 'مهندس نرم‌افزار' },
      { name: 'محمد نوبختی', role: 'سرحسابدار' },
      { name: 'زهرا پیرنیا', role: 'حسابدار' },
      { name: 'هیوا افسری', role: 'کارشناس بازرگانی' },
      { name: 'وحید حسینی', role: 'وکیل' },
      { name: 'حسین اسفندیاری', role: 'تسهیل‌دار' },
    ],
  },
  {
    id: 'bushehr',
    title: 'دفتر بوشهر',
    note: 'عملیات گمرکی و ترخیص',
    people: [
      { name: 'آسیه عبدالحسین‌زاده', role: 'کارشناس بازرگانی' },
      { name: 'محمد عبدالحسین‌زاده', role: 'ترخیص‌کار' },
      { name: 'مهران دهدارباشی', role: 'ترخیص‌کار' },
      { name: 'یوسف زنگنه', role: 'تسهیل‌دار' },
      { name: 'رسول پالیزدان', role: 'کارشناس شبکه' },
      { name: 'مریم دارابی', role: 'منشی' },
    ],
  },
  {
    id: 'bandar-abbas',
    title: 'دفتر بندرعباس',
    note: 'ترخیص کالا در بندر شهید رجایی',
    people: [{ name: 'حمدی عربی', role: 'ترخیص‌کار' }],
  },
];

/**
 * مجوزهای در حال اعتبار.
 *
 * گواهی‌های تشخیص صلاحیت (ساجات) که در ۱۳۹۷ منقضی شده‌اند عمداً ثبت نمی‌شوند:
 * نمایش مدرک منقضی، به‌جای اعتماد، ابهام می‌سازد. اگر روزی تمدید شدند، اینجا
 * اضافه می‌شوند.
 */
export interface Licence {
  id: string;
  /** پروانه کسب / گواهی صلاحیت … */
  kind: string;
  title: string;
  issuer: string;
  from: string;
  to: string;
  /** شناسهٔ پیگیری یا شمارهٔ مدرک */
  reference?: string;
  province?: string;
}

export const licences: Licence[] = [
  {
    id: 'repair',
    kind: 'پروانهٔ کسب',
    title: 'تعمیر انواع دستگاه‌های صنعتی و خانگی',
    issuer: 'دبیرخانهٔ هیئت عالی نظارت بر سازمان‌های صنفی کشور — اتحادیهٔ صنفی',
    from: '۱۴۰۴/۰۸/۰۵',
    to: '۱۴۰۹/۰۸/۰۵',
    reference: '۱۸۶۴۰۹۳۸',
    province: 'تهران',
  },
  {
    id: 'textile',
    kind: 'پروانهٔ کسب',
    title: 'فروش مواد اولیهٔ کالاهای کشباف، گردباف و جوراب',
    issuer: 'دبیرخانهٔ هیئت عالی نظارت بر سازمان‌های صنفی کشور / اتحادیهٔ صنفی',
    from: '۱۴۰۱/۰۹/۲۹',
    to: '۱۴۰۶/۰۹/۲۹',
    reference: '۹۶۹۹۰۷۴',
  },
];

/** علامت تجاری ثبت‌شده */
export const trademark = {
  word: 'OKIYAN',
  owner: 'اوژن تجارت کیان',
  applicationNumber: '۱۳۹۹۵۰۱۴۰۰۰۱۰۳۴۱۴۵',
  registrationNumber: '۳۷۶۶۳۳',
  applicationDate: '۱۳۹۹/۰۴/۰۴',
  classes: '۶، ۷، ۹، ۱۲، ۲۰، ۲۶، ۳۵',
  description: 'درون یک کادر لوزی، کلمهٔ OKIYAN به لاتین قرار دارد.',
  classes_notes: [
    'طبقهٔ ۶ — فلزات معمولی و آلیاژها، مواد ساختمانی فلزی، لوله و تیوب فلزی، آهن‌آلات.',
    'طبقهٔ ۷ — ماشین‌ها و ماشین‌آلات، ابزار ماشین، موتورها، قطعات انتقال نیرو، ابزار کشاورزی.',
    'طبقهٔ ۹ — تجهیزات علمی، اندازه‌گیری، الکتریکی، نوری، ضبط و انتقال صوت و تصویر.',
    'طبقهٔ ۱۲ — خودروها و وسایط نقلیه، دستگاه‌های حمل زمینی، هوایی و آبی.',
    'طبقهٔ ۲۰ — مبلمان، آینه، قاب عکس و کالاهای ساخته‌شده از چوب، پلاستیک و مواد مشابه.',
    'طبقهٔ ۲۶ — پارچهٔ توری و گلدوزی، روبان، قیطان، دکمه، سوزن و گل مصنوعی.',
    'طبقهٔ ۳۵ — تبلیغات، مدیریت کسب‌وکار، مدیریت بازرگانی و امور دفتری.',
  ],
};
