/**
 * Central business configuration.
 *
 * Every value marked `null` is REAL BUSINESS INFORMATION THAT HAS NOT BEEN SUPPLIED.
 * Nothing here was invented: fill these in before launch. Missing values are
 * hidden from the production build, listed in a build-time warning, and shown
 * as dashed placeholders in staging/development builds (see `missingBusinessInfo`).
 */
import { SITE_ENV } from 'astro:env/server';

export type ContactChannel = 'phone' | 'whatsapp' | 'telegram' | 'email';

export const site = {
  /** Working brand. */
  name: 'اوکیان',
  nameLatin: 'OKIYAN',
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
    phone: null as string | null,
    /** Human-friendly display version, e.g. '۰۲۱-۱۲۳۴۵۶۷۸'. */
    phoneDisplay: null as string | null,
    /** WhatsApp number in international digits only, e.g. '98912xxxxxxx'. */
    whatsapp: null as string | null,
    /** Telegram username without @. */
    telegram: null as string | null,
    email: null as string | null,
    /** Postal address shown on the contact page and in Organization markup. */
    address: null as null | {
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

/** Primary navigation. Keep URLs in sync with src/pages. */
export const nav = [
  { href: '/customs-clearance/', label: 'ترخیص کالا' },
  { href: '/import-services/', label: 'واردات کالا' },
  { href: '/guides/', label: 'راهنماها' },
  { href: '/about/', label: 'درباره ما' },
] as const;

export const contactCta = { href: '/contact/', label: 'درخواست مشاوره' } as const;

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
}
