'use client';

// Root: DOM overlay + Canvas host. Public API:
//   projects              — dynamic count
//   loading               — swaps the pagination row for an inline loading state
//   onProjectSelect       — fired when the cinematic expansion completes
//   onActiveProjectChange — fired when the centred project changes
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import FilmStrip, { type ExpandState } from './FilmStrip';
import Environment from './Environment';
import CarouselCamera from './CarouselCamera';
import CarouselControls from './CarouselControls';
import Pagination from './Pagination';
import ProjectOverlay from './ProjectOverlay';
import { useFilmCarousel } from './useFilmCarousel';
import {
  BREAKPOINTS,
  PANEL_LIGHT_DIR,
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
  const introRef = useRef(0);
  const frameClickFlag = useRef(false);
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
    const ex = expandRef.current;
    ex.index = index;
    ex.last = index;
    ex.fired = false;
  }, []);

  const goToCinematic = useCallback(
    (index: number) => {
      goToNearest(index);
    },
    [goToNearest]
  );

  const onFrameClick = useCallback(
    (index: number) => {
      frameClickFlag.current = true;
      if (sim.dragged) return;
      const ex = expandRef.current;
      if (ex.index !== null) return;
      if (reducedMotion) {
        goToNearest(index);
        selectProject(projects[index]);
        return;
      }
      if (index === activeRef.current) {
        beginExpand(index);
      } else {
        goToCinematic(index);
        pendingRef.current = index;
      }
    },
    [sim, activeRef, reducedMotion, selectProject, projects, goToNearest, goToCinematic, beginExpand]
  );

  useEffect(() => {
    if (pendingRef.current === null || pendingRef.current !== activeIndex) return;
    pendingRef.current = null;
    beginExpand(activeIndex);
  }, [activeIndex, beginExpand]);

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
        className="fsc-canvas relative"
        {...handlers}
        onPointerMove={onWrapPointerMove}
        onClick={onWrapClick}
      >
        <Canvas
          dpr={[1, 1.25]}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, bp.cameraZ], fov: bp.fov }}
          onCreated={({ gl }) => {
            gl.domElement?.addEventListener('webglcontextlost', (e) => e.preventDefault());
          }}
        >
          <CarouselCamera
            z={bp.cameraZ}
            fov={bp.fov}
            sim={sim}
            expandRef={expandRef}
            reducedMotion={reducedMotion}
          />
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
        </Canvas>

        {/* 0-overhead CSS ambient depth vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]"
        />
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
