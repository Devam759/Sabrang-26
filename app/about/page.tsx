import React from "react";
import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import AccordionGallery, {
  AccordionGalleryItem,
} from "@/components/about/AccordionGallery";
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
    image: "/panache-runway.png",
    link: "/events",
  },
  {
    id: "02",
    label: "Versevaad",
    category: "Literary Debates & Slam",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    image: "/versevaad.jpg",
    link: "/events",
  },
  {
    id: "03",
    label: "Echoes of Noor",
    category: "Sufi Night & Acoustics",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    image: "/echos-of-noor.png",
    link: "/events",
  },
  {
    id: "04",
    label: "Band Jam",
    category: "Battle of the Bands",
    desc: "Pure sonic warfare under the open sky — head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    image: "/events_posters/BANDJAM.webp",
    link: "/events",
  },
  {
    id: "05",
    label: "Dance Battles",
    category: "Solo & Street Dance",
    desc: "High-octane solo and duo street dance battles featuring hip-hop, popping, locking, and freestyle dance showdowns.",
    image: "/dance-battle.png",
    link: "/events",
  },
  {
    id: "06",
    label: "Step Up",
    category: "Group Choreography Showdown",
    desc: "Flawless synchronized group dance battles featuring power-packed choreography, thematic storytelling, and explosive energy.",
    image: "/step-up.jpg",
    link: "/events",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="w-full bg-[#000000] text-white min-h-screen">
        {/* Immersive pinned hero */}
        <AboutHero />

        {/* Pillars of Sabrang Accordion Gallery Section at the Bottom of About Page */}
        <section className="relative w-full bg-[#000000] text-white py-16 px-4 sm:px-8 md:px-16 border-t border-white/10 z-30">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[170px] pointer-events-none" />
          <div className="absolute bottom-10 left-0 w-[650px] h-[650px] bg-cyan-500/15 rounded-full blur-[190px] pointer-events-none" />

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
                Explore the flagship events and artistic pillars crafted to celebrate every dimension of sound, fashion, and art.
              </p>
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
            />
          </div>
        </section>
      </div>
    </>
  );
}
