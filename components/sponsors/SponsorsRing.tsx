'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { PAST_SPONSORS } from '@/lib/constants';

const HologramLogo = ({ sponsor, idx, total, scrollYProgress }: { sponsor: any, idx: number, total: number, scrollYProgress: any }) => {
  // Calculate the specific scroll segment for this logo
  const center = idx / Math.max(1, total - 1);
  const range = 1.2 / total; // Overlap slightly for smooth crossfades
  const start = center - range;
  const end = center + range;

  // Cinematic Hologram Physics
  const opacity = useTransform(scrollYProgress, [start, center, end], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [start, center, end], [0.5, 1.2, 1.8]); // Flies up and towards the camera
  const y = useTransform(scrollYProgress, [start, center, end], ['20vh', '0vh', '-30vh']);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, scale, y }}
    >
      <div className="relative w-[300px] md:w-[500px] h-[200px] md:h-[300px] group">
        
        {/* Core Logo Image with Chromatic Aberration */}
        <Image
          src={sponsor.src}
          alt={sponsor.alt}
          fill
          className="object-contain mix-blend-screen"
          style={{
            filter: 'drop-shadow(3px 0px 0px rgba(219,39,119,0.8)) drop-shadow(-3px 0px 0px rgba(0,255,255,0.8)) drop-shadow(0 0 30px rgba(219,39,119,0.5))'
          }}
        />

        {/* Digital Hologram Glitch/Scanline Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
          style={{ 
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(219,39,119,0.3) 2px, rgba(219,39,119,0.3) 4px)' 
          }} 
        />
        
        {/* Energy Pulse Ring */}
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-pink-500/50 rounded-full blur-[2px]"
        />
      </div>
    </motion.div>
  );
};

export default function SponsorsRing() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll over the massive 500vh section for a long, cinematic experience
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 80 });

  return (
    // Massive 500vh container gives plenty of scroll room to cycle through all sponsors
    <div ref={containerRef} className="relative w-full h-[500vh] bg-[#030005]">
      
      {/* Sticky container locks to the screen while you scroll down */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        
        {/* Full-screen bombastic flash on mount */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          className="absolute inset-0 z-50 bg-white pointer-events-none mix-blend-overlay"
        />

        {/* Sleek, Sexy Background Layer - Animates in */}
        <motion.div 
          initial={{ scale: 1.1, filter: 'brightness(0)' }}
          animate={{ scale: 1, filter: 'brightness(1)' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {/* This sat on a 40MB city loop that every one of the tint layers
              below then multiplied down to a purple-black wash — a gradient
              paints that wash directly, for nothing. The multiply tints went
              with it: with no footage underneath they only crush to black. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1E0B36_0%,#2A1052_35%,#170A30_70%,#030005_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(147,51,234,0.30)_0%,transparent_62%)]" />

          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030005_100%)] opacity-90" />
          
          {/* Subtle Film Grain / Noise */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        </motion.div>

        {/* The Hologram Cycle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0 z-20"
        >
          {PAST_SPONSORS.map((sponsor, idx) => (
            <HologramLogo 
              key={idx} 
              sponsor={sponsor} 
              idx={idx} 
              total={PAST_SPONSORS.length} 
              scrollYProgress={smoothProgress} 
            />
          ))}
        </motion.div>

        {/* Core Hologram Projector Base (Bottom of screen) - Slams up on mount */}
        <motion.div 
          initial={{ y: 200, scale: 0.8, filter: 'brightness(0)' }}
          animate={{ y: 0, scale: 1, filter: 'brightness(1.5)' }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end w-full h-[60vh] pointer-events-none z-10"
        >
          
          {/* Volumetric Light Beam with Data Streams */}
          <motion.div 
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative w-[70vw] md:w-[35vw] h-full flex justify-center origin-bottom"
          >
            {/* Main Wide Beam */}
            <div 
              className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-500/30 via-purple-500/5 to-transparent blur-xl"
              style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)' }}
            />
            {/* Intense Center Core Beam */}
            <div 
              className="absolute bottom-0 w-1/3 h-full bg-gradient-to-t from-white/10 via-pink-400/5 to-transparent blur-2xl"
              style={{ clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0% 100%)' }}
            />
          </motion.div>
          
          {/* Physical Projector Hardware (Sleek Aperture) */}
          <div className="relative w-[85vw] md:w-[45vw] h-8 bg-black/80 backdrop-blur-xl rounded-[100%] shadow-[0_0_100px_rgba(219,39,119,0.5)] border-t-2 border-t-pink-500/80 border-b border-b-white/5 flex items-center justify-center">
             {/* Glowing Aperture Core */}
             <div className="w-2/3 h-4 bg-gradient-to-r from-transparent via-pink-400 to-transparent blur-[4px] rounded-full animate-pulse" />
             <div className="absolute w-1/3 h-2 bg-white blur-[2px] rounded-full animate-pulse" />
          </div>
          <div className="w-[90vw] md:w-[50vw] h-16 bg-gradient-to-b from-black/90 to-transparent rounded-[100%] opacity-80" />
        
        </motion.div>

      </div>
    </div>
  );
}
