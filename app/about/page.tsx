import React from "react";
import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import PillarsSection from "@/components/about/PillarsSection";
import { AccordionGalleryItem } from "@/components/about/AccordionGallery";
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
    "What is Sabrang",
    "Sabrang 2026 About",
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
    alternateName: "JKLU",
    url: "https://jklu.edu.in",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sabrang.jklu.edu.in",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: "https://sabrang.jklu.edu.in/about",
    },
  ],
};

const PILLARS_ITEMS: AccordionGalleryItem[] = [
  {
    id: "01",
    label: "Panache",
    category: "Fashion & High Art",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography and fierce personal expression on a grand national stage.",
    image: "/menu-scroll-covers/panache-runway.png",
    link: "/events",
  },
  {
    id: "02",
    label: "Echoes of Noor",
    category: "Sufi Night & Acoustics",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    image: "/menu-scroll-covers/echos-of-noor.png",
    link: "/events",
  },
  {
    id: "03",
    label: "Sync",
    category: "Group Dance Showdown",
    desc: "Flawless synchronized group choreography battles featuring power-packed movement, thematic storytelling, and explosive stage energy.",
    image: "/menu-scroll-covers/dance-battle.png",
    link: "/events",
  },
  {
    id: "04",
    label: "Step Up",
    category: "Solo Dance Competition",
    desc: "The premier solo dance competition celebrating technical mastery, freestyle finesse, and electric personal stage expression.",
    image: "/menu-scroll-covers/step-up.jpg",
    link: "/events",
  },
  {
    id: "05",
    label: "Versevaad",
    category: "Literary Debates & Slam",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    image: "/menu-scroll-covers/versevaad.jpg",
    link: "/events",
  },
  {
    id: "06",
    label: "Bandjam",
    category: "Battle of the Bands",
    desc: "Pure sonic warfare under the open sky — head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    image: "/events_posters/BANDJAM.webp",
    link: "/events",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="about-page-root w-full bg-[#000000] text-white min-h-screen">
        {/* Immersive pinned hero */}
        <AboutHero />

        {/* Pillars of Sabrang Accordion Gallery Showcase with Purple Fluid Canvas */}
        <PillarsSection items={PILLARS_ITEMS} />
      </div>
    </>
  );
}

