/**
 * Browser controller for the shipment journey (homepage header).
 * Maps native scroll position → progress → computeFrame() → SVG attributes.
 * No scroll hijacking: the page scrolls normally; we only read its position.
 *
 * Progress comes from how far the pinned panel has travelled through its scroll track.
 * The headline overlay fades out as the journey starts (--intro-o on the root).
 */
import { computeFrame, cameraTransform, poseTransform, WORLD, STAGE_COUNT, SHEET_SPREAD, clamp, type Frame } from './timeline';

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const pad = (n: number) => String(n).padStart(2, '0').replace(/\d/g, (d) => faDigits[Number(d)]);

export function initJourney(root: HTMLElement) {
  const $ = <T extends Element = SVGElement>(k: string) => root.querySelector<T>(`[data-j="${k}"]`);
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const track = root.querySelector<HTMLElement>('[data-track]');
  const pin = root.querySelector<HTMLElement>('[data-pin]');
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  const svg = $('svg');
  if (!track || !pin || !scene || !svg) return;

  const el = {
    camera: $('camera'),
    bg: $('bg'),
    skyDay: $('sky-day'),
    stars: $('stars'),
    sun: $('sun'),
    moon: $('moon'),
    veil: $('night-veil'),
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
    sheetTicks: [0, 1, 2].map((i) => $(`sheet-tick-${i}`)),
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
  const stepBars = steps.map((s) => s.querySelector<HTMLElement>('.hj-step__bar i'));
  const titles = steps.map((s) => s.querySelector('.hj-step__title')?.textContent?.trim() ?? '');
  const header = document.querySelector<HTMLElement>('.site-header');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const set = (node: Element | null, attr: string, value: string | number) => {
    if (node) node.setAttribute(attr, typeof value === 'number' ? value.toFixed(3) : value);
  };

  let target = 0;
  let shown = 0; // the server-rendered frame is p = 0
  let rendered = false;
  let stage = 0;
  let running = false;
  let raf = 0;
  let last = 0;
  let atSea = 0;

  // ---- Autorun: plays the whole journey once without the visitor scrolling ----
  const AUTO_MS = 14000;
  const runBtn = root.querySelector<HTMLButtonElement>('[data-journey-run]');
  const runLabel = runBtn?.querySelector<HTMLElement>('[data-run-label]');
  const auto = { active: false, start: 0, from: 0 };

  const smoothstep = (t: number) => t * t * (3 - 2 * t);
  /** Gentle start and end, otherwise steady progress through the five stages. */
  const autoEase = (t: number) => 0.18 * smoothstep(t) + 0.82 * t;

  function setRunState(active: boolean) {
    if (!runBtn) return;
    runBtn.setAttribute('aria-pressed', String(active));
    runBtn.classList.toggle('is-running', active);
    if (runLabel) runLabel.textContent = active ? 'توقف پخش' : 'پخش خودکار مسیر';
  }

  function startAuto() {
    // Playback is an explicit choice (like pressing play on a video), so it always
    // animates — the reduced-motion preference only drops the ambient effects.
    // Replay from the top when the journey is already finished.
    const g0 = geometry();
    if (g0.d >= g0.range - 2) {
      jumpToProgress(0);
      shown = 0;
      target = 0;
      rendered = false;
    }
    auto.active = true;
    auto.start = performance.now();
    auto.from = clamp(readProgress());
    setRunState(true);
    root.classList.add('is-autorun');
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function stopAuto(handBack = true) {
    if (!auto.active) return;
    auto.active = false;
    setRunState(false);
    root.classList.remove('is-autorun');
    if (handBack) target = readProgress();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  runBtn?.addEventListener('click', () => {
    if (auto.active) stopAuto();
    else startAuto();
  });

  // Any deliberate scroll (wheel, touch, keys, scrollbar drag) hands control back.
  // Touches on the button itself are not a scroll gesture.
  const interrupt = (e: Event) => {
    if (runBtn && e.target instanceof Element && runBtn.contains(e.target)) return;
    stopAuto();
  };
  window.addEventListener('wheel', interrupt, { passive: true });
  window.addEventListener('touchstart', interrupt, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) interrupt(e);
  });

  /** d = distance travelled through the pinned range; before = distance until pinning starts. */
  function geometry() {
    const headerH = header?.offsetHeight ?? 0;
    const pr = pin!.getBoundingClientRect();
    const tr = track!.getBoundingClientRect();
    return {
      d: pr.top - tr.top,
      range: Math.max(1, track!.offsetHeight - pin!.offsetHeight),
      before: Math.max(0, pr.top - headerH),
    };
  }

  const readProgress = () => {
    const g = geometry();
    return clamp(g.d / g.range);
  };

  /** Where the page has to be so the animation sits at progress p. */
  function scrollTopFor(p: number) {
    const g = geometry();
    return window.scrollY + g.before + p * g.range - clamp(g.d, 0, g.range);
  }

  /** Scroll the page so the animation sits at progress p (0 = top of the track). */
  function scrollToProgress(p: number) {
    window.scrollTo({ top: scrollTopFor(p), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  /** Put the page at progress p with no animation at all. */
  function jumpToProgress(p: number) {
    window.scrollTo(0, scrollTopFor(p));
  }

  /** Follow the playing timeline with the page position (no end-of-play jump). */
  function syncScroll(p: number) {
    const top = scrollTopFor(p);
    if (Math.abs(top - window.scrollY) > 1) window.scrollTo(0, top);
  }

  /** Scroll the page so the animation shows stage i (near its completed state). */
  function scrollToStage(i: number) {
    scrollToProgress((i + 0.85) / STAGE_COUNT);
  }

  function apply(f: Frame) {
    set(el.camera, 'transform', cameraTransform(f.camera));
    // Day → night: the day sky fades away as the sun sets and the moon rises.
    set(el.skyDay, 'opacity', f.sky.night >= 0.999 ? 0 : 1 - f.sky.night);
    set(el.stars, 'opacity', f.sky.starsO);
    set(el.sun, 'transform', `translate(0 ${f.sky.sunDy.toFixed(2)})`);
    set(el.sun, 'opacity', f.sky.sunO);
    set(el.moon, 'transform', `translate(0 ${f.sky.moonDy.toFixed(2)})`);
    set(el.moon, 'opacity', f.sky.moonO);
    set(el.veil, 'opacity', f.sky.veil);
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
      set(el.sheets[i], 'transform', `translate(${(s.dx + (i - 1) * SHEET_SPREAD).toFixed(2)} ${s.dy.toFixed(2)}) rotate(${s.r.toFixed(2)} 0 -40)`);
      set(el.sheetTicks[i], 'stroke-dashoffset', (1 - s.tick).toFixed(4));
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

    // Progress indicators: HUD bars and the bar under each stage title
    for (let i = 0; i < STAGE_COUNT; i++) {
      const v = clamp(f.p * STAGE_COUNT - i).toFixed(3);
      hudFills[i]?.style.setProperty('--fill', v);
      stepBars[i]?.style.setProperty('--fill', v);
    }

    if (f.stage !== stage) {
      stage = f.stage;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === stage));
      el.markers.forEach((m, i) => m?.classList.toggle('is-active', i === stage));
      if (hudCount) hudCount.textContent = `${pad(stage + 1)} / ${pad(STAGE_COUNT)}`;
      if (hudTitle) hudTitle.textContent = titles[stage] ?? '';
    }
    root.classList.toggle('is-start', f.p < 0.015);
    // Headline overlay: fully visible at the top, gone once the journey is under way.
    const introO = clamp(1 - f.p / 0.05);
    root.style.setProperty('--intro-o', introO.toFixed(3));
    root.classList.toggle('is-past-intro', introO < 0.05);
    root.classList.toggle('is-running', running && f.p > 0.015 && !reduceMotion.matches);
  }

  function render(now: number) {
    const reduce = reduceMotion.matches;
    if (auto.active) {
      const t = clamp((now - auto.start) / AUTO_MS);
      target = auto.from + (1 - auto.from) * autoEase(t);
      if (t >= 1) {
        // Finished: the page has been following the timeline, so it is already at
        // the delivered frame. Just hand control back without moving anything.
        auto.active = false;
        setRunState(false);
        root.classList.remove('is-autorun');
        shown = 1;
        target = 1;
        jumpToProgress(1);
        rendered = true;
      }
    }
    // Progress is always continuous and follows the scroll position exactly; the
    // reduced-motion preference only removes the easing (and the ambient swell),
    // it never snaps a whole stage at a time.
    const goal = target;
    if (reduce) {
      shown = goal;
    } else {
      // Light critically-damped easing toward the scroll position: smooth on
      // wheel steps, still exactly reversible, settles within ~200 ms.
      const dt = Math.min(64, now - (last || now));
      const k = last ? 1 - Math.exp(-dt / 70) : 1;
      shown += (goal - shown) * k;
      if (Math.abs(goal - shown) < 0.0004) shown = goal;
    }
    last = now;
    const t = now / 1000;
    const swell = reduce ? { dy: 0, da: 0 } : { dy: Math.sin(t * 1.7) * 2.4, da: Math.sin(t * 1.15 + 0.7) * 1.1 };
    // While the autorun plays, keep the page's own scroll position in step with the
    // timeline: the scrollbar moves with the scene and there is no jump at the end.
    if (auto.active) syncScroll(shown);
    const f = computeFrame(shown, swell);
    atSea = f.atSea;
    apply(f);
    rendered = true;
  }

  function loop(now: number) {
    render(now);
    // Keep animating only while easing toward the scroll position or while the ship
    // bobs at sea; otherwise frames are drawn on demand from scroll events.
    const easing = Math.abs(target - shown) > 0.0004;
    // While playing, the page follows the timeline and the section may scroll out of
    // view at the very end — the playback still has to finish its 14 seconds.
    const keepGoing = auto.active || (running && !reduceMotion.matches && (easing || atSea > 0.001));
    if (keepGoing) raf = requestAnimationFrame(loop);
    else {
      raf = 0;
      last = 0;
    }
  }

  function request() {
    // Off-screen: no layout reads. The IntersectionObserver re-requests on entry.
    if (!running) return;
    if (auto.active) return; // the timeline owns the progress while it plays
    target = readProgress();
    // Nothing to draw yet: the server-rendered SVG already shows p = 0.
    if (!rendered && target < 0.0005) return;
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // Stage buttons: a click only moves the timeline to that stage. Nothing opens.
  steps.forEach((s, i) => {
    s.querySelector<HTMLElement>('[data-step-btn]')?.addEventListener('click', () => {
      stopAuto();
      scrollToStage(i);
    });
  });

  const io = new IntersectionObserver(
    ([entry]) => {
      running = entry.isIntersecting;
      if (!running) root.classList.remove('is-running');
      if (running) request();
    },
    { rootMargin: '120px 0px' },
  );
  io.observe(root);

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  reduceMotion.addEventListener('change', request);
  // Fit the scene to the frame's shape: always show the full scene height and let a
  // wider frame reveal more of the harbour to each side (narrower frames crop the sides).
  const baseW = Number(svg.getAttribute('data-base-w')) || 800;
  const baseH = Number(svg.getAttribute('data-base-h')) || 560;
  // Sizes come from the observer (delivered after layout, also once on observe), so
  // start-up never forces a synchronous layout.
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (!width || !height) return;
    const w = (baseH * width) / height;
    svg!.setAttribute('viewBox', `${((baseW - w) / 2).toFixed(1)} 0 ${w.toFixed(1)} ${baseH}`);
  }).observe(scene);

  root.classList.add('is-enhanced', 'is-start');
  setRunState(false);
}
