/**
 * Shipment-journey timeline.
 *
 * `computeFrame(p)` is a pure function: progress p ∈ [0, 1] → the pose of every
 * moving part in the scene. It runs on the server (to render the initial frame
 * into HTML, so the scene is meaningful before/without JavaScript) and in the
 * browser (driven by native scroll position). Because the output depends only on
 * p, the animation is reversible and correct after any jump in scroll position.
 *
 * World coordinates: the scene is a side-view strip ~3000 units wide.
 * The journey runs right → left, matching Persian reading direction.
 *
 * To retime the journey, edit STAGE_COUNT / the `seg()` windows below.
 * To move scenery, edit WORLD and keep JourneyScene.astro in sync.
 */

export const STAGE_COUNT = 5;

/** Horizontal spacing of the three document sheets pinned on the board (stage 1). */
export const SHEET_SPREAD = 64;

export const VIEW = { w: 800, h: 560 } as const;

export const WORLD = {
  ground: 470,
  waterline: 482,
  horizon: 372,
  container: { w: 96, h: 42 },
  /** Container bottom-centre while waiting in the origin yard. */
  yard: { x: 2245, y: 470 },
  /** Ship docking points (waterline centre). */
  shipOrigin: { x: 2010, y: 482 },
  shipDest: { x: 1300, y: 482 },
  /** Container slot on the ship, relative to ship origin. */
  shipSlot: { x: -35, y: -30 },
  originCrane: { boomY: 262, parkX: 2245, parkHook: 300 },
  destCrane: { boomY: 222, parkX: 1065, parkHook: 280 },
  /** Truck x = front bumper. Container sits at x + 103 on the chassis. */
  truck: { quayX: 962, scanX: 600, deliverX: 270, slotOffset: 103, deckY: 446 },
  scanner: { x: 703 },
  barrier: { x: 580, y: 436 },
  /** Two cubic segments: origin quay → open sea (further away) → destination quay. */
  route: [
    [2010, 482, 1900, 482, 1820, 416, 1680, 410],
    [1680, 410, 1540, 404, 1420, 482, 1300, 482],
  ] as const,
} as const;

export const ROUTE_D = `M${WORLD.route[0][0]} ${WORLD.route[0][1]} C${WORLD.route[0].slice(2).join(' ')} C${WORLD.route[1].slice(2).join(' ')}`;

/** Camera keyframes: centre (x, y) in world units and zoom, at progress p.
 *  y sits high (~315–335) so the quay lands near the bottom of the frame and the
 *  sky above has room for the headline. */
const CAMERA: Array<[p: number, x: number, y: number, s: number]> = [
  [0.0, 2580, 315, 1.24],
  [0.1, 2500, 315, 1.3],
  [0.2, 2240, 323, 1.1],
  [0.27, 2120, 329, 1.04],
  [0.35, 1880, 339, 0.95],
  [0.45, 1600, 335, 0.9],
  [0.52, 1340, 321, 0.95],
  [0.6, 1180, 305, 1.0],
  [0.68, 890, 323, 1.05],
  [0.76, 705, 321, 1.14],
  [0.84, 520, 333, 1.05],
  [0.92, 335, 333, 1.1],
  [1.0, 262, 327, 1.16],
];

// ---------------------------------------------------------------- helpers
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Local progress of t inside the window [a, b]. */
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function camera(p: number) {
  let i = 0;
  while (i < CAMERA.length - 2 && p > CAMERA[i + 1][0]) i++;
  const k0 = CAMERA[Math.max(0, i - 1)];
  const k1 = CAMERA[i];
  const k2 = CAMERA[i + 1];
  const k3 = CAMERA[Math.min(CAMERA.length - 1, i + 2)];
  const t = clamp((p - k1[0]) / (k2[0] - k1[0]));
  return {
    x: catmullRom(k0[1], k1[1], k2[1], k3[1], t),
    y: catmullRom(k0[2], k1[2], k2[2], k3[2], t),
    s: catmullRom(k0[3], k1[3], k2[3], k3[3], t),
  };
}

