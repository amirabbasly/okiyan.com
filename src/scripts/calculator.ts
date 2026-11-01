/**
 * Live price estimate for /price-calculator/. Recomputes on every input with the
 * shared `estimate()` (src/data/pricing.ts), so the server-rendered numbers and the
 * browser numbers always come from the same formula.
 * Accepts Persian/Arabic digits and thousands separators; reformats on blur.
 */
import { estimate, type Estimate } from '~/data/pricing';

const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

function parse(raw: string): number | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)))
    .replace(/[٬,\s]/g, '')
    .replace(/[٫]/g, '.');
  if (latin === '') return null;
  const n = Number(latin);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const money = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });
const plain = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

export function initCalculator(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-calc-form]');
  const error = root.querySelector<HTMLElement>('[data-calc-error]');
  if (!form) return;
  const fields = ['value', 'freight', 'rate', 'duty'] as const;
  const inputs = Object.fromEntries(fields.map((f) => [f, form.elements.namedItem(f) as HTMLInputElement])) as Record<
    (typeof fields)[number],
    HTMLInputElement
  >;
  const outs = Array.from(root.querySelectorAll<HTMLOutputElement>('[data-out]'));

  function update() {
    const values: Partial<Record<(typeof fields)[number], number>> = {};
    let ok = true;
    for (const f of fields) {
      const v = parse(inputs[f].value);
      inputs[f].setAttribute('aria-invalid', String(v === null));
      if (v === null) ok = false;
      else values[f] = v;
    }
    if (error) error.hidden = ok;
    if (!ok) {
      outs.forEach((o) => (o.value = '—'));
      return;
    }
    const result = estimate(values as Record<(typeof fields)[number], number>);
    for (const o of outs) o.value = money.format(Math.round(result[o.dataset.out as keyof Estimate]));
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  for (const f of fields) {
    inputs[f].addEventListener('blur', () => {
      const v = parse(inputs[f].value);
      if (v !== null) inputs[f].value = plain.format(v);
    });
  }
}
