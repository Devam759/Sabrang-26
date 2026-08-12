import React from "react";
import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import AboutStoryContent from "@/components/about/AboutStoryContent";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "About Sabrang 2026 – JK Lakshmipat University Fest",
  description:
    "Learn about Sabrang 2026 — the annual flagship cultural & techno-management festival of JK Lakshmipat University celebrating talent, culture, and innovation in Jaipur.",
  keywords: [
    "About Sabrang",
    "Sabrang JKLU Story",
    "JK Lakshmipat University Cultural Fest",
    "Sabrang History",
    "JKLU Jaipur Fest",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/about" },
  openGraph: {
    title: "About Sabrang 2026 – JK Lakshmipat University Fest",
    description:
      "Enter Sabrang — the annual flagship festival of JKLU celebrating art, music, and innovation.",
    url: "https://sabrang.jklu.edu.in/about",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Sabrang 2026",
  description:
    "The story and vision behind Sabrang 2026 at JK Lakshmipat University.",
  url: "https://sabrang.jklu.edu.in/about",
  mainEntity: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchema} />
      <div className="w-full bg-[#000000] text-white min-h-screen">
        {/* Immersive pinned hero */}
        <AboutHero />

        {/* Editorial story content below the hero */}
        <AboutStoryContent />
      </div>
    </>
  );
}
