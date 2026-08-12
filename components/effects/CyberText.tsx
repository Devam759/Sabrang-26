'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Anton } from 'next/font/google';

const anton = Anton({ weight: '400', subsets: ['latin'] });

const CYBER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
const ORIGINAL_TEXT = 'SABRANG 2026';

export default function CyberText({ scrollY1 }: { scrollY1: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Decryption State
  const [displayText, setDisplayText] = useState(ORIGINAL_TEXT);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovering) {
      let iteration = 0;
      interval = setInterval(() => {
        setDisplayText((prev) => 
          prev.split('')
            .map((letter, index) => {
              if (index < iteration) {
                return ORIGINAL_TEXT[index];
              }
              return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)];
            })
            .join('')
        );
        
        if (iteration >= ORIGINAL_TEXT.length) {
          clearInterval(interval);
        }
        
        iteration += 1 / 3; // Controls speed of decryption
      }, 30);
    } else {
      setDisplayText(ORIGINAL_TEXT);
    }

    return () => clearInterval(interval);
  }, [isHovering]);

  // Magnetic Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 12, stiffness: 100, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 12, stiffness: 100, mass: 0.5 });

  // Kinetic Split Physics (Scroll)
  const topSplitX = useTransform(scrollY1, [0, 0.5], [0, -400]);
  const bottomSplitX = useTransform(scrollY1, [0, 0.5], [0, 400]);
  const splitOpacity = useTransform(scrollY1, [0, 0.3, 0.5], [1, 1, 0]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Heavy magnetic pull
    mouseX.set((e.clientX - centerX) * 0.15);
    mouseY.set((e.clientY - centerY) * 0.15);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovering(false);
  }

  const baseTextStyle = "text-6xl md:text-[9rem] font-medium tracking-tighter uppercase leading-[0.85] cursor-crosshair select-none whitespace-nowrap";
  
  return (
    <motion.div 
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto"
      style={{ opacity: splitOpacity }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
    >
      <style>{`
        .cyber-stroke {
          -webkit-text-stroke: 2px #fff;
          color: rgba(255, 255, 255, 0.1);
          text-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.5);
          transition: color 0.3s ease, text-shadow 0.3s ease, -webkit-text-stroke 0.3s ease;
        }
        .cyber-stroke:hover {
          color: rgba(255, 255, 255, 0.8);
          -webkit-text-stroke: 1px #fff;
          text-shadow: 0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(255, 0, 255, 1);
        }
      `}</style>

      <motion.div style={{ x: springX, y: springY }} className="relative text-center">
        
        {/* TOP HALF */}
        <motion.h1 
          style={{ 
            clipPath: 'inset(0% 0% 50% 0%)',
            x: topSplitX
          }}
          className={`${baseTextStyle} ${anton.className} cyber-stroke absolute inset-0 z-20`}
        >
          {displayText}
        </motion.h1>

        {/* BOTTOM HALF */}
        <motion.h1 
          style={{ 
            clipPath: 'inset(50% 0% 0% 0%)',
            x: bottomSplitX
          }}
          className={`${baseTextStyle} ${anton.className} cyber-stroke relative z-10`}
        >
          {displayText}
        </motion.h1>

      </motion.div>
    </motion.div>
  );
}