// Arc-length table for the sea route so the ship and the drawn trail stay in step.
function bezier(c: readonly number[], t: number) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const d = 3 * mt * t * t;
  const e = t * t * t;
  return { x: a * c[0] + b * c[2] + d * c[4] + e * c[6], y: a * c[1] + b * c[3] + d * c[5] + e * c[7] };
}
const ROUTE_SAMPLES = (() => {
  const pts: Array<{ x: number; y: number; len: number }> = [];
  let len = 0;
  let prev = bezier(WORLD.route[0], 0);
  for (const c of WORLD.route) {
    for (let i = 0; i <= 120; i++) {
      const pt = bezier(c, i / 120);
      len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      pts.push({ ...pt, len });
      prev = pt;
    }
  }
  return pts.map((pt) => ({ ...pt, f: pt.len / len }));
})();

function routePoint(f: number) {
  const s = ROUTE_SAMPLES;
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].f < f) lo = mid;
    else hi = mid;
  }
  const t = s[hi].f === s[lo].f ? 0 : (f - s[lo].f) / (s[hi].f - s[lo].f);
  return { x: lerp(s[lo].x, s[hi].x, t), y: lerp(s[lo].y, s[hi].y, t) };
}

/** Ships further out to sea are drawn smaller (simple depth cue). */
const depthScale = (y: number) => 1 - 0.34 * clamp((WORLD.waterline - y) / (WORLD.waterline - 404));

// ---------------------------------------------------------------- frame
export interface Pose {
  x: number;
  y: number;
  a: number;
  s: number;
}
export interface CraneState {
  tx: number;
  hookY: number;
}
/** Day → night state of the sky. 0 = daylight, 1 = night. */
export interface SkyState {
  night: number;
  /** Sun sinks below the horizon as the shipment leaves stage 2. */
  sunDy: number;
  sunO: number;
  /** Moon rises into the same sky while the sun sets. */
  moonDy: number;
  moonO: number;
  starsO: number;
  /** Overlay over the scenery that cools the port down after dark. */
  veil: number;
}

export interface Frame {
  p: number;
  stage: number;
  stageT: number;
  sky: SkyState;
  camera: { x: number; y: number; s: number };
  container: Pose;
  ship: Pose;
  /** 0 in port, 1 at open sea — scales the swell. */
  atSea: number;
  originCrane: CraneState;
  destCrane: CraneState;
  truckX: number;
  docs: { sheets: Array<{ dx: number; dy: number; r: number; o: number; tick: number }>; check: number; dim: number };
  route: number;
  scan: { beam: number; line: number };
  stamp: { card: number; press: number; mark: number };
  barrier: number;
  trail: number;
  door: number;
  done: number;
}

export interface Swell {
  /** Vertical bob in world units and roll in degrees, at full swell. */
  dy: number;
  da: number;
}

export function stageOf(p: number) {
  const stage = Math.min(STAGE_COUNT - 1, Math.floor(clamp(p) * STAGE_COUNT));
  return { stage, t: clamp(p * STAGE_COUNT - stage) };
}

/** Window in which the sky changes: right after the shipment passes stage 2. */
const NIGHT_FROM = 0.4;
const NIGHT_TO = 0.52;

export function skyState(p: number): SkyState {
  const night = easeInOut(seg(clamp(p), NIGHT_FROM, NIGHT_TO));
  return {
    night,
    sunDy: lerp(0, 215, easeInOut(night)),
    // the sun is gone before it reaches the water, so it never floats below the quay
    sunO: 1 - easeInOut(seg(night, 0.55, 1)),
    moonDy: lerp(185, 0, easeInOut(night)),
    moonO: easeInOut(seg(night, 0.15, 1)),
    starsO: easeInOut(seg(night, 0.1, 0.95)),
    veil: 0.34 * night,
  };
}

