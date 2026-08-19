'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroReveal({ title = "SABRANG" }: { title?: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the intro reveal after the sequence
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500); 
    return () => clearTimeout(timer);
  }, []);

  const characters = title.split('');

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 1.2, ease: "easeInOut" }
    }
  };

  const charVariants = {
    hidden: { opacity: 0, filter: 'blur(20px)', y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)', 
      y: 0,
      scale: 1,
      transition: { duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] } 
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-reveal"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508] overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Noise overlay */}
          <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-screen"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
            }} 
          />

          {/* Cinematic Zoom Container */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1, 15] }}
            transition={{ duration: 4.5, times: [0, 0.7, 1], ease: "easeInOut" }}
            className="relative flex items-center justify-center z-10"
          >
            <h1 className="flex text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-display), serif" }}>
              {characters.map((char, index) => (
                <motion.span
                  key={index}
                  variants={charVariants}
                  className="inline-block drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                >
                  {char}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          {/* Subtle loading line */}
          <motion.div 
            className="absolute bottom-[15%] w-[1px] bg-white/40 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 60, opacity: [0, 1, 0] }}
            transition={{ duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          >
            <motion.div 
              className="w-full bg-white shadow-[0_0_10px_#fff]"
              initial={{ height: "0%" }}
              animate={{ height: "100%" }}
              transition={{ duration: 2.5, ease: "circIn", delay: 0.8 }}
            />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
