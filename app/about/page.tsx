import React from 'react';
import AboutHero from '@/components/about/AboutHero';
import AboutStoryContent from '@/components/about/AboutStoryContent';

export const metadata = {
  title: 'About — Sabrang 2026 | Cultural & Techno-Management Fest, JKLU Jaipur',
  description:
    'Enter Sabrang — the annual flagship festival of JK Lakshmipat University celebrating talent, culture, and innovation in Jaipur.',
};

export default function AboutPage() {
  return (
    <div className="w-full bg-[#000000] text-white min-h-screen">
      {/* Immersive pinned hero — Shopify Spring 2026 inspired zoom-through */}
      <AboutHero />

      {/* Editorial story content below the hero */}
      <AboutStoryContent />
    </div>
  );
}
