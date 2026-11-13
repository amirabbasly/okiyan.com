/**
 * Cost model for /price-calculator/.
 *
 * No rate lives in this file, on purpose.
 *
 * Three numbers decide an import file's cost and none of them is ours to publish:
 * - the duty rate (ماخذ حقوق ورودی) of a national tariff line — set every year in
 *   the book of export–import regulations;
 * - the VAT & duties rate — set by that year's budget law;
 * - the customs exchange rate — announced by the Central Bank and applied on the
 *   day of declaration (Article 14 of the Customs Act).
 *
 * A default here would silently put a stale number into a real estimate, so every
 * rate is an input the visitor supplies, and the *formula* of each line is printed
 * on the page instead. Until the rates are entered the panel shows formulas, not
 * dashes and not figures.
 */

export interface EstimateInput {
  /** Invoice value of the goods (FOB), in the selected currency. */
  value: number;
  /** Freight + insurance to the first point of entry, in the same currency. */
  freight: number;
  /** Customs exchange rate: Toman per unit of that currency. */
  rate: number;
  /** Duty rate (ماخذ حقوق ورودی) of the tariff line, in percent. */
  duty: number;
  /** VAT & duties rate of the current year, in percent, on customs value + duty. */
  vat: number;
  /** Port, storage and handling costs in Toman. Optional. */
  port?: number;
  /** Service fee in Toman. Optional — left out of the total when not entered. */
  fee?: number;
}

export interface Estimate {
  customsValue: number;
  duty: number;
  vat: number;
  port: number;
  fee: number;
  total: number;
}

/** Currencies the invoice may be denominated in. */
export const currencies = [
  { code: 'USD', label: 'دلار آمریکا' },
  { code: 'EUR', label: 'یورو' },
  { code: 'AED', label: 'درهم امارات' },
  { code: 'CNY', label: 'یوآن چین' },
  { code: 'INR', label: 'روپیه هند' },
  { code: 'TRY', label: 'لیره ترکیه' },
] as const;

/**
 * The five cost lines, with the formula each one follows. Rendered as text before
 * the visitor enters any rate, so the page explains the calculation even when the
 * fields are empty — and so search engines and answer engines can read it.
 */
export const formulae = [
  {
    key: 'customsValue',
    label: 'ارزش گمرکی کالا (CIF)',
    formula: '(ارزش کالا + حمل و بیمه) × نرخ ارز',
    note: 'مبنای محاسبهٔ همهٔ اقلام بعدی؛ مادهٔ ۱۴ قانون امور گمرکی',
    required: true,
  },
  {
    key: 'duty',
    label: 'حقوق ورودی',
    formula: 'ارزش گمرکی × ماخذ حقوق ورودی',
    note: 'ماخذ هر کد ملی، در کتاب مقررات صادرات و واردات همان سال',
    required: true,
  },
  {
    key: 'vat',
    label: 'مالیات و عوارض ارزش افزوده',
    formula: '(ارزش گمرکی + حقوق ورودی) × نرخ ارزش افزوده',
    note: 'نرخ مصوب سال جاری، در قانون بودجهٔ همان سال',
    required: true,
  },
  {
    key: 'port',
    label: 'هزینه‌های بندری و انبارداری',
    formula: 'مبلغ اعلامی ترمینال، انبار و قبض‌ها',
    note: 'اختیاری — روزشمار است و با طولانی شدن ترخیص بزرگ می‌شود',
    required: false,
  },
  {
    key: 'fee',
    label: 'کارمزد خدمات ترخیص',
    formula: 'مبلغ توافق‌شده در قرارداد خدمات',
    note: 'اختیاری — اگر وارد نکنید، در جمع لحاظ نمی‌شود',
    required: false,
  },
] as const;

export type FormulaKey = (typeof formulae)[number]['key'];

/**
 * Cost items the calculator deliberately does NOT cover, because they are file-
 * specific and cannot be estimated from a value and two rates.
 */
export const excluded = [
  'هزینهٔ استاندارد، نمونه‌برداری و آزمون آزمایشگاهی',
  'هزینهٔ بازرسی پیش از حمل در مبدأ',
  'دموراژ و هزینهٔ توقف کانتینر',
  'حمل داخلی از گمرک تا انبار',
  'بیمهٔ حمل بین‌المللی و بیمهٔ داخلی',
  'هزینه‌های بانکی و کارمزد انتقال ارز',
  'حق‌العمل‌کاری و هزینه‌های اداری پرونده',
  'هزینهٔ اخذ یا تمدید مجوزهای دستگاهی',
] as const;

/** All amounts in Toman. Shared by the page and the browser script. */
export function estimate(input: EstimateInput): Estimate {
  const customsValue = (input.value + input.freight) * input.rate;
  const duty = (customsValue * input.duty) / 100;
  const vat = ((customsValue + duty) * input.vat) / 100;
  const port = input.port ?? 0;
  const fee = input.fee ?? 0;
  return { customsValue, duty, vat, port, fee, total: duty + vat + port + fee };
}
