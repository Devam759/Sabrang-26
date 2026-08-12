'use client';

// Root: DOM overlay + Canvas host. Public API (unchanged):
//   projects              — dynamic count, no geometry assumes 11
//   loading               — swaps the pagination row for an inline loading state
//   onProjectSelect       — fired when the cinematic expansion completes (or
//                           immediately under prefers-reduced-motion)
//   onActiveProjectChange — fired when the centred project changes
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  ChromaticAberration,
  Bloom,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import type { ChromaticAberrationEffect } from 'postprocessing';
import FilmStrip, { type ExpandState } from './FilmStrip';
import Environment from './Environment';
import CarouselCamera from './CarouselCamera';
import CarouselControls from './CarouselControls';
import Pagination from './Pagination';
import ProjectOverlay from './ProjectOverlay';
import FilmTransition, { type TransitionHandle } from './FilmTransition';
import { useFilmCarousel } from './useFilmCarousel';
import { wrapRelative } from './carouselMath';
import {
  BREAKPOINTS,
  PANEL_LIGHT_DIR,
  TRANSITION_JUMP_MIN,
  WHEEL_SENSITIVITY,
  type BreakpointName,
} from './constants';
import type { Project } from './types';
import './styles.css';

function useBreakpoint(): BreakpointName {
  const [bp, setBp] = useState<BreakpointName>('desktop');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const compute = () =>
      setBp(window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1200 ? 'tablet' : 'desktop');
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(compute, 150);
    };
    compute();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return bp;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Grade, in pipeline order: bloom → chromatic aberration → vignette → grain.
//
// Everything here is deliberately under-driven. The scene should read as
// premium-cinematic, which comes from the lighting and depth doing the work —
// post is the last 10%, and each of these is destructive if pushed. Bloom in
// particular is thresholded high enough that only genuine speculars glow;
// mid-tones must not smear or the film loses its edges.
//
// Mobile drops bloom and grain: both are full-resolution passes and the
// mobile budget is better spent on the strip's own shading.
function EffectsRig({
  expandRef,
  mobile,
  sim,
  transitionRef,
  reducedMotion,
}: {
  expandRef: React.MutableRefObject<ExpandState>;
  mobile: boolean;
  sim: { velocity: number };
  transitionRef: React.MutableRefObject<TransitionHandle | null>;
  reducedMotion: boolean;
}) {
  const caRef = useRef<ChromaticAberrationEffect>(null);
  useFrame(() => {
    const p = expandRef.current.p;
    caRef.current?.offset.set(0.0012 * (1 + 2.5 * p), 0.0008 * (1 + 2.5 * p));
  });
  return (
    <EffectComposer>
      {/* First in the chain: lens distortion + previous-scene blend happen to
          the raw scene, then bloom/CA/vignette/grain grade the result. */}
      <FilmTransition sim={sim} handleRef={transitionRef} reducedMotion={reducedMotion} />
      {/* `&&` rather than a fragment: EffectComposer walks its children to
          build the pass chain, and React.Children.toArray drops `false` but
          keeps an empty fragment. */}
      {!mobile && (
        <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.28} intensity={0.5} mipmapBlur />
      )}
      <ChromaticAberration
        ref={caRef}
        offset={[0.0012, 0.0008]}
        // upstream d.ts drops the constructor props (Partial<T | undefined>),
        // so radial modulation has to go past the type checker
        {...({ radialModulation: true, modulationOffset: 0.15 } as Record<string, unknown>)}
      />
      <Vignette offset={0.28} darkness={0.72} eskil={false} />
      {/* premultiplied so grain rides the image instead of lifting the blacks —
          the difference between "film stock" and "noisy render" */}
      {!mobile && <Noise premultiply opacity={0.18} />}
    </EffectComposer>
  );
}

export interface FilmStripCarouselProps {
  projects: Project[];
  loading?: boolean;
  onProjectSelect?: (project: Project) => void;
  onActiveProjectChange?: (index: number, project: Project) => void;
}

