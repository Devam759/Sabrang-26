'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import ThreeBackground from '@/components/effects/ThreeBackground';
import { useInteraction } from '@/components/InteractionContext';

import GsapCyberText from '@/components/effects/GsapCyberText';
import IntroReveal from '@/components/effects/IntroReveal';
export default function Home() {
  const { user } = useAuth();
  const { setHoverState } = useInteraction();
  
  const mX = useMotionValue(0);
  const mY = useMotionValue(0);
  const x = useSpring(mX, { damping: 15, stiffness: 150 });
  const y = useSpring(mY, { damping: 15, stiffness: 150 });

  function handleMouseMove(e: React.MouseEvent) {
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
    mX.set((e.clientX - centerX) * 0.08);
    mY.set((e.clientY - centerY) * 0.08);
  }

  function handleMouseLeave() {
    mX.set(0);
    mY.set(0);
  }

  // ─── SECTION 1: HERO & ABOUT ───
  const section1Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollY1 } = useScroll({
    target: section1Ref,
    offset: ["start start", "end end"]
  });

  const buttonsOpacity = useTransform(scrollY1, [0, 0.2], [1, 0]);
  const buttonsY = useTransform(scrollY1, [0, 0.2], [0, 100]);
  
  const aboutOpacity = useTransform(scrollY1, [0.3, 0.7], [0, 1]);
  const aboutScale = useTransform(scrollY1, [0.3, 0.7], [0.9, 1]);

  const heroMetalConfig = {
    colorBack: '#111827',
    colorTint: '#4b5563',
    speed: 0.5,
    repetition: 4,
    distortion: 0.15,
    scale: 1,
  };

  // ─── SECTION 2: VIOLENT ACCORDION ───
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  const pillars = [
    { title: "PANACHE", desc: "The ultimate fashion showdown. Assert dominance on the runway.", num: "01", state: 'primary' },
    { title: "BANDJAM", desc: "Pure sonic warfare under the open sky. The battle of the bands.", num: "02", state: 'secondary' },
    { title: "STEP-UP", desc: "Synchronized tactical dance battles. Flawless execution required.", num: "03", state: 'tertiary' }
  ];

  return (
    <div className="relative bg-transparent font-sans">
      <IntroReveal />
      <ThreeBackground />

      {/* SECTION 1: HERO & ABOUT */}
      <div ref={section1Ref} className="h-[200vh] relative z-10">
        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto"
        >
          
          <motion.div 
            style={{ opacity: aboutOpacity, scale: aboutScale }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-auto"
          >
            <div className="max-w-4xl w-full">
              <h2 className="text-4xl md:text-6xl font-light text-white mb-12 uppercase tracking-tight drop-shadow-2xl">
                What is <span className="font-medium">Sabrang?</span>
              </h2>
              <div className="space-y-6 text-xl md:text-2xl text-white/90 font-light leading-relaxed max-w-3xl mx-auto mb-16">
                <p>
                  The annual flagship festival of JK Lakshmipat University. A nexus of talent, innovation, and absolute cultural dominance.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/10 max-w-2xl mx-auto shadow-[0_0_50px_rgba(157,78,221,0.3)]">
                <div className="bg-[#030005]/80 backdrop-blur-3xl p-8 flex flex-col justify-center items-center text-center">
                  <div className="text-5xl font-light text-white mb-2">50+</div>
                  <div className="text-xs text-white/50 uppercase tracking-[0.2em] font-light">Events</div>
                </div>
                <div className="bg-[#030005]/80 backdrop-blur-3xl p-8 flex flex-col justify-center items-center text-center">
                  <div className="text-5xl font-light text-white mb-2">2.5L</div>
                  <div className="text-xs text-white/50 uppercase tracking-[0.2em] font-light">Prize Pool</div>
                </div>
              </div>
            </div>
          </motion.div>

          <GsapCyberText />


        </div>
      </div>

      {/* 
        SECTION 2: VIOLENT ACCORDION VIDEO MASK 
        Using mix-blend-mode: multiply. 
        Black background stays black. White text punches through to the WebGL canvas behind it!
      */}
      <div className="h-screen w-full relative z-20 bg-black flex overflow-hidden" style={{ mixBlendMode: 'multiply' }}>
        
        {/* Title layer that ignores blend mode (mixBlendMode: normal to overlay standard text) */}
        <div className="absolute top-12 left-12 pointer-events-none z-50 mix-blend-normal">
          <h2 className="text-sm tracking-[0.4em] font-light text-white/50 uppercase">Festival Highlights</h2>
          <div className="text-4xl font-light text-white mt-4">Core Directives</div>
        </div>

        {pillars.map((item, i) => {
          const isHovered = hoveredPillar === i;
          const isIdle = hoveredPillar === null;
          
          return (
            <motion.div
              key={i}
              onMouseEnter={() => {
                setHoveredPillar(i);
                setHoverState(item.state as any);
              }}
              onMouseLeave={() => {
                setHoveredPillar(null);
                setHoverState('idle');
              }}
              animate={{
                width: isHovered ? '80%' : isIdle ? '33.333%' : '10%',
              }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 30,
                mass: 0.8
              }}
              className="relative h-full border-r border-white/10 flex items-center justify-center cursor-pointer overflow-hidden bg-black"
            >
              {/* Massive White Typography (Becomes transparent due to multiply blend mode, revealing video!) */}
              <motion.div 
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  scale: isHovered ? 1 : 0.8 
                }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <h3 className="text-[15vw] font-black uppercase tracking-tighter text-white leading-none text-center whitespace-nowrap">
                  {item.title}
                </h3>
              </motion.div>

              {/* Foreground Details (Standard White text on black bg) */}
              <motion.div 
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="absolute bottom-12 left-12 right-12 z-10 mix-blend-normal pointer-events-none"
              >
                <p className="text-2xl font-light text-white max-w-lg">{item.desc}</p>
              </motion.div>

              {/* Vertical Title (when collapsed or idle) */}
              <motion.div 
                animate={{ opacity: isHovered ? 0 : 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mix-blend-normal"
              >
                <div className="text-4xl text-white/30 font-light mb-12">{item.num}</div>
                <h3 className="text-6xl font-medium text-white/50 tracking-widest uppercase -rotate-90 origin-center whitespace-nowrap">
                  {item.title}
                </h3>
              </motion.div>
              
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
