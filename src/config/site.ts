/**
 * Central business configuration.
 *
 * Every value marked `null` is REAL BUSINESS INFORMATION THAT HAS NOT BEEN SUPPLIED.
 * Nothing here was invented: fill these in before launch. Missing values are
 * hidden from the production build, listed in a build-time warning, and shown
 * as dashed placeholders in staging/development builds (see `missingBusinessInfo`).
 */
import { SITE_ENV } from 'astro:env/server';
import { samplePages } from '~/lib/sample';

export type ContactChannel = 'phone' | 'whatsapp' | 'telegram' | 'email';

export interface CompanyPhone {
  kind: 'mobile' | 'landline';
  /** E.164 format for the `tel:` link. */
  e164: string;
  /** Human-friendly display version with Persian digits. */
  display: string;
}

/**
 * Numbers the support widget and the contact page list.
 * Supplied by the business owner (see the SupportWidget + /contact/).
 */
export const companyPhones: CompanyPhone[] = [
  { kind: 'mobile', e164: '+989172900409', display: '۰۹۱۷-۲۹۰۰۴۰۹' },
  { kind: 'mobile', e164: '+989172900410', display: '۰۹۱۷-۲۹۰۰۴۱۰' },
  { kind: 'mobile', e164: '+989172900411', display: '۰۹۱۷-۲۹۰۰۴۱۱' },
  { kind: 'landline', e164: '+982191006662', display: '۰۲۱-۹۱۰۰۶۶۶۲' },
];

export interface Office {
  /** City / office name, shown as the heading. */
  city: string;
  /** Street address without the city name (the heading already carries it). */
  address: string;
  /** Direct lines for this office, when supplied. */
  phones?: CompanyPhone[];
}

/** Branches printed in the footer, in the order supplied by the business. */
export const offices: Office[] = [
  {
    city: 'تهران',
    address: 'نیاوران، جماران، نبش کوچهٔ دوم، پلاک ۵، واحد ۵',
    phones: [
      { kind: 'landline', e164: '+982191006662', display: '۰۲۱-۹۱۰۰۶۶۶۲' },
      { kind: 'mobile', e164: '+989172900409', display: '۰۹۱۷-۲۹۰۰۴۰۹' },
    ],
  },
  {
    city: 'بوشهر',
    address: 'خیابان گمرک، روبه‌روی درب بزرگ گمرک، ساختمان بوشهر تجارت (جمی)، طبقهٔ ۴، واحد ۱۲',
    phones: [{ kind: 'landline', e164: '+987791009009', display: '۰۷۷-۹۱۰۰۹۰۰۹' }],
  },
  { city: 'بندرعباس', address: 'میدان یادبود، برج ارم، طبقهٔ ۴، واحد ۴۰۹' },
];

export const site = {
  /** Working brand. */
  name: 'اوکیان',
  nameLatin: 'OKIYAN',
  /** Latin wordmark as it appears in the logo. */
  wordmarkLatin: 'OKIYAN.IR',
  /** Short descriptor used in titles and Organization markup. */
  tagline: 'ترخیص کالا و خدمات واردات',
  description:
    'اوکیان در ترخیص کالا از گمرکات ایران و هماهنگی مراحل واردات کالا، از بررسی اسناد پیش از حمل تا تحویل، همراه بازرگانان و شرکت‌هاست.',

  /**
   * Canonical origin comes from SITE_URL (see astro.config.mjs → `site`).
   * Read it in components via `Astro.site`, never hard-code it.
   */

  locale: 'fa_IR',
  language: 'fa',

  contact: {
    /** E.164 format, e.g. '+98912xxxxxxx'. */
    phone: '+982191006662' as string | null,
    /** Human-friendly display version, e.g. '۰۲۱-۱۲۳۴۵۶۷۸'. */
    phoneDisplay: '۰۲۱-۹۱۰۰۶۶۶۲' as string | null,
    /** Every published number (mobile lines + office landline). */
    phones: companyPhones,
    /** Branches shown in the footer and on the contact page. */
    offices,
    /** WhatsApp number in international digits only, e.g. '98912xxxxxxx'. */
    whatsapp: null as string | null,
    /** Telegram username without @. */
    telegram: null as string | null,
    email: null as string | null,
    /** Postal address shown on the contact page and in Organization markup. */
    address: {
      streetAddress: 'نیاوران، جماران، نبش کوچهٔ دوم، پلاک ۵، واحد ۵',
      addressLocality: 'تهران',
      addressRegion: 'تهران',
    } as null | {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode?: string;
    },
    /** e.g. 'شنبه تا چهارشنبه، ۹ تا ۱۷' */
    hours: null as string | null,
  },

  social: {
    instagram: null as string | null,
    linkedin: null as string | null,
    telegramChannel: null as string | null,
  },

  /** Verifiable company facts. Leave null until confirmed with documents. */
  company: {
    legalName: null as string | null,
    foundingYear: null as number | null,
    /** Customs broker licence (پروانه حق‌العمل‌کاری) or other registrations. */
    licences: [] as Array<{ title: string; number: string; issuer: string }>,
  },

  /** Ports/customs offices the business actually serves. Empty = not confirmed. */
  serviceAreas: [] as string[],

  /** Which service scope items have been confirmed by the business owner. */
  scopeConfirmed: false,
} as const;

