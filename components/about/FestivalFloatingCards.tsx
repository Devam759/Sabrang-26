'use client';

import React from 'react';

const CARDS_DATA = [
  {
    title: 'PANACHE',
    subtitle: 'The Signature Fashion Runway',
    tag: 'Flagship Event',
    img: '/gallery/DSC00024.webp',
    posClass: 'top-[15%] left-[10%] md:left-[15%]',
    rotation: '-rotate-6',
  },
  {
    title: 'PRONITES',
    subtitle: 'Electrifying Live Music Nights',
    tag: 'Star Night',
    img: '/gallery/121A0025.webp',
    posClass: 'top-[20%] right-[10%] md:right-[15%]',
    rotation: 'rotate-6',
  },
  {
    title: '50+ EVENTS',
    subtitle: 'Cultural, Technical & E-Sports',
    tag: 'Non-stop Thrills',
    img: '/gallery/20251012_102712202_iOS.webp',
    posClass: 'bottom-[22%] left-[12%] md:left-[18%]',
    rotation: 'rotate-3',
  },
  {
    title: '₹2.5L+ PRIZE POOL',
    subtitle: 'Championing Raw Student Talent',
    tag: 'Glory & Rewards',
    img: '/gallery/DSC02686.webp',
    posClass: 'bottom-[18%] right-[12%] md:right-[18%]',
    rotation: '-rotate-3',
  },
];

export default function FestivalFloatingCards() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {CARDS_DATA.map((card, i) => (
        <div
          key={i}
          className={`floating-card-item absolute ${card.posClass} w-64 md:w-80 p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl ${card.rotation} transform-gpu transition-all`}
          style={{
            willChange: 'transform, opacity, filter',
          }}
        >
          <div className="relative h-40 md:h-48 w-full rounded-xl overflow-hidden mb-3">
            {/* Fallback & Image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-purple-800 animate-pulse" />
            <img
              src={card.img}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
              onError={(e) => {
                // If image load fails, hide image element gracefully
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-indigo-600/80 backdrop-blur-md text-[10px] font-semibold text-white uppercase tracking-wider">
              {card.tag}
            </span>
          </div>

          <div className="px-1 text-left">
            <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
              {card.title}
            </h4>
            <p className="text-xs text-white/70 font-medium">
              {card.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
