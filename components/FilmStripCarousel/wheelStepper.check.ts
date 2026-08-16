/**
 * Asserts the wheel never skips a frame and never advances two for one notch,
 * while still travelling on momentum.
 * Run: node components/FilmStripCarousel/wheelStepper.check.ts
 *
 * Two halves, matching the two halves of the fix:
 *   1. createWheelStepper — browser deltas become whole notches.
 *   2. glideVelocity/glideDistance — a notch aims the momentum glide at an
 *      exact landing frame. §B integrates the real decay loop to prove the reel
 *      comes to rest on that frame and no other.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Same resolver hook as filmCurve.check.ts: the app is bundled, so its imports
// are extensionless and Node's ESM resolver is not.
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec) && ctx.parentURL) {
      const base = new URL(spec, ctx.parentURL).href;
      for (const ext of ['.ts', '.tsx', '.js']) {
        if (existsSync(fileURLToPath(base + ext))) return next(base + ext, ctx);
      }
    }
    return next(spec, ctx);
  },
});

const { MAX_VELOCITY, MOMENTUM_DECAY, MOMENTUM_HANDOFF } = await import('./constants.ts');
const { glideDistance, glideVelocity } = await import('./carouselMath.ts');
const { createWheelStepper, WHEEL_GESTURE_GAP, WHEEL_LINE_HEIGHT, WHEEL_STEP_PX } = await import(
  '../../lib/wheelStepper.ts'
);

const wheel = (deltaY: number, timeStamp: number, deltaMode = 0) => ({
  deltaX: 0,
  deltaY,
  deltaMode,
  timeStamp,
});

// Total steps produced by a sequence of events.
const run = (
  events: Array<{ deltaX: number; deltaY: number; deltaMode: number; timeStamp: number }>,
  pageHeight = 800
) => {
  const stepper = createWheelStepper(pageHeight);
  return events.reduce((total, e) => total + stepper(e), 0);
};

/* ------------------------------------------- §A  deltas → whole notches */

// A.1 One mouse notch is exactly one frame — the "scrolls 2 times" bug.
assert.equal(run([wheel(WHEEL_STEP_PX, 0)]), 1);
assert.equal(run([wheel(-WHEEL_STEP_PX, 0)]), -1);

// A.2 Ten notches in a burst are ten frames: none dropped, none doubled.
assert.equal(run(Array.from({ length: 10 }, (_, i) => wheel(WHEEL_STEP_PX, i * 50))), 10);

// A.3 A notch the browser splits into fragments counts once — not once per
//     event, and not zero times. This is the "skips" bug from both ends.
assert.equal(run(Array.from({ length: 10 }, (_, i) => wheel(10, i * 8))), 1);

// A.4 Firefox's line units reach a step in a comparable number of events
//     instead of being ~16x too small to ever move.
assert.equal(
  run(Array.from({ length: Math.ceil(WHEEL_STEP_PX / (3 * WHEEL_LINE_HEIGHT)) }, (_, i) =>
    wheel(3, i * 8, 1)
  )),
  1
);

// A.5 One coarse event pays out every notch it earned rather than binning the
//     remainder: a page-mode wheel on an 800px viewport is 8 frames.
assert.equal(run([wheel(1, 0, 2)], 800), Math.trunc(800 / WHEEL_STEP_PX));
assert.equal(run([wheel(4.5 * WHEEL_STEP_PX, 0)]), 4);

// A.6 A reversal starts fresh: 90px up then 90px down must not combine.
assert.equal(run([wheel(90, 0), wheel(-90, 20)]), 0);

// A.7 A stale part-notch expires rather than lurking to trigger a later double.
assert.equal(run([wheel(90, 0), wheel(90, WHEEL_GESTURE_GAP + 1)]), 0);

// A.8 Continuing one gesture carries the remainder: 3 x 60px = 180px = 1 step.
assert.equal(run([wheel(60, 0), wheel(60, 20), wheel(60, 40)]), 1);

// A.9 Zero-delta events are inert.
assert.equal(run([wheel(0, 0), wheel(0, 20)]), 0);

// A.10 TRACKPAD. A continuous stream must keep paying out for as long as the
//      fingers move. The events archive's old heuristic capped a burst at two
//      steps, so a long swipe moved two photographs and then went dead — this
//      is that bug. 120 events x 8px = 960px = 9 steps, not 2.
assert.equal(
  run(Array.from({ length: 120 }, (_, i) => wheel(8, i * 8))),
  Math.trunc((120 * 8) / WHEEL_STEP_PX)
);

