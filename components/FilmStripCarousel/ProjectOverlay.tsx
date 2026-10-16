import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { damp } from './carouselMath';
import { MAX_VELOCITY } from './constants';
import type { Project } from './types';

const graphemeSegmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function segmentCharacters(text: string) {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

interface CarouselFlippingTitleProps {
  title: string;
  onClick: () => void;
  reducedMotion?: boolean;
}

function CarouselFlippingTitle({ title, onClick, reducedMotion }: CarouselFlippingTitleProps) {
  const [pair, setPair] = useState<{ from: string; to: string; animating: boolean }>({
    from: title,
    to: title,
    animating: false,
  });
  const prevTitleRef = useRef(title);
  const containerRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (prevTitleRef.current === title) return;
    const oldTitle = prevTitleRef.current;
    prevTitleRef.current = title;

    if (reducedMotion) {
      setPair({ from: title, to: title, animating: false });
      return;
    }

    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    setPair({ from: oldTitle, to: title, animating: true });
  }, [title, reducedMotion]);

  useEffect(() => {
    if (!pair.animating || pair.from === pair.to) return;
    const container = containerRef.current;
    if (!container) return;

    const fromEls = container.querySelectorAll<HTMLElement>('[data-flip="from"]');
    const toEls = container.querySelectorAll<HTMLElement>('[data-flip="to"]');

    gsap.set(fromEls, {
      rotationX: 0,
      opacity: 1,
      transformOrigin: 'center top',
    });
    gsap.set(toEls, {
      rotationX: -80,
      opacity: 0,
      transformOrigin: 'center bottom',
    });

    const duration = 0.35;
    const stagger = 0.032;

    const tl = gsap.timeline({
      onComplete: () => {
        setPair({ from: pair.to, to: pair.to, animating: false });
      },
    });

    tl.to(fromEls, {
      rotationX: 80,
      opacity: 0,
      duration,
      stagger,
      ease: 'power2.in',
    }).to(
      toEls,
      {
        rotationX: 0,
        opacity: 1,
        duration,
        stagger,
        ease: 'power2.out',
      },
      `<${duration * 0.45}`,
    );

    tlRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [pair.from, pair.to, pair.animating]);

  return (
    <button
      ref={containerRef}
      type="button"
      className="fsc-title-flip relative inline-grid cursor-pointer select-none border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit]"
      aria-label={`Go to ${title}`}
      onClick={onClick}
    >
      <span className="col-start-1 row-start-1 inline-grid overflow-visible py-[0.06em] [perspective:800px]">
        {pair.animating && pair.from !== pair.to ? (
          <>
            <span
              className="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre"
              aria-hidden="true"
            >
              {segmentCharacters(pair.from).map((char, i) => (
                <span
                  key={`from-${i}-${char}`}
                  data-flip="from"
                  className="inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity]"
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
            <span
              className="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre"
              aria-hidden="true"
            >
              {segmentCharacters(pair.to).map((char, i) => (
                <span
                  key={`to-${i}-${char}`}
                  data-flip="to"
                  className="inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity]"
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
          </>
        ) : (
          <span className="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre">
            {segmentCharacters(title).map((char, i) => (
              <span key={`char-${i}-${char}`} className="inline-block whitespace-pre">
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

interface ProjectOverlayProps {
  project: Project;
  onSelect: (project: Project) => void;
  reducedMotion: boolean;
  sim: { position: number; velocity: number };
  expandRef: React.MutableRefObject<{ p: number }>;
}

/**
 * Title + subtitle, cross-fading with a blur when the active project changes,
 * and - the part that matters - physically coupled to the strip.
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

  return (
    <>
      <div className="fsc-ghost-title" ref={ghostRef} aria-hidden="true">
        {project.title}
      </div>

      <div className="fsc-titlebox" ref={boxRef} aria-live="polite">
        <div className="fsc-titlegroup">
          <h2 className="fsc-title">
            <CarouselFlippingTitle
              title={project.title}
              onClick={() => onSelect(project)}
              reducedMotion={reducedMotion}
            />
          </h2>
        </div>

        <div id="text-overlay-placeholder" />
      </div>
    </>
  );
}
