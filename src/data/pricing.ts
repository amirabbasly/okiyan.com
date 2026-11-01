/**
 * Price calculator settings (/price-calculator/).
 *
 * SAMPLE VALUES — none of these are real rates or OKIYAN's real fees. Replace them
 * with confirmed figures before removing '/price-calculator/' from
 * src/data/sample-pages.json. Duty rates depend on the tariff code, so the visitor
 * enters that one themselves.
 */
export const pricing = {
  /** Value-added tax and duties on (customs value + import duty), in percent. */
  vatPercent: 10,
  /** Port, storage and handling costs as a percent of the customs value (rough average). */
  portPercent: 1.5,
  /** OKIYAN service fee: a percent of the customs value, with a minimum (Toman). */
  feePercent: 0.5,
  feeMinimum: 15_000_000,
  /** Pre-filled example inputs. */
  defaults: { value: 10_000, freight: 800, rate: 60_000, duty: 15 },
  currencies: [
    { code: 'USD', label: 'دلار آمریکا' },
    { code: 'EUR', label: 'یورو' },
    { code: 'AED', label: 'درهم امارات' },
    { code: 'CNY', label: 'یوآن چین' },
  ],
} as const;

export interface Estimate {
  customsValue: number;
  duty: number;
  vat: number;
  port: number;
  fee: number;
  total: number;
}

/** All amounts in Toman. Shared by the page (initial render) and the browser script. */
export function estimate(input: { value: number; freight: number; rate: number; duty: number }): Estimate {
  const customsValue = (input.value + input.freight) * input.rate;
  const duty = (customsValue * input.duty) / 100;
  const vat = ((customsValue + duty) * pricing.vatPercent) / 100;
  const port = (customsValue * pricing.portPercent) / 100;
  const fee = customsValue > 0 ? Math.max(pricing.feeMinimum, (customsValue * pricing.feePercent) / 100) : 0;
  return { customsValue, duty, vat, port, fee, total: duty + vat + port + fee };
}
