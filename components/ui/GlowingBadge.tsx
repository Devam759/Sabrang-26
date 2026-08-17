import React from 'react';
import { motion } from 'framer-motion';

interface GlowingBadgeProps {
  icon?: React.ReactNode;
  text: string;
  className?: string;
}

export default function GlowingBadge({ icon, text, className = '' }: GlowingBadgeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`relative inline-block cursor-default group prize-pill ${className}`}
    >
      <div className="prize-glow" />
      <div className="prize-shimmer" />
      <div className="relative flex items-center gap-2 z-10">
        {icon && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 border border-white/30 text-yellow-300">
            {icon}
          </span>
        )}
        <span className="font-extrabold tracking-wide text-white text-sm sm:text-base">
          {text}
        </span>
      </div>
    </motion.div>
  );
}
