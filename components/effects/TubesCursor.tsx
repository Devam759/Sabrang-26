"use client";

import { useEffect, useRef } from "react";
import {
  CURSOR_TRAIL_COLORS,
  CURSOR_TRAIL_IDLE_MS,
  CURSOR_TRAIL_MAX_SEGMENTS,
  CURSOR_TRAIL_MIN_SEGMENTS,
} from "@/lib/constants";

if (typeof window !== "undefined") {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Multiple instances of Three.js") ||
        args[0].includes("THREE.Clock") ||
        args[0].includes("THREE.BufferGeometry.computeBoundingSphere"))
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

export default function TubesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    let app: {
      tubes?: {
        setColors: (c: string[]) => void;
        setLightsColors: (c: string[]) => void;
      };
      dispose?: () => void;
    } | null = null;

    let isMounted = true;

    const FIXED_TUBE_COLORS = [...CURSOR_TRAIL_COLORS];
    const FIXED_LIGHT_COLORS = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"];

    // @ts-ignore
    import("threejs-components/build/cursors/tubes1.min.js")
      .then((module) => {
        if (!isMounted || !canvas) return;
        const TubesCursorLib = module.default ?? module;
        app = TubesCursorLib(canvas, {
          tubes: {
            colors: FIXED_TUBE_COLORS,
            count: 16,
            minTubularSegments: CURSOR_TRAIL_MIN_SEGMENTS,
            maxTubularSegments: CURSOR_TRAIL_MAX_SEGMENTS,
            minRadius: 0.005,
            maxRadius: 0.02,
            noise: 0.03,
            lights: {
              intensity: 120,
              colors: FIXED_LIGHT_COLORS,
            },
          },
        });
      })
      .catch((err) => {
        console.warn("TubesCursor load notice:", err);
        app = null;
      });

    let idleTimer: NodeJS.Timeout | null = null;
    let animFrameId: number | null = null;
    let isIdle = false;

    const currentPos = {
      x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
      y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
    };
    const velocity = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
    };
    let angle = Math.random() * Math.PI * 2;
    let speed = 3;

    const startRandomWander = () => {
      if (isIdle) return;
      isIdle = true;

      const wander = () => {
        if (!isIdle) return;

        angle += (Math.random() - 0.5) * 0.2;
        speed += (Math.random() - 0.5) * 0.2;
        speed = Math.max(1.5, Math.min(4.5, speed));

        velocity.x = Math.cos(angle) * speed;
        velocity.y = Math.sin(angle) * speed;

        currentPos.x += velocity.x;
        currentPos.y += velocity.y;

        const padding = 100;
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (currentPos.x < padding) {
          currentPos.x = padding;
          angle = Math.PI - angle;
        } else if (currentPos.x > width - padding) {
          currentPos.x = width - padding;
          angle = Math.PI - angle;
        }

        if (currentPos.y < padding) {
          currentPos.y = padding;
          angle = -angle;
        } else if (currentPos.y > height - padding) {
          currentPos.y = height - padding;
          angle = -angle;
        }

        if (canvas) {
          const eventInit = {
            clientX: currentPos.x,
            clientY: currentPos.y,
            pageX: currentPos.x,
            pageY: currentPos.y,
            bubbles: true,
            cancelable: true,
          };

          canvas.dispatchEvent(new PointerEvent("pointermove", eventInit));
          canvas.dispatchEvent(new MouseEvent("mousemove", eventInit));
        }

        animFrameId = requestAnimationFrame(wander);
      };

      animFrameId = requestAnimationFrame(wander);
    };

    const stopRandomWander = () => {
      isIdle = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    const resetIdleTimer = () => {
      stopRandomWander();
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        startRandomWander();
      }, CURSOR_TRAIL_IDLE_MS);
    };

    const handleUserPointer = (e: MouseEvent | PointerEvent | TouchEvent) => {
      let cx = 0;
      let cy = 0;
      if ("clientX" in e && typeof e.clientX === "number") {
        if (!e.isTrusted) return;
        cx = e.clientX;
        cy = e.clientY;
      } else if ("touches" in e && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        return;
      }

      currentPos.x = cx;
      currentPos.y = cy;
      resetIdleTimer();

      if (canvas) {
        const eventInit = {
          clientX: cx,
          clientY: cy,
          pageX: cx,
          pageY: cy,
          bubbles: true,
          cancelable: true,
        };
        canvas.dispatchEvent(new PointerEvent("pointermove", eventInit));
        canvas.dispatchEvent(new MouseEvent("mousemove", eventInit));
      }
    };

    const handleMouseLeave = () => {
      startRandomWander();
    };

    const handleWindowBlur = () => {
      startRandomWander();
    };

    const handleWindowFocus = () => {
      resetIdleTimer();
    };

    window.addEventListener("pointermove", handleUserPointer, { passive: true });
    window.addEventListener("mousemove", handleUserPointer, { passive: true });
    window.addEventListener("touchmove", handleUserPointer, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    resetIdleTimer();

    return () => {
      isMounted = false;
      stopRandomWander();
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("pointermove", handleUserPointer);
      window.removeEventListener("mousemove", handleUserPointer);
      window.removeEventListener("touchmove", handleUserPointer);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (app && typeof app.dispose === "function") {
        app.dispose();
      }
    };
  }, []);

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
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
