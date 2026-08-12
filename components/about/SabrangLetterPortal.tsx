"use client";

import React from "react";

export default function SabrangLetterPortal() {
  const letters = [
    { char: "S", key: "letter-S" },
    { char: "A", key: "letter-A1" },
    { char: "B", key: "letter-B" },
    { char: "R", key: "letter-R" },
    { char: "A", key: "letter-A2" },
    { char: "N", key: "letter-N" },
    { char: "G", key: "letter-G" },
  ];

  return (
    <div className="relative flex items-center justify-center select-none py-4 px-2 w-full max-w-[95vw]">
      {/* Glow highlight behind center aperture */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-pink-500/20 blur-3xl rounded-full opacity-60 pointer-events-none" />

      <div className="relative flex items-center justify-center gap-[0.02em] font-black tracking-tighter uppercase text-center w-full">
        {letters.map((item, idx) => (
          <span
            key={idx}
            className={`sabrang-letter ${item.key} inline-block font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400`}
            style={{
              fontSize: "clamp(3.8rem, 15.5vw, 15rem)",
              lineHeight: 0.9,
              WebkitTextStroke: "1px rgba(255,255,255,0.25)",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
}
