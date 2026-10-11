"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "@/lib/suppress-three-logs";
import {
  CURSOR_TRAIL_COLORS,
  CURSOR_TRAIL_MAX_SEGMENTS,
  CURSOR_TRAIL_MIN_SEGMENTS,
} from "@/lib/constants";

export default function TubesCursor() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hidden = pathname?.startsWith('/admin') || pathname?.startsWith('/scanner') || pathname?.startsWith('/login');

  useEffect(() => {
    if (!canvasRef.current) return;
    // Skip entirely on touch/coarse-pointer devices - the trail is invisible
    if (window.matchMedia("(pointer: coarse)").matches) return;

    if (hidden) {
      // Clear out the canvas if it was already running
      return;
    }

    const canvas = canvasRef.current;

    let app: any = null;
    let isMounted = true;

    const FIXED_TUBE_COLORS = [...CURSOR_TRAIL_COLORS];
    const FIXED_LIGHT_COLORS = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"];

    // @ts-ignore - dynamic import of minified external library without types
    import("threejs-components/build/cursors/tubes1.min.js")
      .then((module) => {
        if (!isMounted || !canvas || hidden) return;
        const TubesCursorLib = module.default ?? module;
        app = TubesCursorLib(canvas, {
          tubes: {
            colors: FIXED_TUBE_COLORS,
            count: 16,
            minRadius: 0.005,
            maxRadius: 0.02,
            noise: 0.03,
            minTubularSegments: CURSOR_TRAIL_MIN_SEGMENTS,
            maxTubularSegments: CURSOR_TRAIL_MAX_SEGMENTS,
            lights: {
              intensity: 120,
              colors: FIXED_LIGHT_COLORS,
            },
          },
        });
      })
      .catch(() => {
        app = null;
      });

    const handleUserPointer = (e: MouseEvent | PointerEvent | TouchEvent) => {
      if ("isTrusted" in e && !e.isTrusted) return;
      if (hidden) return;

      let cx = 0;
      let cy = 0;
      if ("clientX" in e && typeof e.clientX === "number") {
        cx = e.clientX;
        cy = e.clientY;
      } else if ("touches" in e && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        return;
      }

      if (canvas) {
        const eventInit: any = {
          clientX: cx, clientY: cy, pageX: cx, pageY: cy, screenX: cx, screenY: cy,
          pointerType: "mouse", isPrimary: true, bubbles: false, cancelable: true,
        };
        try {
          canvas.dispatchEvent(new PointerEvent("pointermove", eventInit));
          canvas.dispatchEvent(new MouseEvent("mousemove", eventInit));
        } catch {}
      }
    };

    window.addEventListener("pointermove", handleUserPointer, { passive: true });
    window.addEventListener("mousemove", handleUserPointer, { passive: true });
    window.addEventListener("touchmove", handleUserPointer, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener("pointermove", handleUserPointer);
      window.removeEventListener("mousemove", handleUserPointer);
      window.removeEventListener("touchmove", handleUserPointer);
      if (app && typeof app.dispose === "function") {
        app.dispose();
      }
    };
  }, [hidden]); // <-- Add hidden to dependency array!

  return (
    <div
      className="tubes-cursor-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "screen",
        // Hide on excluded pages without unmounting - keeps the canvas ref
        // attached so the effect always initialises successfully on first mount.
        visibility: hidden ? "hidden" : "visible",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
          touchAction: "none",
        }}
      />
    </div>
  );
}
