"use client";

import React, { useState } from "react";
import AccordionGallery, {
  AccordionGalleryItem,
} from "./AccordionGallery";
import { galleryItems, type GalleryItem } from "@/lib/highlights-data";
import PosterDetailModal from "@/components/events/PosterDetailModal";
import HeroColoursOverBlack from "./HeroColoursOverBlack";

interface PillarsSectionProps {
  items: AccordionGalleryItem[];
}

export default function PillarsSection({ items }: PillarsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<GalleryItem | null>(null);

  const handleCardClick = (item: AccordionGalleryItem) => {
    const labelNorm = (item.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Find matching event from the events gallery archive
    const matched = galleryItems.find((g) => {
      const titleNorm = g.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        titleNorm === labelNorm ||
        titleNorm.includes(labelNorm) ||
        labelNorm.includes(titleNorm)
      );
    });

    if (matched) {
      setSelectedEvent(matched);
    } else {
      setSelectedEvent({
        id: Number(item.id) || 1,
        image: item.image,
        title: item.label,
        category: item.category || "Flagship Event",
        venue: "Main Stage",
        year: 2026,
        alt: item.alt || item.label,
        description: item.desc || item.description || "",
      });
    }
  };

  return (
    <>
      <section className="relative w-full overflow-hidden bg-[#000000] text-white pt-14 pb-8 sm:pb-10 px-4 sm:px-8 md:px-16 border-t border-white/10 z-30">
        {/* Layer 0: Purple Fluid Ribbon Sculpture background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <HeroColoursOverBlack palette="purple" />
        </div>

        {/* Layer 1: Soft atmospheric edge vignette */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2
              className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
            >
              Pillars of Sabrang
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
              Explore the flagship events and artistic pillars crafted to celebrate
              every dimension of sound, fashion, and art.
            </p>
          </div>

          {/* Accordion Gallery Showcase */}
          <AccordionGallery
            items={items}
            defaultIndex={2}
            expandRatio={0.52}
            trigger="hover"
            accentColor="#c084fc"
            overlayColor="#060010"
            textColor="#ffffff"
            grayscale={true}
            showLabels={true}
            duration={0.6}
            ease="power3.out"
            parallax={0.5}
            tilt={8}
            stagger={0.06}
            height={520}
            gap={12}
            radius={20}
            orientation="horizontal"
            onItemClick={handleCardClick}
          />
        </div>
      </section>

      {/* Reusable Event Detail Modal (identical to Events page modal) */}
      {selectedEvent && (
        <PosterDetailModal
          item={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
