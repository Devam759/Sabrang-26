'use client';

import { useEffect, useRef } from 'react';

// Suppress harmless internal Three.js deprecation & duplicate instance warnings in dev
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

    // Full vibrant color spectrum displayed consistently on every visit
    const FIXED_TUBE_COLORS = [
      '#f967fb',
      '#7C3AED',
      '#53bc28',
      '#fe8a2e',
      '#6958d5',
      '#ff008a',
      '#60aed5',
      '#83f36e',
    ];

    const FIXED_LIGHT_COLORS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

    // @ts-ignore
    import('threejs-components/build/cursors/tubes1.min.js').then((module) => {
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
    });

    return () => {
      isMounted = false;
      if (app && typeof app.dispose === 'function') {
        app.dispose();
      }
    };
  }, []);

  return (
    <div
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
