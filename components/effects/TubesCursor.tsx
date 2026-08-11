'use client';

import { useEffect, useRef } from 'react';
import { CURSOR_TRAIL_COLORS } from '@/lib/constants';

if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Multiple instances of Three.js') || args[0].includes('THREE.Clock'))
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

export default function TubesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    let app: {
      tubes?: { setColors: (c: string[]) => void; setLightsColors: (c: string[]) => void };
      dispose?: () => void;
    } | null = null;

    let isMounted = true;

    const FIXED_TUBE_COLORS = [...CURSOR_TRAIL_COLORS];
    const FIXED_LIGHT_COLORS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

    // @ts-ignore
    import('threejs-components/build/cursors/tubes1.min.js')
      .then((module) => {
        if (!isMounted || !canvas) return;
        const TubesCursor = module.default ?? module;
        app = TubesCursor(canvas, {
          tubes: {
            colors: FIXED_TUBE_COLORS,
            count: 16,
            minRadius: 0.005,
            maxRadius: 0.02,
            noise: 0.03,
            lights: {
              intensity: 120,
              colors: FIXED_LIGHT_COLORS,
            },
          },
        });
      })
      .catch(() => {
        app = null;
      });

    let idleTimer: NodeJS.Timeout | null = null;
    let animFrameId: number | null = null;
    let isIdle = false;

    const currentPos = {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
    };
    const velocity = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
    };
    let angle = Math.random() * Math.PI * 2;
    let speed = 3;

    const startRandomWander = () => {
      if (isIdle) return;
      isIdle = true;

      const wander = () => {
        if (!isIdle) return;

        angle += (Math.random() - 0.5) * 0.2;
        speed += (Math.random() - 0.5) * 0.2;
        speed = Math.max(1.5, Math.min(4.5, speed));

        velocity.x = Math.cos(angle) * speed;
        velocity.y = Math.sin(angle) * speed;

        currentPos.x += velocity.x;
        currentPos.y += velocity.y;

        const padding = 100;
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (currentPos.x < padding) {
          currentPos.x = padding;
          angle = Math.PI - angle;
        } else if (currentPos.x > width - padding) {
          currentPos.x = width - padding;
          angle = Math.PI - angle;
        }

        if (currentPos.y < padding) {
          currentPos.y = padding;
          angle = -angle;
        } else if (currentPos.y > height - padding) {
          currentPos.y = height - padding;
          angle = -angle;
        }

        const targetEl = document.elementFromPoint(currentPos.x, currentPos.y) || window;
        const eventInit = {
          clientX: currentPos.x,
          clientY: currentPos.y,
          pageX: currentPos.x,
          pageY: currentPos.y,
          bubbles: true,
          cancelable: true,
        };

        targetEl.dispatchEvent(new PointerEvent('pointermove', eventInit));
        targetEl.dispatchEvent(new MouseEvent('mousemove', eventInit));

        animFrameId = requestAnimationFrame(wander);
      };

      animFrameId = requestAnimationFrame(wander);
    };

    const stopRandomWander = () => {
      isIdle = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    const resetIdleTimer = () => {
      stopRandomWander();
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        startRandomWander();
      }, 1200);
    };

    const handleUserMouseMove = (e: MouseEvent) => {
      if (e.isTrusted) {
        currentPos.x = e.clientX;
        currentPos.y = e.clientY;
        resetIdleTimer();
      }
    };

    const handleMouseLeave = () => {
      startRandomWander();
    };

    const handleWindowBlur = () => {
      startRandomWander();
    };

    const handleWindowFocus = () => {
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleUserMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    resetIdleTimer();

    return () => {
      isMounted = false;
      stopRandomWander();
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleUserMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (app && typeof app.dispose === 'function') {
        app.dispose();
      }
    };
  }, []);

  return (
    <div
      className="tubes-cursor-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 30,
        mixBlendMode: 'screen',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
