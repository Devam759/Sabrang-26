/**
 * Asserts one gesture yields exactly one step, on every input device.
 * Run: node lib/gestureStepper.check.ts
 *
 * The traces below are shaped like real device output, because that is where
 * this logic actually fails: a mouse emits isolated notches, while a trackpad
 * emits a dense stream that ramps up, plateaus, and then decays through inertia
 * long after the fingers have lifted. Feeding it single synthetic events would
 * pass while the real thing still double-stepped.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

const { createGestureStepper, createWheelGesture, STREAM_END_MS, WHEEL_LINE_HEIGHT } =
  await import('./gestureStepper.ts');

/** Gap that reliably separates two deliberate gestures. */
const APART = STREAM_END_MS + 80;

interface Ev {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  timeStamp: number;
}

/** Net steps a trace produces, and the raw per-event results. */
function play(events: Ev[], pageHeight = 800) {
  const gesture = createWheelGesture(pageHeight);
  const steps = events.map(gesture);
  return {
    net: steps.reduce<number>((a, b) => a + b, 0),
    fired: steps.filter((s) => s !== 0).length,
  };
}

const at = (t: number, deltaY: number, deltaMode = 0): Ev => ({
  deltaX: 0,
  deltaY,
  deltaMode,
  timeStamp: t,
});

/**
 * A trackpad swipe: deltas ramp up while the fingers accelerate, plateau, then
 * decay through inertia after they lift. Emitted at ~60Hz throughout, which is
 * precisely why event count and total distance are both useless as boundaries.
 */
function swipe(startT: number, peak: number, dir = 1, rampSteps = 6, tailSteps = 24): Ev[] {
  const events: Ev[] = [];
  let t = startT;
  for (let i = 1; i <= rampSteps; i++) {
    events.push(at(t, dir * peak * (i / rampSteps)));
    t += 16;
  }
  let magnitude = peak;
  for (let i = 0; i < tailSteps; i++) {
    magnitude *= 0.82; // inertia decay
    events.push(at(t, dir * magnitude));
    t += 16;
  }
  return events;
}

const endOf = (events: Ev[]) => events[events.length - 1].timeStamp;

/** Deterministic PRNG, so a jitter failure is reproducible from its seed. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * A VIGOROUS swipe. Same shape as the gentle one, but with the jitter a fast
 * flick actually produces — magnitudes bounce around in both the ramp and the
 * tail, and the event cadence is irregular. This is the trace that broke the
 * previous attempt: comparing each event to the one before it read a jitter
 * spike in the tail as a fresh push and stepped a second time.
 */
function vigorousSwipe(startT: number, peak: number, seed: number, dir = 1): Ev[] {
  const rand = rng(seed);
  const events: Ev[] = [];
  const jitter = () => 0.55 + rand() * 0.75; // 0.55x .. 1.30x
  const cadence = () => 8 + Math.round(rand() * 12); // 8..20ms, irregular
  let t = startT;

  for (let i = 1; i <= 8; i++) {
    events.push(at(t, dir * peak * (i / 8) * jitter()));
    t += cadence();
  }
  let magnitude = peak;
  for (let i = 0; i < 40; i++) {
    magnitude *= 0.88;
    events.push(at(t, dir * magnitude * jitter()));
    t += cadence();
  }
  return events;
}

/* ------------------------------------------------------ mouse: one per notch */

// 1. A single notch is one step.
assert.deepEqual(play([at(0, 100)]), { net: 1, fired: 1 });
assert.deepEqual(play([at(0, -100)]), { net: -1, fired: 1 });

// 2. Brisk wheeling must NOT merge — every notch is its own photograph. This is
//    the behaviour that already felt right and must survive the rewrite.
const notches = Array.from({ length: 8 }, (_, i) => at(i * 90, 100));
assert.deepEqual(play(notches), { net: 8, fired: 8 });

// 3. Firefox's line units are one step per notch too, not 16x anything.
assert.deepEqual(play([at(0, 3, 1)]), { net: 1, fired: 1 });
assert.ok(3 * WHEEL_LINE_HEIGHT > 0);

// 4. A page-mode event is still one step — never a jump proportional to size.
assert.deepEqual(play([at(0, 1, 2)], 800), { net: 1, fired: 1 });

/* ------------------------------------------- trackpad: one per gesture, ever */

// 5. THE FIX. One swipe is one photograph however hard it was thrown — 30+
//    events and hundreds of pixels of travel still advance exactly one.
for (const peak of [6, 15, 40, 90, 160, 400]) {
  const trace = swipe(0, peak);
  assert.deepEqual(
    play(trace),
    { net: 1, fired: 1 },
    `a swipe peaking at ${peak}px must be exactly one step, not ${play(trace).net}`
  );
}

// 6. DISTANCE INDEPENDENCE, stated directly: a feather-light swipe and a
//    violent one are worth the same.
assert.equal(play(swipe(0, 8)).net, play(swipe(0, 400)).net);

// 7. Backward swipes mirror exactly.
assert.deepEqual(play(swipe(0, 120, -1)), { net: -1, fired: 1 });

// 8. Two separate swipes are two steps — the lock must release, not latch.
const first = swipe(0, 120);
const second = swipe(endOf(first) + APART, 120);
assert.deepEqual(play([...first, ...second]), { net: 2, fired: 2 });

