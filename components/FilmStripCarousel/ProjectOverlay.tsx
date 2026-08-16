import { useEffect, useRef, useState } from 'react';
import { FlippingWordSwap } from '@/components/ui/FlippingWordSwap';
import { damp } from './carouselMath';
import { MAX_VELOCITY } from './constants';
import type { Project } from './types';

interface ProjectOverlayProps {
  project: Project;
  onSelect: (project: Project) => void;
  reducedMotion: boolean;
  sim: { position: number; velocity: number };
  expandRef: React.MutableRefObject<{ p: number }>;
}

/**
 * Title + subtitle, cross-fading with a blur when the active project changes,
 * and — the part that matters — physically coupled to the strip.
 *
 * The headline sits on its own plane in the composition and inherits the
 * carousel's angular velocity: while the strip turns, the plane rotates in
 * perspective (one end nearer and larger, the other further and smaller),
 * blurs, and then counter-rotates back to level as the motion decays. It is a
 * sign bolted to the rotating assembly, not a label that crossfades.
 *
 * Behind it, an oversized ghost of the same title occupies a much deeper
 * plane at a fraction of the parallax — background typography, so the title
 * reads as being *in* the environment rather than on top of it.
 *
 * Driven from a rAF loop reading the simulation refs directly: the transform
 * changes every frame and must never become React state.
 */
export default function ProjectOverlay({
  project,
  onSelect,
  reducedMotion,
  sim,
  expandRef,
}: ProjectOverlayProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const box = boxRef.current;
    const ghost = ghostRef.current;
    if (!box || !ghost) return;

    // Softer than the strip's own damping, so the headline visibly trails it.
    const TILT_LAMBDA = 5.5;
    let tilt = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const v = Math.max(-1, Math.min(1, sim.velocity / MAX_VELOCITY));
      tilt = damp(tilt, v, TILT_LAMBDA, dt);
      const mag = Math.abs(tilt);
      const p = expandRef.current.p;

      box.style.transform =
        `perspective(1100px) translate3d(${-tilt * 26}px, ${mag * 10 - p * 40}px, ${-mag * 90 - p * 220}px)` +
        ` rotateY(${tilt * 15}deg) rotateZ(${tilt * 2.4}deg)`;
      box.style.filter = `blur(${mag * 5 + p * 8}px)`;
      box.style.opacity = `${(1 - p) * (1 - mag * 0.35)}`;

      // ~0.12 parallax: far enough back that it barely answers the motion
      ghost.style.transform =
        `translate3d(${-tilt * 26 * 0.12}px, ${-p * 12}px, 0) scale(${1 + mag * 0.012})`;
      ghost.style.opacity = `${(1 - p) * (0.05 + mag * 0.03)}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, sim, expandRef]);

  // The heading is the one thing here that must not crossfade. It flips,
  // character by character, from the item leaving the centre to the one
  // arriving — so the title reads as the same object being re-lettered rather
  // than as two labels dissolving into each other.
  //
  // `armed` exists because the flip has to start from the outgoing word: the
  // pair is rendered at rest for one frame, then armed on the next, which is
  // what gives GSAP something to animate away from.
  const [swap, setSwap] = useState({ from: project.title, to: project.title });
  const [armed, setArmed] = useState(false);
  const shown = useRef(project.title);

  useEffect(() => {
    if (shown.current === project.title) return;
    setSwap({ from: shown.current, to: project.title });
    setArmed(false);
    shown.current = project.title;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [project.title]);

  return (
    <>
      <div className="fsc-ghost-title" ref={ghostRef} aria-hidden="true">
        {project.title}
      </div>

      <div className="fsc-titlebox" ref={boxRef} aria-live="polite">
        <div className="fsc-titlegroup">
          {/* The headline IS the menu item: it flips to the next item's name as
              the strip turns, and clicking it navigates. Keyed on the pair so a
              new swap rebuilds the timeline instead of animating stale
              characters. */}
          <h2 className="fsc-title">
            <FlippingWordSwap
              key={`${swap.from}→${swap.to}`}
              word1={swap.from}
              word2={swap.to}
              swapped={armed}
<<<<<<< HEAD
              duration={350}
              stagger={25}
=======
              duration={160}
              stagger={10}
>>>>>>> 968839f771d847688d4fe2b18f6c13b8f23dcca6
              className="fsc-title-flip"
              ariaLabel={`Go to ${project.title}`}
              onClick={() => onSelect(project)}
            />
          </h2>
        </div>

        <div id="text-overlay-placeholder" />
      </div>
    </>
  );
}
