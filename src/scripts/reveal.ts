/**
 * One-time section entrances. Marks `.reveal` elements with `.is-in` when they first
 * enter the viewport; CSS in global.css handles the transition.
 * Elements already on screen are revealed immediately (no flash), and nothing is
 * hidden unless this script runs and motion is allowed.
 */
const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
const motionOk = matchMedia('(prefers-reduced-motion: no-preference)').matches;

if (els.length && motionOk && 'IntersectionObserver' in window) {
  const vh = window.innerHeight;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.classList.add('is-in');
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of els) if (!el.classList.contains('is-in')) io.observe(el);
  document.documentElement.classList.add('reveal-ready');
}
