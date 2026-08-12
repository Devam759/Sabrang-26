import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
  description:
    "SABRANG 2026 - JK Lakshmipat University's premier annual fest. Experience Sabrang JKLU with star-studded nights, cultural pro-shows, and thrilling competitions in Jaipur.",
  keywords: [
    "SABRANG 2026",
    "Sabrang JKLU",
    "Sabrang 2025",
    "JK Lakshmipat University Fest",
    "JKLU Annual Fest",
    "College Fest Jaipur",
    "Cultural Fest Jaipur",
    "Technical Fest JKLU",
    "Sabrang Event Registration",
    "Panache Runway JKLU",
    "Step-Up Dance Battle",
    "Bandjam Concert",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in",
  },
  openGraph: {
    title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
    description:
      "SABRANG 2026 - JK Lakshmipat University's premier annual fest. Experience Sabrang JKLU with star-studded nights and thrilling competitions.",
    url: "https://sabrang.jklu.edu.in",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
    images: [
      {
        url: "/sabrang-logo.png",
        width: 1200,
        height: 630,
        alt: "Sabrang 2026 JK Lakshmipat University Annual Fest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
    description:
      "SABRANG 2026 - JK Lakshmipat University's premier annual fest.",
    images: ["/sabrang-logo.png"],
  },
};

import IntroReveal from '@/components/effects/IntroReveal';

const festivalEventSchema = {
  "@context": "https://schema.org",
  "@type": "Festival",
  name: "Sabrang 2026",
  alternateName: "Sabrang JKLU 2026",
  description:
    "JK Lakshmipat University's premier annual cultural and technical festival featuring pro-shows, flagship competitions, dance battles, and live concerts.",
  url: "https://sabrang.jklu.edu.in",
  startDate: "2026-11-06T09:00:00+05:30",
  endDate: "2026-11-08T22:00:00+05:30",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "JK Lakshmipat University",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Near Mahindra SEZ, P.O. Mahapura, Ajmer Road",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302026",
      addressCountry: "IN",
    },
  },
  organizer: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
  image: ["https://sabrang.jklu.edu.in/sabrang%20logo.png"],
  offers: {
    "@type": "Offer",
    url: "https://sabrang.jklu.edu.in/register",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    validFrom: "2026-08-01T00:00:00+05:30",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={festivalEventSchema} />
      <IntroReveal />
      <HomeClient />
    </>
  );
}
