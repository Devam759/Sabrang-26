"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function CursorFollower() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") || pathname === "/login";

  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isAdmin) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Hover detection — expand white circle over interactive elements
      const target = e.target as HTMLElement | null;
      const interactive = !!(
        target?.closest?.('a, button, input, select, textarea, [role="button"]')
      );
      if (dotRef.current) {
        dotRef.current.style.transform = interactive ? "scale(1.6)" : "scale(1)";
        dotRef.current.style.opacity = interactive ? "0.9" : "1";
      }
    };

    const update = () => {
      currentX = mouseX;
      currentY = mouseY;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(${currentX - 8}px, ${currentY - 8}px, 0)`;
      }
      animId = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("pointermove", onMouseMove, { passive: true });
    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointermove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [isAdmin]);

  if (!mounted || isAdmin) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[99999] pointer-events-none"
      style={{ transform: "translate3d(-100px, -100px, 0)", willChange: "transform" }}
    >
      <div
        ref={dotRef}
        className="w-4 h-4 rounded-full custom-cursor-circle bg-white shadow-[0_0_12px_rgba(255,255,255,0.85)] pointer-events-none"
        style={{ transform: "scale(1)", opacity: "1", transition: "transform 0.18s ease-out, opacity 0.18s ease-out" }}
      />
    </div>
  );
}
