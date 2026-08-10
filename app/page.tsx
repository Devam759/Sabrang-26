'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import ThreeBackground from '@/components/effects/ThreeBackground';
import { LiquidMetalButton } from '@/components/ui/liquid-metal';
import { useInteraction } from '@/components/InteractionContext';

function MagneticHeroText({ text, scrollY1, isTopHalf }: { text: string, scrollY1: any, isTopHalf: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const x = useSpring(mouseX, { damping: 15, stiffness: 150 });
  const y = useSpring(mouseY, { damping: 15, stiffness: 150 });
  
  const splitY = useTransform(scrollY1, [0, 0.6], [0, isTopHalf ? -500 : 500]);
  const splitOpacity = useTransform(scrollY1, [0, 0.5, 0.6], [1, 1, 0]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.1);
    mouseY.set((e.clientY - centerY) * 0.1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto"
      style={{ 
        clipPath: isTopHalf ? 'inset(0% 0% 50% 0%)' : 'inset(50% 0% 0% 0%)',
        y: splitY,
        opacity: splitOpacity
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.h1 
        ref={ref}
        style={{ x, y }}
        className="text-6xl md:text-[8rem] font-medium tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl cursor-default"
      >
        Sabrang <span className="font-light text-white/70">2026</span>
      </motion.h1>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { setHoverState } = useInteraction();
  
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
      <ThreeBackground />

      {/* SECTION 1: HERO & ABOUT */}
      <div ref={section1Ref} className="h-[200vh] relative z-10">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-none">
          
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

          <MagneticHeroText text="Sabrang 2026" scrollY1={scrollY1} isTopHalf={true} />
          <MagneticHeroText text="Sabrang 2026" scrollY1={scrollY1} isTopHalf={false} />

          <motion.div 
            style={{ opacity: buttonsOpacity, y: buttonsY }}
            className="absolute inset-0 flex flex-col items-center justify-end pb-32 z-30 pointer-events-auto"
          >
            <div className="flex gap-6 mt-12">
              <Link href="/events" onMouseEnter={() => setHoverState('primary')} onMouseLeave={() => setHoverState('idle')}>
                <LiquidMetalButton size="lg" borderWidth={1} metalConfig={heroMetalConfig}
                  icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                >
                  Explore Events
                </LiquidMetalButton>
              </Link>
              {!user && (
                <Link href="/register" onMouseEnter={() => setHoverState('secondary')} onMouseLeave={() => setHoverState('idle')}>
                  <LiquidMetalButton size="lg" borderWidth={1} metalConfig={heroMetalConfig}
                    icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                  >
                    Register Now
                  </LiquidMetalButton>
                </Link>
              )}
            </div>
          </motion.div>

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