export function computeFrame(pIn: number, swell: Swell = { dy: 0, da: 0 }): Frame {
  const p = clamp(pIn);
  const { stage, t: stageT } = stageOf(p);
  const local = (i: number) => clamp(p * STAGE_COUNT - i);
  const t1 = local(0);
  const t2 = local(1);
  const t3 = local(2);
  const t4 = local(3);
  const t5 = local(4);
  const C = WORLD.container;

  // ---- Stage 1: three documents pinned on the office board are reviewed one by one
  // (right → left): each one straightens and gets a tick, then the set is verified.
  const pinnedTilt = [-5, 3, -4];
  const sheets = pinnedTilt.map((r0, i) => {
    const j = 2 - i; // review order, right to left
    const k = easeOut(seg(t1, 0.08 + j * 0.17, 0.3 + j * 0.17));
    const lift = Math.sin(Math.PI * k) * -5; // picked up slightly while being checked
    return { dx: 0, dy: lift, r: lerp(r0, 0, k), o: 1, tick: easeInOut(seg(t1, 0.18 + j * 0.17, 0.32 + j * 0.17)) };
  });
  const check = easeInOut(seg(t1, 0.7, 0.9));

  // ---- Ship along the sea route (stage 2 second half → stage 3 first half).
  const routeF = p < 0.4 ? lerp(0, 0.62, easeInOut(seg(t2, 0.42, 1))) : lerp(0.62, 1, easeOut(seg(t3, 0, 0.45)));
  const shipPt = routePoint(routeF);
  const atSea = Math.sin(Math.PI * clamp(routeF)) ** 0.6;
  const shipScale = depthScale(shipPt.y);
  const ship: Pose = {
    x: shipPt.x,
    y: shipPt.y + swell.dy * atSea * shipScale,
    a: swell.da * atSea,
    s: shipScale,
  };
  const rad = (ship.a * Math.PI) / 180;
  const slot = {
    x: ship.x + ship.s * (Math.cos(rad) * WORLD.shipSlot.x - Math.sin(rad) * WORLD.shipSlot.y),
    y: ship.y + ship.s * (Math.sin(rad) * WORLD.shipSlot.x + Math.cos(rad) * WORLD.shipSlot.y),
  };

  // ---- Truck
  const tk = WORLD.truck;
  let truckX: number = tk.quayX;
  if (p >= 0.6) truckX = lerp(tk.quayX, tk.scanX, easeInOut(seg(t4, 0, 0.4)));
  if (p >= 0.8) truckX = lerp(tk.scanX, tk.deliverX, easeInOut(seg(t5, 0, 0.7)));
  const truckSlot = { x: truckX + tk.slotOffset, y: tk.deckY };

  // ---- Cranes and the container itself (one object, handed from yard → ship → truck).
  const oc = WORLD.originCrane;
  const dc = WORLD.destCrane;
  const originCrane: CraneState = { tx: oc.parkX, hookY: oc.parkHook };
  const destCrane: CraneState = { tx: dc.parkX, hookY: dc.parkHook };
  const hookFor = (bottom: number) => bottom - C.h - 5;
  let container: Pose = { x: WORLD.yard.x, y: WORLD.yard.y, a: 0, s: 1 };

  if (p < 0.2) {
    // waiting in the yard
  } else if (p < 0.4) {
    const t = t2;
    const yardTop = hookFor(WORLD.yard.y);
    const liftBottom = 337;
    const deckBottom = WORLD.shipOrigin.y + WORLD.shipSlot.y;
    const shipSlotX = WORLD.shipOrigin.x + WORLD.shipSlot.x;
    if (t < 0.08) {
      originCrane.hookY = lerp(oc.parkHook, yardTop, easeInOut(seg(t, 0, 0.08)));
    } else if (t < 0.36) {
      const lift = easeInOut(seg(t, 0.08, 0.16));
      const move = easeInOut(seg(t, 0.16, 0.28));
      const lower = easeInOut(seg(t, 0.28, 0.36));
      const bottom = lower > 0 ? lerp(liftBottom, deckBottom, lower) : lerp(WORLD.yard.y, liftBottom, lift);
      const x = lerp(WORLD.yard.x, shipSlotX, move);
      container = { x, y: bottom, a: 0, s: 1 };
      originCrane.tx = x;
      originCrane.hookY = hookFor(bottom);
    } else {
      // released onto the ship; hook rises and trolley returns
      const back = easeInOut(seg(t, 0.36, 0.6));
      originCrane.tx = lerp(shipSlotX, oc.parkX, back);
      originCrane.hookY = lerp(hookFor(deckBottom), oc.parkHook, easeOut(seg(t, 0.36, 0.46)));
      container = { x: slot.x, y: slot.y, a: ship.a, s: ship.s };
    }
  } else if (p < 0.6) {
    const t = t3;
    const shipSlotX = WORLD.shipDest.x + WORLD.shipSlot.x;
    const deckBottom = WORLD.shipDest.y + WORLD.shipSlot.y;
    const liftBottom = 300;
    if (t < 0.58) {
      container = { x: slot.x, y: slot.y, a: ship.a, s: ship.s };
      destCrane.tx = lerp(dc.parkX, shipSlotX, easeInOut(seg(t, 0.45, 0.52)));
      destCrane.hookY = lerp(dc.parkHook, hookFor(deckBottom), easeInOut(seg(t, 0.52, 0.58)));
    } else if (t < 0.94) {
      const lift = easeInOut(seg(t, 0.58, 0.68));
      const move = easeInOut(seg(t, 0.68, 0.82));
      const lower = easeInOut(seg(t, 0.82, 0.94));
      const bottom = lower > 0 ? lerp(liftBottom, tk.deckY, lower) : lerp(deckBottom, liftBottom, lift);
      const x = lerp(shipSlotX, truckSlot.x, move);
      container = { x, y: bottom, a: 0, s: 1 };
      destCrane.tx = x;
      destCrane.hookY = hookFor(bottom);
    } else {
      container = { x: truckSlot.x, y: truckSlot.y, a: 0, s: 1 };
      destCrane.tx = truckSlot.x;
      destCrane.hookY = lerp(hookFor(tk.deckY), dc.parkHook, easeOut(seg(t, 0.94, 1)));
    }
  } else {
    container = { x: truckSlot.x, y: truckSlot.y, a: 0, s: 1 };
    destCrane.tx = lerp(WORLD.truck.quayX + tk.slotOffset, dc.parkX, easeInOut(seg(t4, 0, 0.3)));
  }

  return {
    p,
    stage,
    stageT,
    sky: skyState(p),
    camera: camera(p),
    container,
    ship,
    atSea,
    originCrane,
    destCrane,
    truckX,
    docs: { sheets, check, dim: p < 0.2 ? 1 : lerp(1, 0.6, seg(t2, 0, 0.3)) },
    route: routeF,
    scan: {
      beam: seg(t4, 0.28, 0.36) * (1 - seg(t4, 0.62, 0.7)),
      line: easeInOut(seg(t4, 0.36, 0.6)),
    },
    stamp: {
      card: easeOut(seg(t4, 0.45, 0.58)) * (1 - 0.6 * seg(t5, 0, 0.3)),
      press: Math.sin(Math.PI * seg(t4, 0.58, 0.8)),
      mark: easeOut(seg(t4, 0.66, 0.72)),
    },
    barrier: easeInOut(seg(t4, 0.82, 1)),
    trail: easeInOut(seg(t5, 0, 0.7)),
    door: easeInOut(seg(t5, 0.5, 0.78)),
    done: easeInOut(seg(t5, 0.8, 0.96)),
  };
}

/**
 * Reduced-motion variant: each stage is shown as its completed state,
 * switching discretely as the reader moves from one stage to the next.
 */
export function discreteProgress(p: number) {
  const { stage } = stageOf(p);
  return (stage + 1) / STAGE_COUNT - 0.0001;
}

/** SVG transform string for the camera. */
export function cameraTransform(c: Frame['camera']) {
  return `translate(${(VIEW.w / 2).toFixed(1)} ${(VIEW.h / 2).toFixed(1)}) scale(${c.s.toFixed(4)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})`;
}

export function poseTransform(pose: Pose, w: number, h: number) {
  return `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)}) rotate(${pose.a.toFixed(3)}) scale(${pose.s.toFixed(4)}) translate(${-w / 2} ${-h})`;
}
