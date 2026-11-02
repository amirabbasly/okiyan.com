/**
 * Counts every `.tally__num[data-count]` up to its final value the first time it
 * scrolls into view.
 *
 * The final value is rendered by the server, so the numbers are already correct
 * without JavaScript, with `prefers-reduced-motion: reduce`, or if the element
 * never intersects. Nothing is hidden while waiting.
 */
const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const faNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

if (els.length && !reduce && 'IntersectionObserver' in window) {
  const DURATION = 1400;

  const countUp = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - p) ** 3; // fast start, gentle landing
      el.textContent = faNumber(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        countUp(entry.target as HTMLElement);
      }
    },
    { threshold: 0.45 },
  );

  for (const el of els) io.observe(el);
}

export {};
