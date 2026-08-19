"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Full-viewport canvas routes have nothing to scroll but the layout footer, and
// Lenis scrolls the window programmatically — which `overflow: hidden` does not
// stop. Every wheel tick meant to spin the gallery also crept the page down far
// enough to trip the navbar's hide-on-scroll and take the menu button with it.
const NO_SMOOTH_SCROLL = ["/gallery"];

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (NO_SMOOTH_SCROLL.includes(pathname)) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Named, because ticker.remove matches by identity — the old code removed
    // `lenis.raf`, which was never the function it added, so now that this effect
    // re-runs per route every navigation would have left a ticker behind.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, [pathname]);

  return <>{children}</>;
}
