'use client';

import { Suspense, useState } from 'react';
import Dynamic from 'next/dynamic';
import { CarouselItemData } from './CarouselItem';

const Canvas = Dynamic(() => import('@react-three/fiber').then((mod) => mod.Canvas), {
  ssr: false,
});

const Carousel = Dynamic(() => import('./Carousel'), {
  ssr: false,
});

interface WebGLCarouselProps {
  items: CarouselItemData[];
  className?: string;
}

export default function WebGLCarousel({ items, className = 'w-full h-[70vh]' }: WebGLCarouselProps) {
  const [activeItem, setActiveItem] = useState<CarouselItemData | null>(null);

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <Canvas
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
      {activeItem && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-2xl px-8 py-3.5 rounded-full border border-white/20 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex items-center gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col text-left">
            <p className="text-white font-bold text-lg leading-tight">{activeItem.name || 'Team Member'}</p>
            <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider">{activeItem.role || 'Sabrang 2026 Core'}</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <span className="text-xs text-white/60 font-medium whitespace-nowrap">
            Click card to close
          </span>
        </div>
      )}
    </div>
  );
}
