// Turns raw wheel events into whole steps, for anything advanced one item at a
// time by scrolling.
//
// Browsers disagree wildly on what one notch means — Chrome sends 100px,
// Firefox sends 3 lines, some setups send pages — and any of them may split one
// physical notch across several events. Trackpads make it worse: they emit a
// continuous stream of small deltas and then keep emitting during inertia, so
// heuristics tuned to a mouse wheel's discrete taps either stall or run away.
//
// Measuring the gesture in PIXELS and paying out whole notches handles both
// from one rule, with no burst detection and no cooldown: a mouse notch is one
// step because it is 100px, and a trackpad swipe is proportional to how far it
// actually travelled. The remainder carries so nothing is dropped, and a pause
// or reversal starts a fresh gesture so a leftover part-notch can never combine
// with the next one into a surprise double step.

export const WHEEL_STEP_PX = 100; // one mouse notch on Chrome/Edge/Safari
export const WHEEL_LINE_HEIGHT = 16; // Firefox reports deltaMode 1 (lines)
export const WHEEL_GESTURE_GAP = 400; // ms of quiet that ends a wheel gesture

/** Signed count of whole steps this event has earned; 0 for most events. */
export type WheelStepper = (e: {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  timeStamp: number;
}) => number;

export function createWheelStepper(pageHeight = 800): WheelStepper {
  let accum = 0;
  let lastT = -Infinity;

  return (e) => {
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (raw === 0) return 0;

    // Firefox reports lines, some setups report pages — normalise to pixels.
    const px = raw * (e.deltaMode === 1 ? WHEEL_LINE_HEIGHT : e.deltaMode === 2 ? pageHeight : 1);

    // A quiet gap or a direction change ends the gesture, so a leftover
    // part-notch can never combine with the next one into a surprise step.
    if (e.timeStamp - lastT > WHEEL_GESTURE_GAP || Math.sign(px) !== Math.sign(accum)) {
      accum = 0;
    }
    lastT = e.timeStamp;

    // Pay out every whole notch this event completed, not just one: a single
    // coarse event (a page-mode wheel, a hard trackpad flick) can be worth
    // several, and returning one would silently bin the rest.
    accum += px;
    const steps = Math.trunc(accum / WHEEL_STEP_PX);
    accum -= steps * WHEEL_STEP_PX;
    return steps;
  };
}
