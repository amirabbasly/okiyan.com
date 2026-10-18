/**
 * Browser controller for the shipment journey.
 * Maps native scroll position → progress → computeFrame() → SVG attributes.
 * No scroll hijacking: the page scrolls normally; we only read its position.
 */
import { computeFrame, discreteProgress, cameraTransform, poseTransform, WORLD, STAGE_COUNT, SHEET_SPREAD, clamp, type Frame } from './timeline';

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const pad = (n: number) => String(n).padStart(2, '0').replace(/\d/g, (d) => faDigits[Number(d)]);

export function initJourney(root: HTMLElement) {
  const $ = <T extends Element = SVGElement>(k: string) => root.querySelector<T>(`[data-j="${k}"]`);
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const stepsWrap = root.querySelector<HTMLElement>('[data-steps]');
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  const svg = $('svg');
  if (!stepsWrap || !scene || !svg) return;

  const el = {
    camera: $('camera'),
    bg: $('bg'),
    ship: $('ship'),
    wake: $('wake'),
    container: $('container'),
    truck: $('truck'),
    route: $('route'),
    trail: $('trail'),
    docs: $('docs'),
    docsCheck: $('docs-check'),
    docsCheckPath: $('docs-check-path'),
    sheets: [0, 1, 2].map((i) => $(`sheet-${i}`)),
    oc: { l1: $('oc-l1'), l2: $('oc-l2'), trolley: $('oc-trolley'), spreader: $('oc-spreader') },
    dc: { l1: $('dc-l1'), l2: $('dc-l2'), trolley: $('dc-trolley'), spreader: $('dc-spreader') },
    scanBeam: $('scan-beam'),
    scanLine: $('scan-line'),
    stampCard: $('stamp-card'),
    stamp: $('stamp'),
    stampMark: $('stamp-mark'),
    barrier: $('barrier'),
    door: $<SVGGElement>('door'),
    done: $('done'),
    doneStrokes: Array.from(root.querySelectorAll<SVGElement>('[data-j="done"] [pathLength]')),
    markers: Array.from({ length: STAGE_COUNT }, (_, i) => $(`marker-${i}`)),
  };
  const hudCount = root.querySelector<HTMLElement>('[data-hud-count]');
  const hudTitle = root.querySelector<HTMLElement>('[data-hud-title]');
  const hudFills = Array.from(root.querySelectorAll<HTMLElement>('.j-hud__bar i'));
  const titles = steps.map((s) => s.querySelector('h3')?.lastChild?.textContent?.trim() ?? '');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stacked = matchMedia('(max-width: 900px)');

  const set = (node: Element | null, attr: string, value: string | number) => {
    if (node) node.setAttribute(attr, typeof value === 'number' ? value.toFixed(3) : value);
  };

  let target = 0;
  let shown = -1;
  let stage = -1;
  let running = false;
  let raf = 0;
  let last = 0;

  function readProgress() {
    // Measure the stage blocks themselves (not the list's tail padding).
    const top = steps[0].getBoundingClientRect().top;
    const bottom = steps[steps.length - 1].getBoundingClientRect().bottom;
    const r = { top, height: Math.max(1, bottom - top) };
    const vh = window.innerHeight;
    let line = vh * 0.5;
    if (stacked.matches) {
      // Reading line sits midway through the space left under the sticky scene.
      const bottom = clamp(scene!.getBoundingClientRect().bottom, 0, vh);
      line = bottom + (vh - bottom) * 0.42;
    }
    return clamp((line - r.top) / r.height);
  }

  function apply(f: Frame) {
    set(el.camera, 'transform', cameraTransform(f.camera));
    set(el.bg, 'transform', `translate(${(400 - f.camera.x * 0.28).toFixed(1)} 0)`);
    set(el.ship, 'transform', `translate(${f.ship.x.toFixed(2)} ${f.ship.y.toFixed(2)}) rotate(${f.ship.a.toFixed(3)}) scale(${f.ship.s.toFixed(4)})`);
    set(el.wake, 'opacity', f.atSea * 0.9);
    set(el.container, 'transform', poseTransform(f.container, WORLD.container.w, WORLD.container.h));
    set(el.truck, 'transform', `translate(${f.truckX.toFixed(2)} 0)`);
    set(el.route, 'stroke-dashoffset', (1 - f.route).toFixed(4));
    set(el.trail, 'stroke-dashoffset', (1 - f.trail).toFixed(4));

    // Documents
    set(el.docs, 'opacity', f.docs.dim);
    f.docs.sheets.forEach((s, i) => {
      set(el.sheets[i], 'opacity', s.o);
      set(el.sheets[i], 'transform', `translate(${(s.dx + (i - 1) * SHEET_SPREAD).toFixed(2)} ${s.dy.toFixed(2)}) rotate(${s.r.toFixed(2)})`);
    });
    set(el.docsCheck, 'opacity', f.docs.check > 0 ? 1 : 0);
    set(el.docsCheckPath, 'stroke-dashoffset', (1 - f.docs.check).toFixed(4));

    // Cranes
    for (const [rig, state, boomY] of [
      [el.oc, f.originCrane, WORLD.originCrane.boomY],
      [el.dc, f.destCrane, WORLD.destCrane.boomY],
    ] as const) {
      set(rig.l1, 'x1', state.tx - 30);
      set(rig.l1, 'x2', state.tx - 30);
      set(rig.l1, 'y2', state.hookY);
      set(rig.l2, 'x1', state.tx + 30);
      set(rig.l2, 'x2', state.tx + 30);
      set(rig.l2, 'y2', state.hookY);
      set(rig.l1, 'y1', boomY + 10);
      set(rig.l2, 'y1', boomY + 10);
      set(rig.trolley, 'x', state.tx - 38);
      set(rig.spreader, 'x', state.tx - 50);
      set(rig.spreader, 'y', state.hookY);
    }

    // Customs
    set(el.scanBeam, 'opacity', f.scan.beam * 0.16);
    const sx = 655 + 96 * f.scan.line;
    set(el.scanLine, 'x1', sx);
    set(el.scanLine, 'x2', sx);
    set(el.scanLine, 'opacity', f.scan.beam);
    set(el.stampCard, 'opacity', f.stamp.card);
    set(el.stamp, 'transform', `translate(0 ${(-34 + 30 * f.stamp.press).toFixed(2)})`);
    set(el.stamp, 'opacity', f.stamp.press > 0.02 ? 1 : 0);
    set(el.stampMark, 'opacity', f.stamp.mark);
    set(el.barrier, 'transform', `rotate(${(f.barrier * 80).toFixed(2)} 581 436)`);

    // Delivery
    if (el.door) el.door.style.transform = `scaleY(${(1 - f.door * 0.86).toFixed(4)})`;
    set(el.done, 'opacity', f.done > 0 ? 1 : 0);
    el.doneStrokes.forEach((n) => set(n, 'stroke-dashoffset', (1 - f.done).toFixed(4)));

    // Progress indicator
    hudFills.forEach((fill, i) => fill.style.setProperty('--fill', clamp(f.p * STAGE_COUNT - i).toFixed(3)));

    if (f.stage !== stage) {
      stage = f.stage;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === stage));
      el.markers.forEach((m, i) => m?.classList.toggle('is-active', i === stage));
      if (hudCount) hudCount.textContent = `${pad(stage + 1)} / ${pad(STAGE_COUNT)}`;
      if (hudTitle) hudTitle.textContent = titles[stage] ?? '';
    }
  }

  function render(now: number) {
    const reduce = reduceMotion.matches;
    const goal = reduce ? discreteProgress(target) : target;
    if (shown < 0 || reduce) {
      shown = goal;
    } else {
      // Light critically-damped easing toward the scroll position: smooth on
      // wheel steps, still exactly reversible, settles within ~200 ms.
      const dt = Math.min(64, now - (last || now));
      const k = 1 - Math.exp(-dt / 70);
      shown += (goal - shown) * k;
      if (Math.abs(goal - shown) < 0.0004) shown = goal;
    }
    last = now;
    const t = now / 1000;
    const swell = reduce ? { dy: 0, da: 0 } : { dy: Math.sin(t * 1.7) * 2.4, da: Math.sin(t * 1.15 + 0.7) * 1.1 };
    apply(computeFrame(shown, swell));
  }

  function loop(now: number) {
    render(now);
    // Keep animating only while visible and motion is allowed (for the swell);
    // otherwise frames are drawn on demand from scroll events.
    if (running && !reduceMotion.matches) raf = requestAnimationFrame(loop);
    else raf = 0;
  }

  function request() {
    // Off-screen: do nothing (no layout reads). The IntersectionObserver calls
    // request() again as soon as the section approaches the viewport.
    if (!running) return;
    target = readProgress();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      running = entry.isIntersecting;
      root.classList.toggle('is-running', running);
      if (running) request();
    },
    { rootMargin: '120px 0px' },
  );
  io.observe(root);

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  reduceMotion.addEventListener('change', request);
  root.classList.add('is-enhanced');
  // No work at load: the server-rendered SVG already shows the first frame, and the
  // IntersectionObserver starts rendering once the section approaches the viewport.
}
