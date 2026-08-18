"use client";

import React from "react";
import dynamic from "next/dynamic";

const HeroColoursOverBlack = dynamic(
  () => import("@/components/about/HeroColoursOverBlack"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#000000] -z-10" />
    ),
  }
);

export default function AboutBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <HeroColoursOverBlack />
    </div>
  );
}
