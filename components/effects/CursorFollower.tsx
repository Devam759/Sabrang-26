'use client';

import { useEffect, useState } from 'react';

export default function CursorFollower() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const hoverMatch = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsTouch(!hoverMatch.matches);

    if (!hoverMatch.matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      if (e.isTrusted) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        typeof target.closest === 'function' &&
        target.closest('a, button, input, select, textarea, [role="button"]')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const update = () => {
      currentX += (mouseX - currentX) * 0.22;
      currentY += (mouseY - currentY) * 0.22;
      setPos({ x: currentX, y: currentY });
      animId = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMouseMove);
    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (isTouch) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9990] pointer-events-none"
      style={{
        transform: `translate3d(${pos.x - 8}px, ${pos.y - 8}px, 0)`,
      }}
    >
      <div
        className={`w-4 h-4 rounded-full custom-cursor-circle bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-transform duration-200 ${
          isHovered ? 'scale-150 opacity-90' : 'scale-100 opacity-100'
        }`}
      />
    </div>
  );
}
