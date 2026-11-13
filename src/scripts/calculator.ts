/**
 * Live cost estimate for /price-calculator/.
 *
 * The panel starts out showing each line's FORMULA. Only when the four required
 * inputs (goods value, exchange rate, duty rate, VAT rate) are filled does it swap
 * to numbers — and those numbers are computed entirely from what the visitor typed.
 * Nothing here has a default rate, and nothing is fetched from the network.
 *
 * Accepts Persian/Arabic digits and thousands separators; reformats on blur.
 */
import { estimate, type Estimate, type FormulaKey } from '~/data/pricing';

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

const REQUIRED = ['value', 'rate', 'duty', 'vat'] as const;
const OPTIONAL = ['freight', 'port', 'fee'] as const;

export function initCalculator(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-calc-form]');
  const status = root.querySelector<HTMLElement>('[data-calc-status]');
  if (!form) return;

  const el = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;
  const required = REQUIRED.map((n) => [n, el(n)] as const).filter(([, e]) => e) as Array<
    [(typeof REQUIRED)[number], HTMLInputElement]
  >;
  const optional = OPTIONAL.map((n) => [n, el(n)] as const).filter(([, e]) => e) as Array<
    [(typeof OPTIONAL)[number], HTMLInputElement]
  >;
  const outs = new Map<string, HTMLOutputElement>();
  const formulas = new Map<string, string>();
  for (const o of Array.from(root.querySelectorAll<HTMLOutputElement>('[data-out]'))) {
    const key = o.dataset.out as string;
    outs.set(key, o);
    formulas.set(key, o.textContent ?? '');
  }
  const unit = root.querySelector<HTMLElement>('[data-calc-unit]');

  function update() {
    const values: Partial<Record<string, number>> = {};
    let missing = 0;

    for (const [name, input] of required) {
      const v = parse(input.value);
      input.setAttribute('aria-invalid', String(v === null));
      if (v === null) missing++;
      else values[name] = v;
    }
    for (const [name, input] of optional) {
      const v = parse(input.value);
      input.setAttribute('aria-invalid', 'false');
      values[name] = v ?? 0;
    }

    if (missing > 0) {
      // Show the formula of every line, so the panel stays informative.
      for (const [key, out] of outs) out.textContent = formulas.get(key) ?? '';
      if (unit) unit.hidden = true;
      if (status) {
        const fmt = new Intl.NumberFormat('fa-IR');
        status.textContent = `برای محاسبه، ${fmt.format(missing)} مورد از نرخ‌های لازم را وارد کنید. تا آن زمان، فرمول هر قلم نمایش داده می‌شود.`;
        status.dataset.state = 'pending';
      }
      return;
    }

    const result = estimate({
      value: values.value as number,
      freight: values.freight ?? 0,
      rate: values.rate as number,
      duty: values.duty as number,
      vat: values.vat as number,
      port: values.port ?? 0,
      fee: values.fee ?? 0,
    });

    for (const [key, out] of outs) {
      if (key === 'total') out.textContent = money.format(Math.round(result.total));
      else out.textContent = money.format(Math.round(result[key as keyof Estimate] ?? 0));
    }
    if (unit) unit.hidden = false;
    if (status) {
      status.textContent =
        'نتیجه فقط از نرخ‌هایی ساخته شده که خودتان وارد کردید؛ هیچ نرخ پیش‌فرضی در این ابزار نیست.';
      status.dataset.state = 'done';
    }
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  for (const [, input] of [...required, ...optional]) {
    input.addEventListener('blur', () => {
      const v = parse(input.value);
      if (v !== null) input.value = plain.format(v);
    });
  }
  // Reflect the first render so the server HTML and the client state agree.
  update();
}

/** Re-exported for the type of the rendered rows. */
export type { FormulaKey };
