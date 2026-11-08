// Sanity tests for the shipment-journey timeline (pure function of progress).
// Run: npm run test:journey   (Node ≥ 22.18 strips TypeScript types natively)
import assert from 'node:assert/strict';
import { computeFrame, discreteProgress, stageOf, STAGE_COUNT } from '../src/components/journey/timeline.ts';

const N = 4000;
let maxJump = 0;
let prev = computeFrame(0);
let prevStage = 0;
for (let i = 1; i <= N; i++) {
  const p = i / N;
  const f = computeFrame(p);
  // 1. The one container never teleports: hand-offs (yard → ship → crane → truck) are continuous.
  const jump = Math.hypot(f.container.x - prev.container.x, f.container.y - prev.container.y);
  maxJump = Math.max(maxJump, jump);
  assert.ok(jump < 12, `container jumped ${jump.toFixed(1)} units at p=${p}`);
  // 2. Stages only advance forward with progress.
  assert.ok(f.stage >= prevStage, `stage went backwards at p=${p}`);
  // 3. Camera stays finite and positive zoom.
  assert.ok(Number.isFinite(f.camera.x) && f.camera.s > 0.5 && f.camera.s < 2, `bad camera at p=${p}`);
  prev = f;
  prevStage = f.stage;
}

// 4. Reversible: same p → identical frame regardless of the path taken to reach it.
assert.deepEqual(computeFrame(0.437), computeFrame(0.437));

// 5. Every stage is reachable and the end state is complete.
assert.deepEqual(
  Array.from({ length: STAGE_COUNT }, (_, i) => stageOf((i + 0.5) / STAGE_COUNT).stage),
  [0, 1, 2, 3, 4],
);
const end = computeFrame(1);
assert.equal(end.done, 1);
assert.equal(end.door, 1);
assert.equal(end.trail, 1);
assert.equal(end.route, 1);

// 6. Reduced motion shows each stage's completed state.
for (let s = 0; s < STAGE_COUNT; s++) {
  const p = discreteProgress((s + 0.3) / STAGE_COUNT);
  assert.equal(stageOf(p).stage, s);
  assert.ok(stageOf(p).t > 0.99, `stage ${s} reduced-motion frame is not its end state`);
}
assert.ok(computeFrame(discreteProgress(0.05)).docs.check === 1, 'reduced motion: documents should be verified');
assert.ok(computeFrame(discreteProgress(0.75)).barrier > 0.99, 'reduced motion: customs barrier should be open');

// 7. Sky: daylight at the start, night in the middle, and daylight again by the time
// the truck reaches the customs gate — so the journey ends on a bright frame.
assert.ok(computeFrame(0.2).sky.night < 0.001, 'journey should start in daylight');
assert.ok(computeFrame(0.65).sky.night > 0.999, 'the middle of the journey should be at night');
assert.ok(computeFrame(0.9).sky.night < 0.001, 'the sky should be light again before the gate');
assert.ok(computeFrame(0.94).sky.night < 0.001, 'the truck arrives at the gate in daylight');
assert.ok(computeFrame(1).sky.night < 0.001, 'the journey must end in daylight');
assert.ok(computeFrame(1).sky.sunO > 0.99 && computeFrame(1).sky.moonO < 0.01, 'sun back, moon gone at the end');

console.log(`journey timeline OK — ${N} samples, max container step ${maxJump.toFixed(2)} units`);
