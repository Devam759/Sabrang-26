// Pure carousel math. No R3F imports — unit-testable.
import {
  CURVE_THETA_MAX,
  RADIUS,
  WAVE_AMPLITUDE,
  WAVE_LENGTH,
} from './constants';

// Shortest signed distance across n items, wrapped into [-n/2, n/2).
// This is what makes the last→first wrap invisible: we never reset position,
// every frame just re-derives its relative slot each tick.
export function wrapRelative(delta: number, n: number): number {
  return ((((delta + n / 2) % n) + n) % n) - n / 2;
}

export function getActiveIndex(position: number, n: number): number {
  return ((Math.round(position) % n) + n) % n;
}

// Frame-rate independent exponential approach: after 1/lambda seconds the
// remaining distance has decayed to 1/e regardless of tick rate.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export interface CurveSample {
  px: number; py: number; pz: number; // point on the film path
  tx: number; ty: number; tz: number; // unit tangent (film travel direction)
}

/**
 * The film path, parameterised by ARC LENGTH `s` (world units along the film).
 *
 * Shape: a circular arc through the hero region that hands off — C¹
 * continuous — to a straight tangent line once the heading reaches
 * CURVE_THETA_MAX. So the strip curves toward the camera in the middle and
 * then runs off straight into the distance instead of closing into a loop.
 * A gentle sine in Y gives the wave. Both tails recede forever, which is what
 * lets them read as background rather than as the back of a cylinder.
 *
 * Two properties make this safe to build geometry from:
 *   1. Near-unit speed. |dP/ds| = 1 in XZ; the Y wave perturbs it by up to
 *      ~2% (bounded in filmCurve.check.ts §1), which reads as a slight
 *      content stretch on the steep sections, never as a seam gap.
 *   2. It is a pure function of `s`. Adjacent frames evaluate their shared
 *      edge at the same `s` and therefore land on the exact same point, so
 *      seams are exact by construction at any curvature.
 */
export function sampleFilmCurve(s: number, out: CurveSample): CurveSample {
  // clamp() is the whole arc→line handoff: inside the arc the clamp is
  // inert and this reduces to the plain circle; past it the heading freezes
  // and the remaining arc length extrudes along the frozen tangent.
  const ang = Math.min(CURVE_THETA_MAX, Math.max(-CURVE_THETA_MAX, s / RADIUS));
  const arcS = ang * RADIUS;
  const cx = RADIUS * Math.sin(ang);
  const cz = RADIUS * Math.cos(ang) - RADIUS;
  const tx = Math.cos(ang);
  const tz = -Math.sin(ang);
  const run = s - arcS; // 0 inside the arc

  out.px = cx + run * tx;
  out.py = WAVE_AMPLITUDE * Math.sin(s / WAVE_LENGTH);
  out.pz = cz + run * tz;

  const ty = (WAVE_AMPLITUDE / WAVE_LENGTH) * Math.cos(s / WAVE_LENGTH);
  const inv = 1 / Math.hypot(tx, ty, tz);
  out.tx = tx * inv;
  out.ty = ty * inv;
  out.tz = tz * inv;
  return out;
}
