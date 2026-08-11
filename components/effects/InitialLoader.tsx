'use client';

import { useEffect, useState } from 'react';
import EvilEye from './EvilEye';

const AMBIENT_PARTICLES = [
  { top: '22%', left: '18%', size: 2.2, color: '#00e5ff', delay: '0s', dur: '4.5s' },
  { top: '35%', left: '12%', size: 1.5, color: '#ff2a8d', delay: '1s', dur: '5.2s' },
  { top: '48%', left: '22%', size: 2.0, color: '#ffc800', delay: '0.5s', dur: '3.8s' },
  { top: '28%', left: '38%', size: 1.2, color: '#9c1ab0', delay: '1.5s', dur: '4.8s' },
  { top: '60%', left: '28%', size: 2.5, color: '#00e5ff', delay: '2s', dur: '5.5s' },
  { top: '25%', left: '62%', size: 1.8, color: '#ff2a8d', delay: '0.8s', dur: '4.2s' },
  { top: '42%', left: '78%', size: 2.2, color: '#ffc800', delay: '1.2s', dur: '5.0s' },
  { top: '55%', left: '85%', size: 1.4, color: '#00e5ff', delay: '0.3s', dur: '4.6s' },
  { top: '20%', left: '80%', size: 2.0, color: '#9c1ab0', delay: '1.8s', dur: '3.9s' },
  { top: '65%', left: '72%', size: 1.6, color: '#ff2a8d', delay: '0.4s', dur: '4.7s' },
  { top: '15%', left: '48%', size: 2.4, color: '#ffc800', delay: '1.1s', dur: '5.4s' },
  { top: '30%', left: '52%', size: 1.5, color: '#00e5ff', delay: '0.7s', dur: '4.3s' },
];

export default function InitialLoader() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [lookTarget, setLookTarget] = useState<[number, number]>([0, 0]);

  const handleSkip = () => {
    setIsFadingOut(true);
    document.body.classList.remove('loader-active');
    setTimeout(() => {
      setShouldRender(false);
      document.body.style.overflow = '';
    }, 400);
  };

  // Shared wandering loop to keep eye movements sync'd
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateTarget = () => {
      if (Math.random() < 0.25) {
        setLookTarget([0, 0]);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.2 + Math.random() * 0.65;
        setLookTarget([Math.cos(angle) * dist, Math.sin(angle) * dist]);
      }
      const nextDelay = 1500 + Math.random() * 1500;
      timer = setTimeout(updateTarget, nextDelay);
    };

    timer = setTimeout(updateTarget, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('loader-active');

    let startTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      const currentProgress = Math.min(1.0, elapsed / 4.0);
      setProgress(currentProgress);

      if (elapsed >= 3.2 && elapsed <= 3.9) {
        const blinkProgress = (elapsed - 3.2) / 0.7;
        const blinkVal = Math.sin(blinkProgress * Math.PI);
        setEyeBlink(Math.max(0.0, 1.0 - blinkVal));
      } else {
        setEyeBlink(1.0);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.classList.remove('loader-active');
    }, 4000);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
      document.body.style.overflow = '';
    }, 4400);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = '';
      document.body.classList.remove('loader-active');
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#040207] text-white transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.22)_0%,_rgba(192,38,211,0.12)_35%,_rgba(5,2,10,0.85)_70%,_#040207_100%)] pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {AMBIENT_PARTICLES.map((p, idx) => (
          <div
            key={idx}
            className="absolute rounded-full animate-pulse shadow-[0_0_6px_currentColor]"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              color: p.color,
              animationDelay: p.delay,
              animationDuration: p.dur,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      <button
        onClick={handleSkip}
        className="absolute top-6 right-8 z-50 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-widest text-white/70 uppercase transition-all duration-200 border border-white/15 rounded-md bg-white/5 backdrop-blur-md hover:bg-white/15 hover:text-white hover:border-white/40 active:scale-95 cursor-pointer select-none"
      >
        Skip
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center -translate-y-16 pointer-events-none z-10">
        <div className="w-full h-[75vh] max-h-[44vw] md:max-h-none flex items-center justify-center gap-2 md:gap-8 pointer-events-auto overflow-visible px-4">
          <div className="w-1/2 h-full relative">
            <EvilEye
              intensity={1.8}
              pupilSize={1.95}
              irisWidth={0.8}
              glowIntensity={0.5}
              scale={0.8}
              noiseScale={1.4}
              pupilFollow={3.2}
              flameSpeed={1.0}
              blink={eyeBlink}
              manualMouse={lookTarget}
            />
          </div>

          <div className="w-1/2 h-full relative">
            <EvilEye
              intensity={1.8}
              pupilSize={1.95}
              irisWidth={0.8}
              glowIntensity={0.5}
              scale={0.8}
              noiseScale={1.4}
              pupilFollow={3.2}
              flameSpeed={1.0}
              blink={eyeBlink}
              manualMouse={lookTarget}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 w-full z-20 flex flex-col items-center space-y-3 select-none pointer-events-none text-center">
        <div className="flex items-center gap-2 tracking-[0.4em] uppercase text-[11px] font-bold">
          <span className="text-[#00e5ff]">ENTERING</span>
          <span className="text-[#ff2a8d]">EXPERIENCE</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ffc800] via-[#ff2a8d] to-[#00d2ff] drop-shadow-[0_0_20px_rgba(255,42,141,0.4)]">
          SABRANG 2026
        </h1>

        <span className="tracking-[0.3em] uppercase text-[10px] font-medium text-white/50 pt-1">
          LOADING EXPERIENCE...
        </span>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-[#ff2a8d]/30 via-[#7c3aed]/15 to-transparent pointer-events-none blur-2xl z-0" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[550px] h-10 bg-[#ff2a8d]/25 blur-xl rounded-full pointer-events-none z-0" />
    </div>
  );
}