export const SITE_ENVIRONMENT = SITE_ENV;
export const isProduction = SITE_ENV === 'production';

export interface NavLink {
  href: string;
  label: string;
  /** One short line shown under the link in the header dropdowns. */
  hint?: string;
  /** Icon shown in the mega menu (a subset of src/components/ui/Icon.astro). */
  icon?: NavIcon;
}
/** Icon names used by the navigation — must exist in src/components/ui/Icon.astro. */
export type NavIcon = 'stamp' | 'route' | 'ship' | 'globe' | 'shield' | 'briefcase' | 'cube' | 'headset';
/** The highlight card shown beside the links in the dark mega menu. */
export interface NavFeature {
  title: string;
  text: string;
  href: string;
  ctaLabel: string;
}
export interface NavGroup {
  label: string;
  feature?: NavFeature;
  children: NavLink[];
}
export type NavItem = NavLink | NavGroup;
export const isNavGroup = (item: NavItem): item is NavGroup => 'children' in item;

/** Primary navigation (header, mobile menu, footer). Keep URLs in sync with src/pages. */
export const nav: NavItem[] = [
  {
    label: 'خدمات',
    feature: {
      title: 'کدام خدمت به کار شما می‌آید؟',
      text: 'مشخصات کالا و مرحلهٔ محموله را بفرستید تا مسیر درست، مدارک لازم و هزینه‌های قابل انتظار را مشخص کنیم.',
      href: '/contact/',
      ctaLabel: 'درخواست مشاوره',
    },
    children: [
      { href: '/customs-clearance/', label: 'ترخیص کالا', hint: 'از بررسی اسناد تا خروج کالا از گمرک', icon: 'stamp' },
      { href: '/container-import/', label: 'واردات کانتینری', hint: 'FCL و LCL، ترخیص کانتینر و حمل تا انبار', icon: 'cube' },
      { href: '/import-services/', label: 'واردات کالا', hint: 'همراهی از برنامه‌ریزی خرید تا تحویل', icon: 'route' },
      { href: '/sailor-import/', label: 'واردات ملوانی', hint: 'ورود کالا با شناورهای ملوانی در بنادر جنوبی', icon: 'ship' },
      { href: '/export-services/', label: 'صادرات کالا', hint: 'از مجوز و گواهی مبدأ تا بارنامه و تحویل', icon: 'globe' },
    ],
  },
  { href: '/sailor-import/', label: 'واردات ملوانی' },
  { href: '/customs-clearance/', label: 'ترخیص' },
  { href: '/container-import/', label: 'واردات کانتینری' },
  { href: '/export-services/', label: 'صادرات' },
  { href: '/guides/', label: 'بلاگ' },
  {
    label: 'درباره ما',
    feature: {
      title: 'اوکیان را از نزدیک بشناسید',
      text: 'روش کار، سوابق و تعهدهای ما؛ و اینکه در هر مرحله چه چیزی بر عهدهٔ ما و چه چیزی با گمرک است.',
      href: '/about/',
      ctaLabel: 'دربارهٔ اوکیان',
    },
    children: [
      { href: '/about/', label: 'دربارهٔ اوکیان', hint: 'روش کار و مرز مسئولیت‌ها' },
      { href: '/resume/', label: 'رزومه', hint: 'سوابق و پرونده‌های منتخب' },
      { href: '/partners/', label: 'همکاران', hint: 'شرکت‌هایی که با آن‌ها کار می‌کنیم' },
      { href: '/guarantee/', label: 'ضمانت', hint: 'تعهدهای ما و شرایط آن‌ها' },
    ],
  },
];

