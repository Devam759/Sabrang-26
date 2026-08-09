'use client';

import { useEffect, useState } from 'react';
import EvilEye from './EvilEye';

export default function InitialLoader() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(1.0);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShouldRender(false);
      document.body.style.overflow = '';
    }, 400);
  };

  useEffect(() => {
    // Show loader on site load / reload
    document.body.style.overflow = 'hidden';

    let startTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000; // seconds

      // Blink BOTH Eyes in the final 2 seconds (between 4.4s and 5.2s)
      if (elapsed >= 4.4 && elapsed <= 5.2) {
        const blinkProgress = (elapsed - 4.4) / 0.8; // 0 to 1 over 0.8s
        const blinkVal = Math.sin(blinkProgress * Math.PI); // 0 -> 1 -> 0
        setEyeBlink(Math.max(0.0, 1.0 - blinkVal));
      } else {
        setEyeBlink(1.0);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Start fade-out transition at 5.3s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5300);

    // Completely unmount at 6.0s
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
      document.body.style.overflow = '';
    }, 6000);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#120F17] text-white transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-8 z-50 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-widest text-white/70 uppercase transition-all duration-200 border border-white/15 rounded-md bg-white/5 backdrop-blur-md hover:bg-white/15 hover:text-white hover:border-white/40 active:scale-95 cursor-pointer select-none"
      >
        Skip
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>

      {/* 2 Eyes: Wider horizontally & moved up vertically */}
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center -translate-y-12 pointer-events-none">
        {/*
          On desktop the row is 70vh tall and each eye box is ~half the viewport width,
          giving a natural wide-oval shape. On portrait mobile (narrow width, tall height)
          70vh would make each eye box taller than it is wide, stretching the shader into
          a vertical slit. We cap the row height so the boxes stay roughly square/landscape:
            - max-h-[42vw]  on mobile  (each eye ≈ 42vw × 42vw  → square)
            - md:max-h-none resets the cap on tablet+ so desktop keeps 70vh
        */}
        <div className="w-full h-[70vh] max-h-[42vw] md:max-h-none flex items-center justify-center gap-4 pointer-events-auto overflow-visible px-4">
          {/* Left Eye */}
          <div className="w-1/2 h-full relative">
            <EvilEye
              eyeColor="#7C3AED"
              backgroundColor="#120f17"
              intensity={1.6}
              pupilSize={1.95}
              irisWidth={0.8}
              glowIntensity={0.45}
              scale={1.0}
              noiseScale={1.4}
              pupilFollow={2}
              flameSpeed={1}
              blink={eyeBlink}
            />
          </div>

          {/* Right Eye */}
          <div className="w-1/2 h-full relative">
            <EvilEye
              eyeColor="#7C3AED"
              backgroundColor="#120f17"
              intensity={1.6}
              pupilSize={1.95}
              irisWidth={0.8}
              glowIntensity={0.45}
              scale={1.0}
              noiseScale={1.4}
              pupilFollow={2}
              flameSpeed={1}
              blink={eyeBlink}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 z-10 flex flex-col items-center space-y-2 select-none pointer-events-none">
        <span className="tracking-[0.3em] uppercase text-xs text-purple-400/80 font-medium">
          Entering Experience
        </span>
        <h1 className="text-xl font-bold tracking-widest text-white/90">
          SABRANG 2026
        </h1>
      </div>
    </div>
  );
}
