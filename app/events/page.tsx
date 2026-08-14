import type { Metadata } from "next";
import GalleryHighlights from "@/components/events/GalleryHighlights";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Events & Competitions – Sabrang 2026",
  description:
    "Explore all flagship events, competitions, pro-shows, Panache runway, Step-Up dance battles, Versevaad, Echoes of Noor, and Bandjam concerts at Sabrang 2026 JKLU.",
  keywords: [
    "Sabrang Events",
    "Sabrang 2026 Competitions",
    "Panache Runway JKLU",
    "Step-Up Dance Battle",
    "Bandjam Contest",
    "Pro Shows Sabrang",
    "JKLU Fest Events",
    "Versevaad Sabrang",
    "Echoes of Noor",
    "Dance Battle JKLU",
    "Sabrang 2026 Schedule Events",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/events" },
  openGraph: {
    title: "Events & Competitions – Sabrang 2026",
    description:
      "Explore flagship competitions, live pro-shows, and cultural battles at Sabrang 2026 JKLU.",
    url: "https://sabrang.jklu.edu.in/events",
  },
};

const eventsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Sabrang 2026 Flagship Events",
  url: "https://sabrang.jklu.edu.in/events",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "PANACHE – Fashion & Runway Show",
      description:
        "The signature haute couture runway where fashion design meets theatrical choreography on a grand national stage.",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "BANDJAM – Battle of the Bands",
      description:
        "Live musical competition featuring top college bands in head-to-head rock and fusion battles.",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "STEP-UP – Group Dance Battle",
      description:
        "Synchronized group dance competition featuring power-packed choreography and explosive energy.",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "VERSEVAAD – Literary Debates & Slam",
      description:
        "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "ECHOES OF NOOR – Sufi Night & Acoustics",
      description:
        "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances.",
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "DANCE BATTLES – Solo & Street Dance",
      description:
        "High-octane solo and duo street dance battles featuring hip-hop, popping, locking, and freestyle showdowns.",
    },
  ],
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
      name: "Events",
      item: "https://sabrang.jklu.edu.in/events",
    },
  ],
};

export default function EventsPage() {
  return (
    <>
      <JsonLd data={eventsSchema} />
      <JsonLd data={breadcrumbSchema} />
      <GalleryHighlights />
    </>
  );
}
