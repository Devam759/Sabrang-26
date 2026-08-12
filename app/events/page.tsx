import type { Metadata } from "next";
import GalleryHighlights from "@/components/events/GalleryHighlights";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Events & Competitions – Sabrang 2026",
  description:
    "Explore the flagship events, competitions, pro-shows, Panache runway, Step-Up dance battles, and musical concerts at Sabrang 2026 JKLU.",
  keywords: [
    "Sabrang Events",
    "Sabrang 2026 Competitions",
    "Panache Runway JKLU",
    "Step-Up Dance Battle",
    "Bandjam Contest",
    "Pro Shows Sabrang",
    "JKLU Fest Events",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/events" },
  openGraph: {
    title: "Events & Competitions – Sabrang 2026",
    description:
      "Explore flagship competitions, live pro-shows, and cultural battles at Sabrang 2026.",
    url: "https://sabrang.jklu.edu.in/events",
  },
};

const eventsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Sabrang 2026 Flagship Events",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "PANACHE - Fashion Show",
      description: "The premier runway fashion competition at Sabrang 2026.",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "BANDJAM - Battle of the Bands",
      description: "Live musical competition featuring top college bands.",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "STEP-UP - Dance Battle",
      description: "Synchronized tactical dance competition.",
    },
  ],
};

export default function EventsPage() {
  return (
    <>
      <JsonLd data={eventsSchema} />
      <GalleryHighlights />
    </>
  );
}
