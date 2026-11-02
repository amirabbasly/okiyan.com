const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert Latin digits in a number or string to Persian digits. */
export function toFa(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

/** Persian digits with the Persian thousands separator: 2000 → «۲٬۰۰۰». */
export function toFaNumber(value: number): string {
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toFa(grouped);
}

const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Format a date in the Solar Hijri calendar with Persian digits. */
export function formatFaDate(date: Date): string {
  return dateFmt.format(date);
}

export function persianYear(date = new Date()): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(date);
}

/** Rough reading time for Persian prose (~200 words/minute). */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