export const contactCta = { href: '/contact/', label: 'استعلام قیمت' } as const;

/** Build a list of business details that still need real values. */
export function missingBusinessInfo(): string[] {
  const missing: string[] = [];
  const c = site.contact;
  if (!c.phone) missing.push('شماره تلفن (contact.phone)');
  if (!c.whatsapp) missing.push('واتس‌اپ (contact.whatsapp)');
  if (!c.telegram) missing.push('تلگرام (contact.telegram)');
  if (!c.email) missing.push('ایمیل (contact.email)');
  if (!c.address) missing.push('نشانی دفتر (contact.address)');
  if (!c.hours) missing.push('ساعات پاسخ‌گویی (contact.hours)');
  if (!site.company.legalName) missing.push('نام حقوقی شرکت (company.legalName)');
  if (site.company.licences.length === 0) missing.push('مجوزها و پروانه‌ها (company.licences)');
  if (site.serviceAreas.length === 0) missing.push('گمرکات و بنادر تحت پوشش (serviceAreas)');
  if (!site.scopeConfirmed) missing.push('تأیید دامنه خدمات (scopeConfirmed)');
  return missing;
}

/** Office address as one line, e.g. «تهران، جماران، …». Null when not configured. */
export function formattedAddress(): string | null {
  const a = site.contact.address;
  return a ? `${a.addressLocality}، ${a.streetAddress}` : null;
}

export interface ChannelLink {
  channel: ContactChannel;
  label: string;
  value: string;
  href: string;
}

/** Only channels that are actually configured become links. */
export function contactChannels(): ChannelLink[] {
  const c = site.contact;
  const out: ChannelLink[] = [];
  if (c.phone) out.push({ channel: 'phone', label: 'تماس تلفنی', value: c.phoneDisplay ?? c.phone, href: `tel:${c.phone}` });
  if (c.whatsapp) out.push({ channel: 'whatsapp', label: 'واتس‌اپ', value: 'گفت‌وگو در واتس‌اپ', href: `https://wa.me/${c.whatsapp}` });
  if (c.telegram) out.push({ channel: 'telegram', label: 'تلگرام', value: `@${c.telegram}`, href: `https://t.me/${c.telegram}` });
  if (c.email) out.push({ channel: 'email', label: 'ایمیل', value: c.email, href: `mailto:${c.email}` });
  return out;
}

export function socialLinks(): Array<{ label: string; href: string }> {
  const s = site.social;
  return [
    s.instagram && { label: 'اینستاگرام', href: s.instagram },
    s.linkedin && { label: 'لینکدین', href: s.linkedin },
    s.telegramChannel && { label: 'کانال تلگرام', href: s.telegramChannel },
  ].filter(Boolean) as Array<{ label: string; href: string }>;
}

let warned = false;
/** Logs missing business details once per build so they cannot be overlooked. */
export function warnMissingOnce() {
  if (warned || !import.meta.env.SSR) return;
  warned = true;
  const missing = missingBusinessInfo();
  if (missing.length) {
    const list = missing.map((m) => `  - ${m}`).join('\n');
    console.warn(`\n[okiyan] Missing business information (${missing.length}):\n${list}\n  Edit src/config/site.ts before launch.\n`);
  }
  if (samplePages.length) {
    const list = samplePages.map((p) => `  - ${p}`).join('\n');
    console.warn(
      `[okiyan] Pages with sample content (${samplePages.length}, noindex + labelled):\n${list}\n  Replace the text, then remove the path from src/data/sample-pages.json.\n`,
    );
  }
}
