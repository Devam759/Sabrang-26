"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Dynamic from "next/dynamic";
import gsap from "gsap";
import { CarouselItemData } from "./CarouselItem";

const Canvas = Dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  {
    ssr: false,
  },
);

const Carousel = Dynamic(() => import("./Carousel"), {
  ssr: false,
});

interface WebGLCarouselProps {
  items: CarouselItemData[];
  className?: string;
}

function OpenedNameOverlay({ item }: { item: CarouselItemData }) {
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const parts = (item.name || "Team Member").trim().split(" ");
  const firstLine = parts[0] || "";
  const secondLine = parts.slice(1).join(" ");

  useEffect(() => {
    // Delay GSAP timeline reveal until 3D card expansion finishes opening (~0.65s)
    const tl = gsap.timeline({ delay: 0.65 });

    if (line1Ref.current) {
      tl.fromTo(
        line1Ref.current,
        { y: 90, opacity: 0, skewY: 7, rotateX: -35 },
        {
          y: 0,
          opacity: 1,
          skewY: 0,
          rotateX: 0,
          duration: 0.8,
          ease: "power4.out",
        },
      );
    }

    if (line2Ref.current) {
      tl.fromTo(
        line2Ref.current,
        { y: 90, opacity: 0, skewY: 7, rotateX: -35 },
        {
          y: 0,
          opacity: 1,
          skewY: 0,
          rotateX: 0,
          duration: 0.8,
          ease: "power4.out",
        },
        "-=0.6",
      );
    }

    if (badgeRef.current) {
      tl.fromTo(
        badgeRef.current,
        { scale: 0.75, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" },
        "-=0.4",
      );
    }

    return () => {
      tl.kill();
    };
  }, [item]);

  return (
    <div className="absolute top-28 left-8 md:top-36 md:left-16 z-30 pointer-events-auto flex flex-col items-start gap-4 select-none max-w-3xl">
      <div
        style={{ fontFamily: "'Rush Driver', sans-serif" }}
        className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider leading-[0.85] text-left"
      >
        <div className="overflow-hidden px-6 py-1 -mx-6 -my-1">
          <div ref={line1Ref} className="text-white pr-4">
            {firstLine}
          </div>
        </div>
        {secondLine && (
          <div className="overflow-hidden px-6 py-1 -mx-6 -my-1">
            <div
              ref={line2Ref}
              className="text-black pl-6 sm:pl-12 md:pl-16 pr-4"
            >
              {secondLine}
            </div>
          </div>
        )}
      </div>

      <div ref={badgeRef} className="flex items-center gap-5 pt-1">
        {item.links?.instagram && (
          <a
            href={item.links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-purple-400 transition-colors p-1"
            title="Instagram"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
        )}
        {item.links?.linkedin && (
          <a
            href={item.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-purple-400 transition-colors p-1"
            title="LinkedIn"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
        )}
        {item.links?.github && (
          <a
            href={item.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-purple-400 transition-colors p-1"
            title="GitHub"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
        )}
        {item.links?.email && (
          <a
            href={item.links.email}
            className="text-white/80 hover:text-purple-400 transition-colors p-1"
            title="Email"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
        )}
        {item.links?.website && (
          <a
            href={item.links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-purple-400 transition-colors p-1"
            title="Website / Drive"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function WebGLCarousel({
  items,
  className = "w-full h-[70vh]",
}: WebGLCarouselProps) {
  const [activeItem, setActiveItem] = useState<CarouselItemData | null>(null);

  useEffect(() => {
    if (activeItem) {
      document.body.classList.add("team-card-expanded");
    } else {
      document.body.classList.remove("team-card-expanded");
    }
    return () => {
      document.body.classList.remove("team-card-expanded");
    };
  }, [activeItem]);

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      {/* Page Heading (fades out when a card is active) */}
      <div
        className={`team-page-heading absolute top-10 left-0 w-full z-20 text-center pointer-events-none transition-all duration-500 ease-in-out ${activeItem ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <h1 className="text-white font-bold text-3xl md:text-4xl uppercase tracking-[0.25em]">
          Team
        </h1>
      </div>

      <Canvas
        style={{ touchAction: "none" }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        camera={{ position: [0, 0, 3.6], fov: 45 }}
      >
        <Suspense fallback={null}>
          <Carousel items={items} onActiveItemChange={setActiveItem} />
        </Suspense>
      </Canvas>

      {/* Overlay caption when an item is expanded */}
      {activeItem && <OpenedNameOverlay item={activeItem} />}
    </div>
  );
}
