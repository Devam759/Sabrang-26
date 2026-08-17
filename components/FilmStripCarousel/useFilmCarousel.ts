// All interaction state lives in refs — no React state during a drag.
// React state is only activeIndex, pushed when the integer actually changes.
import { useCallback, useRef, useState } from 'react';
import { getActiveIndex, glideDistance, glideVelocity, wrapRelative } from './carouselMath';
import {
  FLICK_VELOCITY,
  MAX_VELOCITY,
  MOMENTUM_DECAY,
  MOMENTUM_HANDOFF,
  SNAP_DAMPING,
  SNAP_STIFFNESS,
} from './constants';

const clampVelocity = (v: number) => Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v));

interface SimState {
  position: number; // continuous float — the whole engine
  target: number;
  velocity: number; // units per 60fps-frame
  mode: 'snap' | 'drag' | 'momentum';
  pointerId: number; // the pointer that owns the current drag; -1 when idle
  dragStartPos: number;
  dragStartX: number;
  lastX: number;
  lastT: number;
  dragged: boolean; // true once pointer moved enough to suppress the click
}

export function useFilmCarousel(
  count: number,
  sensitivity: number,
  reducedMotion: boolean
) {
  const sim = useRef<SimState>({
    position: 0,
    target: 0,
    velocity: 0,
    mode: 'snap',
    pointerId: -1,
    dragStartPos: 0,
    dragStartX: 0,
    lastX: 0,
    lastT: 0,
    dragged: false,
  }).current;
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const opts = useRef({ count, sensitivity, reducedMotion });
  opts.current = { count, sensitivity, reducedMotion };

  // Integrator, called from the R3F useFrame loop. Mutates refs only.
  const step = useCallback(
    (dt: number) => {
      const s = sim;
      const f = Math.min(dt, 0.05) * 60; // frame-rate normalised
      if (s.mode === 'momentum') {
        s.velocity = clampVelocity(s.velocity);
        s.position += s.velocity * f;
        s.velocity *= Math.pow(MOMENTUM_DECAY, f);
        if (Math.abs(s.velocity) < MOMENTUM_HANDOFF) {
          s.target = Math.round(s.position);
          s.mode = 'snap';
        }
      } else if (s.mode === 'snap') {
        const k = opts.current.reducedMotion ? 0.3 : SNAP_STIFFNESS;
        const d = opts.current.reducedMotion ? 0.5 : SNAP_DAMPING;
        s.velocity += (s.target - s.position) * k * f;
        s.velocity *= Math.pow(d, f);
        s.position += s.velocity * f;
        if (
          Math.abs(s.target - s.position) < 0.0005 &&
          Math.abs(s.velocity) < 0.0005
        ) {
          s.position = s.target;
          s.velocity = 0;
        }
      }
      const targetPos = s.mode === 'snap' ? s.target : s.position;
      const ai = getActiveIndex(targetPos, opts.current.count);
      if (ai !== activeRef.current) {
        activeRef.current = ai;
        setActiveIndex(ai);
      }
    },
    [sim]
  );

  // A new pointer-down cancels any in-flight snap/momentum immediately.
  //
  // Deliberately does NOT capture the pointer here. R3F binds its listeners to
  // the div it renders inside this wrapper, and a capture on the wrapper
  // retargets every later pointer event to the wrapper itself — taking that div
  // out of the event path, so the scene never sees pointerup and no frame click
  // can ever fire. Capture is taken in onPointerMove instead, at the moment the
  // press becomes a drag (see below): a click keeps the normal event path, a
  // drag still tracks outside the element.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      sim.mode = 'drag';
      sim.pointerId = e.pointerId;
      sim.dragStartPos = sim.position;
      sim.dragStartX = e.clientX;
      sim.lastX = e.clientX;
      sim.lastT = performance.now();
      sim.velocity = 0;
      sim.dragged = false;
      e.currentTarget.style.cursor = 'grabbing';
    },
    [sim]
  );

  // A drag belongs to exactly ONE pointer, and only that pointer may move it.
  //
  // Without the id check, any pointermove reaching this element steers the strip
  // and can reach setPointerCapture() below. A second finger therefore hijacks a
  // drag the first one started, jumping the strip to its own clientX. It also
  // guards the capture call: a constructed PointerEvent carries pointerId 0,
  // which belongs to no live pointer, so capturing it throws NotFoundError and
  // takes the whole menu down — the site's idle cursor effect used to dispatch
  // exactly that before TubesCursor was scoped to its own canvas.
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (sim.mode !== 'drag' || e.pointerId !== sim.pointerId) return;
      const now = performance.now();
      const dx = e.clientX - sim.lastX;
      const dtMs = now - sim.lastT;
      // pixel delta → carousel units against viewport width: 1:1 under pointer
      const deltaUnits = (-dx * opts.current.sensitivity) / Math.max(300, window.innerWidth);
      sim.position += deltaUnits;
      if (dtMs > 0) {
        // velocity from pointer-time delta, lightly smoothed
        const v = (deltaUnits / dtMs) * (1000 / 60);
        sim.velocity = sim.velocity * 0.2 + v * 0.8;
      }
      sim.lastX = e.clientX;
      sim.lastT = now;
      if (Math.abs(e.clientX - sim.dragStartX) > 3 && !sim.dragged) {
        sim.dragged = true;
        // Now that this is a drag and not a click, take the pointer so the
        // gesture survives leaving the element. Doing it here rather than on
        // pointerdown is what keeps frame clicks working (see onPointerDown).
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [sim]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (sim.mode !== 'drag' || e.pointerId !== sim.pointerId) return;
      sim.pointerId = -1;
      e.currentTarget.style.cursor = 'grab';
      if (!opts.current.reducedMotion && Math.abs(sim.velocity) > FLICK_VELOCITY) {
        sim.velocity = clampVelocity(sim.velocity);
        sim.mode = 'momentum';
      } else {
        sim.target = Math.round(sim.position);
        sim.velocity = 0;
        sim.mode = 'snap';
      }
    },
    [sim]
  );

  // Wheel input rides the momentum glide, same as a drag release — the inertia
  // is the point. What changed is where it aims: rather than adding a fixed
  // velocity per event, this solves for the velocity that brings the glide to
  // rest exactly `steps` frames past wherever it was already going to stop.
  //
  // A momentum glide from velocity v covers v / (1 - MOMENTUM_DECAY) before it
  // hands off to the snap spring, so that sum inverts cleanly. Aiming at a
  // landing point instead of piling on velocity is what removes the two bugs:
  // travel no longer depends on how many events a browser split one notch into,
  // nor on how much of the previous notch's momentum had yet to decay.
  const glideBy = useCallback(
    (steps: number) => {
      const s = sim;
      if (s.mode === 'drag' || steps === 0) return;

      if (opts.current.reducedMotion) {
        const base = s.mode === 'snap' ? s.target : s.position;
        s.target = Math.round(base) + steps;
        s.mode = 'snap';
        return;
      }

      // Where the reel comes to rest if nothing else touches it.
      const rest =
        s.mode === 'momentum'
          ? s.position + glideDistance(s.velocity)
          : s.mode === 'snap'
            ? s.target
            : s.position;

      // Clamping only shortens the lookahead on a frantic scroll; the glide
      // still ends on a whole frame, and the next event re-aims from there.
      s.velocity = clampVelocity(glideVelocity(s.position, rest, steps));
      s.mode = 'momentum';
    },
    [sim]
  );

  const goToNearest = useCallback(
    (index: number) => {
      const s = sim;
      s.target = Math.round(s.position + wrapRelative(index - s.position, opts.current.count));
      s.mode = 'snap';
    },
    [sim]
  );

  // Advance exactly one frame. Chaining off `target` rather than `position`
  // while snapping is what makes repeated calls additive instead of racing the
  // spring — two fast wheel notches land two frames along, never one or three.
  const shift = useCallback(
    (dir: 1 | -1) => {
      if (sim.mode === 'drag') return;
      const base = sim.mode === 'snap' ? sim.target : sim.position;
      sim.target = Math.round(base) + dir;
      sim.mode = 'snap';
    },
    [sim]
  );

  return {
    sim,
    step,
    activeIndex,
    activeRef,
    goToNearest,
    glideBy,
    next: useCallback(() => shift(1), [shift]),
    prev: useCallback(() => shift(-1), [shift]),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
