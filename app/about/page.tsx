import React from "react";
import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import {
  CoreSpectrumsSection,
  AboutContentSections,
} from "@/components/about/AboutSections";
import AccordionGallery, {
  AccordionGalleryItem,
} from "@/components/about/AccordionGallery";
import JsonLd from "@/components/seo/JsonLd";
import AboutBackground from "@/components/about/AboutBackground";

export const metadata: Metadata = {
  title: "About Sabrang 2026 | JKLU Fest",
  description:
    "Learn about Sabrang 2026, the annual cultural festival of JK Lakshmipat University celebrating talent, music, dance, fashion, and arts in Jaipur.",
  keywords: [
    "About Sabrang",
    "Sabrang JKLU Story",
    "JK Lakshmipat University Cultural Fest",
    "Sabrang History",
    "JKLU Jaipur Fest",
    "What is Sabrang",
    "Sabrang 2026 About",
    "Sabrang Meaning",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/about" },
  openGraph: {
    title: "About Sabrang 2026",
    description:
      "Enter Sabrang, the annual flagship festival of JKLU celebrating art, music, design, and innovation.",
    url: "https://sabrang.jklu.edu.in/about",
  },
};


const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Sabrang 2026",
  description:
    "The story, theme, and vision behind Sabrang 2026 at JK Lakshmipat University.",
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
    category: "Fashion · Ultraviolet Haute Couture",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography and fierce personal expression on a grand national stage.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082812/sabrang-2026/about-flagship-events-pics/PANACHE.jpg",
    link: "/events",
  },
  {
    id: "02",
    label: "Versevaad",
    category: "Literary · Laser Verbal Slam",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082933/sabrang-2026/about-flagship-events-pics/VERSEVAAD.jpg",
    link: "/events",
  },
  {
    id: "03",
    label: "Echoes of Noor",
    category: "Music · Prismatic Sufi Harmonies",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082810/sabrang-2026/about-flagship-events-pics/ECHOES-OF-NOOR.jpg",
    link: "/events",
  },
  {
    id: "04",
    label: "Band Jam",
    category: "Music · Infrared Sonic Blast",
    desc: "Pure sonic warfare under the open sky: head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082808/sabrang-2026/about-flagship-events-pics/BANDJAM.jpg",
    link: "/events",
  },
  {
    id: "05",
    label: "Sync",
    category: "Dance · Chromatic Group Resonance",
    desc: "High-energy synchronized group dance showdowns featuring sharp formations, thematic choreography, and electric crew dynamics.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082815/sabrang-2026/about-flagship-events-pics/SYNC.jpg",
    link: "/events",
  },
  {
    id: "06",
    label: "Step Up",
    category: "Choreography · Solo & Duo Street Battles",
    desc: "Fierce solo and duo street dance battles featuring popping, locking, hip-hop, and freestyle footwork on the arena floor.",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787082813/sabrang-2026/about-flagship-events-pics/STEPUP.jpg",
    link: "/events",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="relative w-full bg-[#000000] text-white min-h-screen">
        {/* Full-Page Persistent 3D Fluid Liquid Ribbon Background */}
        <AboutBackground />

        {/* 1. Immersive 3D pinned hero & story reveal */}

        <div className="relative z-10">
          <AboutHero />
        </div>


        {/* 2. THE CORE SPECTRUMS (Section 02 - Four Pillars) directly after "What is Sabrang" */}
        <div className="relative z-10">
          <CoreSpectrumsSection />
        </div>

        {/* 3. Structured Content Blocks: Why Sabrang OP, Beyond Competitions, Recombination */}
        <div className="relative z-10">
          <AboutContentSections />
        </div>


        {/* 3. Flagship Showdowns (Pillars of Sabrang Accordion Showcase) */}
        <section className="relative w-full bg-[#030206]/75 backdrop-blur-sm text-white py-24 px-4 sm:px-8 md:px-16 border-t border-white/10 z-30 overflow-hidden">
          {/* Background Ambient Glows */}
          <div
            className="absolute top-10 right-10 w-[650px] h-[650px] rounded-full pointer-events-none opacity-25"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(168,85,247,0.05) 45%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-10 left-10 w-[700px] h-[700px] rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.04) 45%, transparent 70%)" }}
          />

          <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Section Header */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2
                className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
                style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
              >
                Signature Showdowns
              </h2>
            </div>

            {/* Accordion Gallery Showcase */}
            <AccordionGallery
              items={PILLARS_ITEMS}
              defaultIndex={2}
              expandRatio={0.52}
              trigger="hover"
              accentColor="#c084fc"
              overlayColor="#060010"
              textColor="#ffffff"
              grayscale={false}
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
            />
          </div>
        </section>
      </div>
    </>
  );
}