// 9. Ten deliberate swipes are ten photographs, and no drift accumulates.
const many: Ev[] = [];
let cursor = 0;
for (let i = 0; i < 10; i++) {
  const s = swipe(cursor, 100);
  many.push(...s);
  cursor = endOf(s) + APART;
}
assert.deepEqual(play(many), { net: 10, fired: 10 });

/* ------------------------------- VIGOROUS scrolling: still exactly one step */

// 9a. THE REPORTED GLITCH. A hard, jittery flick must be exactly one step —
//     across a wide range of strengths and 40 different jitter patterns each.
//     Gentle swipes always worked; these are the ones that double-fired.
for (const peak of [60, 120, 250, 500, 900]) {
  for (let seed = 1; seed <= 40; seed++) {
    const trace = vigorousSwipe(0, peak, seed);
    const result = play(trace);
    assert.deepEqual(
      result,
      { net: 1, fired: 1 },
      `vigorous swipe peak=${peak} seed=${seed} fired ${result.fired} times, expected 1`
    );
  }
}

// 9b. Vigorous swipes in sequence stay one-for-one — no accumulated drift.
const hard: Ev[] = [];
let hardCursor = 0;
for (let i = 0; i < 12; i++) {
  const s = vigorousSwipe(hardCursor, 400, i + 100);
  hard.push(...s);
  hardCursor = endOf(s) + APART;
}
assert.deepEqual(play(hard), { net: 12, fired: 12 });

// 9c. A MAIN-THREAD STALL mid-gesture is not a gesture boundary. A hard flick
//     drives enough rendering to freeze the page for over 100ms, and reading
//     that pause as "the swipe ended" is the second way one scroll became two.
for (const stall of [80, 120, 180, 240]) {
  const trace = vigorousSwipe(0, 400, 7);
  const cut = 14; // partway through, while inertia is still large
  const stalled = [
    ...trace.slice(0, cut),
    ...trace.slice(cut).map((e) => ({ ...e, timeStamp: e.timeStamp + stall })),
  ];
  assert.deepEqual(
    play(stalled),
    { net: 1, fired: 1 },
    `a ${stall}ms stall mid-swipe must not split the gesture`
  );
}

// 9d. Backward vigorous swipes mirror, and a hard forward/backward pair nets 0.
assert.deepEqual(play(vigorousSwipe(0, 500, 3, -1)), { net: -1, fired: 1 });
const fwd = vigorousSwipe(0, 500, 4);
const rev = vigorousSwipe(endOf(fwd) + APART, 500, 5, -1);
assert.deepEqual(play([...fwd, ...rev]), { net: 0, fired: 2 });

/* --------------------------------------------------- responsiveness + intent */

// 10. Pushing again DURING the inertia tail must register immediately. Without
//     the surge rule the user would be locked out for the whole tail, which is
//     what makes a gesture lock feel broken.
const tail = swipe(0, 200);
const interrupt = tail.slice(0, 20); // cut in while inertia is still running
const repush = swipe(endOf(interrupt) + 16, 200);
assert.deepEqual(play([...interrupt, ...repush]), { net: 2, fired: 2 });

// 11. Reversing mid-inertia registers, and registers the NEW direction.
const back = swipe(endOf(interrupt) + 16, 200, -1);
const reversal = play([...interrupt, ...back]);
assert.equal(reversal.fired, 2);
assert.equal(reversal.net, 0, 'one forward then one back returns to where it started');

// 12. An inertia tail on its own never earns a second step, however long it
//     runs — the tail is the single biggest source of phantom advances.
assert.deepEqual(play(swipe(0, 300, 1, 6, 120)), { net: 1, fired: 1 });

// 13. Sub-pixel dust is inert, and must not hold the gesture open: dust, then a
//     real swipe after a quiet gap, is one step — the dust neither fires nor
//     blocks.
const dust = Array.from({ length: 30 }, (_, i) => at(i * 16, 0.4));
assert.deepEqual(play(dust), { net: 0, fired: 0 });
assert.deepEqual(play([...dust, ...swipe(endOf(dust) + APART, 100)]), { net: 1, fired: 1 });

// 14. Zero deltas are inert.
assert.deepEqual(play([at(0, 0), at(16, 0)]), { net: 0, fired: 0 });

/* ------------------------------------------------------- touch reuse (mobile) */

// 15. The core is input-agnostic, which is the whole point of splitting it out:
//     a touch handler feeds it a swipe's dy on the same terms and gets the same
//     one-step-per-gesture contract, with touchend supplying the quiet gap.
const touch = createGestureStepper();
const swipeUp = [12, 40, 80, 120, 150].map((dy, i) => touch(dy, 1, i * 16));
assert.equal(
  swipeUp.reduce<number>((a, b) => a + b, 0),
  1,
  'a touch drag of any length is one step'
);
const swipeDown = [30, 90, 140].map((dy, i) => touch(dy, -1, 200 + i * 16));
assert.equal(
  swipeDown.reduce<number>((a, b) => a + b, 0),
  -1,
  'the next swipe goes the other way'
);

console.log('gestureStepper.check.ts: all assertions passed (mouse, trackpad, touch)');