// A.11 PROPORTIONALITY. The same distance yields the same travel however the
//      browser chunks it — coarse mouse notches and fine trackpad deltas agree.
const distance = 12 * WHEEL_STEP_PX;
for (const chunk of [4, 10, 25, 50, 100, 200]) {
  assert.equal(
    run(Array.from({ length: distance / chunk }, (_, i) => wheel(chunk, i * 8))),
    12,
    `${distance}px delivered in ${chunk}px chunks must be 12 steps`
  );
}

/* ------------------------------------ §B  notches → exact landing frame */

// Mirrors the momentum branch of the integrator in useFilmCarousel.step().
// Returns where the reel actually comes to rest, and the peak velocity it hit
// (the motion-blur driver, asserted alive in B.4).
function glide(startPos: number, startVel: number) {
  let position = startPos;
  let velocity = startVel;
  let peak = Math.abs(velocity);
  for (let i = 0; i < 100_000; i++) {
    if (Math.abs(velocity) < MOMENTUM_HANDOFF) break;
    position += velocity;
    velocity *= MOMENTUM_DECAY;
    peak = Math.max(peak, Math.abs(velocity));
  }
  // Handoff to the snap spring, which closes on the nearest whole frame.
  return { landed: Math.round(position), peak };
}

// B.1 The closed form round-trips: the velocity aimed at n frames is precisely
//     the velocity whose glide covers n frames. (Only whole frames round-trip
//     — snapping the target to one is what glideVelocity's Math.round is for.)
for (let n = -10; n <= 10; n++) {
  assert.ok(Math.abs(glideDistance(glideVelocity(0, 0, n)) - n) < 1e-12);
}

// How many frames of lookahead MAX_VELOCITY allows before the clamp bites.
const MAX_STEPS = Math.floor(MAX_VELOCITY / (1 - MOMENTUM_DECAY));
assert.ok(MAX_STEPS >= 9, 'the clamp must allow a decent glide, not one frame');

// B.2 THE DOUBLE-SCROLL GUARANTEE. From rest, n notches land on exactly n
//     frames — never n+1, never n-1 — for every count the clamp allows.
//     Beyond MAX_STEPS the clamp deliberately shortens travel; B.5 covers that.
for (let n = 1; n <= MAX_STEPS; n++) {
  const v = glideVelocity(0, 0, n);
  assert.ok(Math.abs(v) <= MAX_VELOCITY, `n=${n} must fit under the velocity clamp`);
  assert.equal(glide(0, v).landed, n, `${n} notches must land on frame ${n}`);
  assert.equal(glide(0, -v).landed, -n, `${n} notches back must land on frame ${-n}`);
}

// B.3 Re-aiming MID-GLIDE stays exact. This is the case the old velocity
//     injection got wrong: a notch arriving while the previous one was still
//     decaying used to compound into an extra frame. Interrupt at every point
//     along the glide and the landing is still 1 + 1 = 2.
let position = 0;
let velocity = glideVelocity(0, 0, 1);
for (let i = 0; i < 60; i++) {
  const rest = position + glideDistance(velocity);
  assert.equal(
    glide(position, glideVelocity(position, rest, 1)).landed,
    2,
    `a second notch ${i} frames into the first must land on frame 2`
  );
  if (Math.abs(velocity) < MOMENTUM_HANDOFF) break;
  position += velocity;
  velocity *= MOMENTUM_DECAY;
}

// B.4 Momentum and its motion blur survive. Fast scrolling must still build
//     real velocity — the distortion shader drives off velocity / MAX_VELOCITY,
//     so a glide that saturated instantly or crawled would kill the effect.
assert.ok(glide(0, glideVelocity(0, 0, 1)).peak > MOMENTUM_HANDOFF * 2, 'one notch still glides');
assert.ok(
  Math.abs(glideVelocity(0, 0, MAX_STEPS)) / MAX_VELOCITY > 0.9,
  'a fast scroll must reach near-full velocity, or the motion blur never shows'
);
assert.ok(
  Math.abs(glideVelocity(0, 0, 1)) / MAX_VELOCITY < 0.25,
  'a single notch must stay well under full blur'
);

// B.5 Past the clamp the glide is shortened, but it still stops on a whole
//     frame — a frantic scroll degrades, it never leaves the reel off-centre.
const clamped = Math.sign(glideVelocity(0, 0, 40)) * MAX_VELOCITY;
const far = glide(0, clamped);
assert.equal(far.landed, Math.round(far.landed));
assert.ok(far.landed > 0 && far.landed < 40);

console.log('wheelStepper.check.ts: all assertions passed (§A deltas, §B landing)');
