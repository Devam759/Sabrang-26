import React, { useEffect, useState } from 'react';
import { introState } from './IntroTimeline';

export default function SabrangTitle() {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame: number;
    const update = () => {
      setOpacity(introState.logoOpacity);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (opacity <= 0.01) return null;

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 mix-blend-screen"
      style={{ opacity }}
    >
      <h1 
        className="font-black uppercase text-white whitespace-nowrap flex flex-row items-center justify-center gap-[3vw]"
        style={{ 
          fontFamily: "var(--font-display), serif",
          fontSize: "clamp(2rem, 8vw, 8rem)",
          letterSpacing: "0.15em",
          marginRight: "-0.15em"
        }}
      >
        <span>SABRANG</span>
        <span>26</span>
      </h1>
    </div>
  );
}
