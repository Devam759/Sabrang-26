// One step per GESTURE, regardless of how far the gesture travelled.
//
// This is the counterpart to lib/wheelStepper, which is proportional — a longer
// scroll there moves further, which is what the menu reel wants because it
// glides on momentum. An archive viewed one item at a time wants the opposite:
// a flick and a nudge should both advance exactly one, so the only thing that
// matters is that a gesture happened and which way it went.
//
// The hard part is knowing where a gesture ends. A mouse says so plainly: one
// notch is one isolated event. A trackpad does not — it emits a dense stream
// while the fingers move and then KEEPS emitting through inertia after they
// lift, so "distance travelled" and "number of events" are both meaningless as
// gesture boundaries. Three signals separate them:
//
//   1. A quiet gap. Trackpad events arrive every ~16ms while anything is
//      moving; consecutive mouse notches are far further apart. A gap is
//      therefore the primary boundary, and GESTURE_END_MS is the dial that
//      decides which side of it a given device falls on.
//   2. A surge after decay. Inertia only ever slows down, so a magnitude
//      climbing back up once the tail has started shrinking is the user
//      pushing again — that re-arms immediately instead of making them wait
//      out a long inertia tail.
//   3. A reversal. Turning around is always a new gesture.
//
// The core takes (magnitude, direction, timeStamp) rather than a wheel event,
// so a touch handler can drive it from a swipe's dy on exactly the same terms.

// --- Calibration ---------------------------------------------------------
// Hardware dials, not arbitrary constants. The values below are set by one
// observation: a gentle swipe produces a smooth magnitude curve, but a
// VIGOROUS one is jittery in both phases, and its inertia tail is long, large,
// and noisy. Every threshold here has to survive that noise, because anything
// comparing an event to the one immediately before it will read a jitter spike
// as a fresh gesture and fire a second time.
export const GESTURE_MIN_DELTA = 3; // below this is inertia dust, not intent

// Events closer together than this are a continuous stream — a trackpad, or its
// inertia. Mouse notches never arrive this fast.
export const STREAM_GAP_MS = 32;
// How long the input must be quiet to end a gesture. A stream needs a real
// pause: a hard swipe drives enough work to stall the main thread for well over
// 100ms, and a short window would read that stall as a gesture boundary and
// step twice. Isolated events (mouse notches) get the short window so brisk
// wheeling still counts every notch.
export const STREAM_END_MS = 260;
export const GESTURE_END_MS = 40;

// A tail only counts as decaying once it has fallen WELL below the gesture's
// peak. At 0.6 an ordinary mid-swipe dip tripped this, which armed the surge
// test while the user was still pushing.
export const GESTURE_DECAY = 0.35;
// A re-push is measured against the gesture's PEAK, never against the previous
// event. Inertia jitter routinely beats the previous event; it never climbs
// back to a large fraction of the peak it has already decayed away from.
export const GESTURE_SURGE = 0.6;
// Backstop. Whatever else happens, one flick cannot become two steps inside
// this window — deliberate repeat swipes are hundreds of ms apart.
export const MIN_FIRE_INTERVAL_MS = 120;

export const WHEEL_LINE_HEIGHT = 16; // Firefox reports deltaMode 1 (lines)

/** Direction of the step this input earned: -1, 0 or +1. Never more than one. */
export type GestureStepper = (
  magnitude: number,
  direction: number,
  timeStamp: number
) => -1 | 0 | 1;

export function createGestureStepper(): GestureStepper {
  let lastT = -Infinity;
  let firedT = -Infinity;
  let peakMag = 0;
  let lastDir = 0;
  let decaying = false;
  let streaming = false;
  let armed = true;

  return (magnitude, direction, timeStamp) => {
    // Dust is dropped before it can touch any state — in particular it must not
    // refresh lastT, or a long inertia tail would hold the gesture open well
    // after the reel has visibly stopped.
    if (direction === 0 || magnitude < GESTURE_MIN_DELTA) return 0;

    const gap = timeStamp - lastT;
    // A stream that is still running needs a real pause to be over; an isolated
    // event only needs a short one. This is what lets one rule serve a trackpad
    // and a mouse without mistaking a stall for the end of a swipe.
    const quiet = gap > (streaming ? STREAM_END_MS : GESTURE_END_MS);
    const reversed = lastDir !== 0 && direction !== lastDir;
    // Gated on `decaying` so it cannot fire during the gesture's own ramp-up,
    // and measured against the peak so tail jitter cannot fake it.
    const surge = decaying && magnitude > peakMag * GESTURE_SURGE;

    if (quiet || reversed || surge) {
      armed = true;
      peakMag = 0;
      decaying = false;
      streaming = false;
    }

    // Established after any reset, so a fresh gesture starts un-streamed and
    // becomes a stream only once its own events prove they arrive that fast.
    if (gap < STREAM_GAP_MS) streaming = true;

    if (magnitude > peakMag) {
      peakMag = magnitude;
      decaying = false;
    } else if (magnitude < peakMag * GESTURE_DECAY) {
      decaying = true;
    }

    lastT = timeStamp;
    lastDir = direction;

    if (!armed) return 0;
    // Backstop against anything above having misread one vigorous gesture as
    // two. Scoped to streams, which is the only place that ambiguity exists —
    // an isolated mouse notch is unambiguous, and applying this to it would cap
    // brisk wheeling at one step per interval. A reversal is exempt too:
    // turning around is always deliberate.
    if (streaming && !reversed && timeStamp - firedT < MIN_FIRE_INTERVAL_MS) return 0;

    armed = false;
    firedT = timeStamp;
    return direction > 0 ? 1 : -1;
  };
}

/** Wheel front-end: normalises the browser's delta units, then defers to the core. */
export function createWheelGesture(pageHeight = 800) {
  const stepper = createGestureStepper();
  return (e: { deltaX: number; deltaY: number; deltaMode: number; timeStamp: number }) => {
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const px = raw * (e.deltaMode === 1 ? WHEEL_LINE_HEIGHT : e.deltaMode === 2 ? pageHeight : 1);
    return stepper(Math.abs(px), Math.sign(px), e.timeStamp);
  };
}
