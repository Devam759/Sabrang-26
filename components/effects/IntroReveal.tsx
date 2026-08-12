'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroReveal({ title = "SABRANG" }: { title?: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Automatically hide the intro reveal after the animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000); // 4 seconds total duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-reveal"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030005] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Background noise/grain for texture */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
            }} 
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
            animate={{ 
              scale: [0.8, 1, 1, 10], 
              opacity: [0, 1, 1, 0],
              filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(20px)']
            }}
            transition={{
              duration: 3.2,
              times: [0, 0.3, 0.7, 1],
              ease: 'easeInOut'
            }}
            className="relative flex items-center justify-center"
          >
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(219,39,119,0.8)] text-center px-4">
              {title}
            </h1>
            
            {/* Sexy glowing aura behind the text */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0, 1.2, 2] }}
              transition={{ duration: 3.2, times: [0, 0.5, 1], ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-red-600/30 blur-3xl -z-10"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