export default function FilmStripCarousel({
  projects,
  loading = false,
  onProjectSelect,
  onActiveProjectChange,
}: FilmStripCarouselProps) {
  const bpName = useBreakpoint();
  const bp = BREAKPOINTS[bpName];
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  const {
    sim,
    step,
    activeIndex,
    activeRef,
    goToNearest,
    nudgeVelocity,
    next,
    prev,
    handlers,
  } = useFilmCarousel(projects.length, bp.sensitivity, reducedMotion);

  const expandRef = useRef<ExpandState>({ index: null, last: -1, p: 0, fired: false });
  // Scene-transition rig: capture() snapshots the outgoing reel scene into a
  // render target the instant a scene change starts (see FilmTransition).
  const transitionRef = useRef<TransitionHandle | null>(null);
  // Entrance progress, owned here because the strip drives it but the
  // environment and the headline both have to read it.
  const introRef = useRef(0);
  // set by a frame's raycasted click so the wrapper's bubbled click can tell
  // "clicked a frame" from "clicked away" (which cancels the expansion)
  const frameClickFlag = useRef(false);
  // A frame clicked while off-centre: it is sent to the centre first and
  // expands on arrival. This is what makes the strip behave like a menu — one
  // click on any item opens it — instead of requiring a click to centre and a
  // second to open.
  const pendingRef = useRef<number | null>(null);

  const cancelExpand = useCallback(() => {
    expandRef.current.index = null;
    pendingRef.current = null;
  }, []);

  const activeProject = projects[activeIndex];

  useEffect(() => {
    onActiveProjectChange?.(activeIndex, projects[activeIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const selectProject = useCallback(
    (project: Project) => onProjectSelect?.(project),
    [onProjectSelect]
  );

  const onExpandComplete = useCallback(
    (index: number) => selectProject(projects[index]),
    [selectProject, projects]
  );

  const beginExpand = useCallback((index: number) => {
    // snapshot the pre-expansion scene first: the old state departs in the
    // compositor while the expansion animates the new one underneath
    transitionRef.current?.capture();
    const ex = expandRef.current;
    ex.index = index;
    ex.last = index;
    ex.fired = false;
  }, []);

  // Multi-frame jumps (pagination, clicking a distant frame) blend scenes;
  // a one-frame advance already animates continuously and needs no capture.
  const goToCinematic = useCallback(
    (index: number) => {
      if (Math.abs(wrapRelative(index - sim.position, projects.length)) >= TRANSITION_JUMP_MIN) {
        transitionRef.current?.capture();
      }
      goToNearest(index);
    },
    [goToNearest, sim, projects.length]
  );

  const onFrameClick = useCallback(
    (index: number) => {
      frameClickFlag.current = true;
      if (sim.dragged) return;
      const ex = expandRef.current;
      if (ex.index !== null) return; // already expanding — wrapper handles cancel
      if (reducedMotion) {
        // no cinematic sequence to run: centre it and navigate outright
        goToNearest(index);
        selectProject(projects[index]);
        return;
      }
      if (index === activeRef.current) {
        beginExpand(index);
      } else {
        // off-centre: travel there first, then expand on arrival
        goToCinematic(index);
        pendingRef.current = index;
      }
    },
    [sim, activeRef, reducedMotion, selectProject, projects, goToNearest, goToCinematic, beginExpand]
  );

  // Arms the queued expansion once the clicked frame has actually reached the
  // centre. activeIndex only changes when the rounded position does, so this
  // fires on arrival rather than on a timer — a slow drag and a fast flick
  // both hand off correctly. Any fresh input clears the queue via cancelExpand.
  useEffect(() => {
    if (pendingRef.current === null || pendingRef.current !== activeIndex) return;
    pendingRef.current = null;
    beginExpand(activeIndex);
  }, [activeIndex, beginExpand]);

  // interruption: clicking away (not on a frame) or dragging reverses the
  // expansion from wherever it currently is
  const onWrapClick = useCallback(() => {
    if (frameClickFlag.current) {
      frameClickFlag.current = false;
      return;
    }
    if (expandRef.current.index !== null) cancelExpand();
  }, [cancelExpand]);

  const onWrapPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerMove(e);
      if (sim.dragged && expandRef.current.index !== null) cancelExpand();
    },
    [handlers, sim, cancelExpand]
  );

  // wheel + trackpad: native listener because React registers wheel as
  // passive, and we must preventDefault to keep the page still
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (expandRef.current.index !== null) cancelExpand();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      nudgeVelocity(d * WHEEL_SENSITIVITY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [nudgeVelocity, cancelExpand]);

  const prevAndCancel = useCallback(() => { cancelExpand(); prev(); }, [cancelExpand, prev]);
  const nextAndCancel = useCallback(() => { cancelExpand(); next(); }, [cancelExpand, next]);
  const goToAndCancel = useCallback(
    (i: number) => { cancelExpand(); goToCinematic(i); },
    [cancelExpand, goToCinematic]
  );

  return (
    <section className="fsc-section">
      <div
        ref={wrapRef}
        className="fsc-canvas"
        {...handlers}
        onPointerMove={onWrapPointerMove}
        onClick={onWrapClick}
      >
        {/* antialias off: EffectComposer renders into its own (multisampled)
            buffer, so default-framebuffer MSAA is paid but never seen. DPR
            capped at 1.5 — the post chain runs full-resolution passes, and 2x
            on a retina laptop is what made the menu stutter. */}
        <Canvas
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, bp.cameraZ], fov: bp.fov }}
        >
          <CarouselCamera
            z={bp.cameraZ}
            fov={bp.fov}
            sim={sim}
            expandRef={expandRef}
            reducedMotion={reducedMotion}
          />
          {/* Lighting hierarchy: a violet-tinted ambient that ties the film to
              the environment's base tone, a warm key near the camera axis
              (uLightDir in the panel shader matches this direction), and a
              magenta rim from behind-left so the sprocket rails catch an edge
              and the strip reads as having a lit silhouette. */}
          <ambientLight color="#6b4b9e" intensity={0.55} />
          <directionalLight position={PANEL_LIGHT_DIR} intensity={2.0} color="#fff4e6" />
          <directionalLight position={[-4, 1.2, -3]} intensity={0.9} color="#ff2a8d" />
          <Environment
            sim={sim}
            expandRef={expandRef}
            introRef={introRef}
            cameraZ={bp.cameraZ}
            fov={bp.fov}
          />
          <Suspense fallback={null}>
            <FilmStrip
              projects={projects}
              sim={sim}
              step={step}
              activeRef={activeRef}
              bp={bp}
              reducedMotion={reducedMotion}
              expandRef={expandRef}
              introRef={introRef}
              onExpandComplete={onExpandComplete}
              onFrameClick={onFrameClick}
            />
          </Suspense>
          <EffectsRig
            expandRef={expandRef}
            mobile={bpName === 'mobile'}
            sim={sim}
            transitionRef={transitionRef}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>

      <ProjectOverlay
        project={activeProject}
        onSelect={selectProject}
        reducedMotion={reducedMotion}
        sim={sim}
        expandRef={expandRef}
      />
      <CarouselControls onPrev={prevAndCancel} onNext={nextAndCancel} />
      <Pagination
        count={projects.length}
        activeIndex={activeIndex}
        loading={loading}
        onSelect={goToAndCancel}
      />
    </section>
  );
}
