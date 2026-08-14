// All interaction state lives in refs — no React state during a drag.
// React state is only activeIndex, pushed when the integer actually changes.
import { useCallback, useRef, useState } from 'react';
import { getActiveIndex, wrapRelative } from './carouselMath';
import {
  DRAG_CANCEL_FRACTION,
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
  dragStartPos: number;
  dragStartX: number;
  lastX: number;
  lastT: number;
  dragged: boolean; // true once pointer moved enough to suppress the click
  wheelAccum: number; // reduced-motion wheel accumulator
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
    dragStartPos: 0,
    dragStartX: 0,
    lastX: 0,
    lastT: 0,
    dragged: false,
    wheelAccum: 0,
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
      const ai = getActiveIndex(s.position, opts.current.count);
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

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (sim.mode !== 'drag') return;
      const now = performance.now();
      const dx = e.clientX - sim.lastX;
      const dtMs = now - sim.lastT;
      // pixel delta → carousel units against viewport width: 1:1 under pointer
      const deltaUnits = (-dx * opts.current.sensitivity) / window.innerWidth;
      sim.position += deltaUnits;
      if (dtMs > 0) {
        // velocity from pointer-time delta, lightly smoothed
        const v = (deltaUnits / dtMs) * (1000 / 60);
        sim.velocity = sim.velocity * 0.2 + v * 0.8;
      }
      sim.lastX = e.clientX;
      sim.lastT = now;
      if (Math.abs(e.clientX - sim.dragStartX) > 5 && !sim.dragged) {
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
      if (sim.mode !== 'drag') return;
      e.currentTarget.style.cursor = 'grab';
      const totalPx = e.clientX - sim.dragStartX;
      const start = Math.round(sim.dragStartPos);
      if (Math.abs(totalPx) < DRAG_CANCEL_FRACTION * window.innerWidth) {
        sim.target = start; // under threshold: return to current frame
        sim.velocity = 0;
        sim.mode = 'snap';
      } else if (
        !opts.current.reducedMotion &&
        Math.abs(sim.velocity) > FLICK_VELOCITY
      ) {
        sim.velocity = clampVelocity(sim.velocity);
        sim.mode = 'momentum'; // fast flick: keep integrating, snap later
      } else {
        // slow drag: advance at most one frame in the drag direction
        let t = Math.round(sim.position);
        if (t === start) t = start + Math.sign(sim.position - sim.dragStartPos);
        sim.target = Math.max(start - 1, Math.min(start + 1, t));
        sim.mode = 'snap';
      }
    },
    [sim]
  );

  // Wheel/trackpad input feeds the same velocity accumulator as drag release.
  // Reduced motion: accumulate deltas and step whole frames through the snap
  // spring instead of building inertia.
  const nudgeVelocity = useCallback(
    (dv: number) => {
      const s = sim;
      if (s.mode === 'drag') return;
      if (opts.current.reducedMotion) {
        s.wheelAccum += dv;
        if (Math.abs(s.wheelAccum) > 0.15) {
          const base = s.mode === 'snap' ? s.target : s.position;
          s.target = Math.round(base) + Math.sign(s.wheelAccum);
          s.mode = 'snap';
          s.wheelAccum = 0;
        }
        return;
      }
      s.velocity = clampVelocity(s.velocity + dv);
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

  const shift = useCallback(
    (dir: 1 | -1) => {
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
    nudgeVelocity,
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
