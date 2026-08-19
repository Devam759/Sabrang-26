import type { Metadata } from "next";
import HomeClient from "@/components/layout/HomeClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "SABRANG 2026 | Sabrang JKLU | JK Lakshmipat University Fest",
  description:
    "SABRANG 2026 - JK Lakshmipat University's premier annual fest. Experience Sabrang JKLU with star-studded nights, cultural pro-shows, and thrilling competitions in Jaipur.",
  keywords: [
    "SABRANG 2026",
    "Sabrang JKLU",
    "Sabrang JKLU 2026",
    "JK Lakshmipat University Fest",
    "JKLU Annual Fest",
    "College Fest Jaipur 2026",
    "Cultural Fest Jaipur",
    "Technical Fest JKLU",
    "Sabrang Event Registration",
    "Panache Runway JKLU",
    "Step-Up Dance Battle",
    "Bandjam Concert",
    "Jaipur Fest October 2026",
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
        url: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png",
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
    images: ["https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png"],
  },
};

const festivalEventSchema = {
  "@context": "https://schema.org",
  "@type": "Festival",
  name: "Sabrang 2026",
  alternateName: ["Sabrang JKLU 2026", "Sabrang JKLU", "JKLU Fest 2026"],
  description:
    "JK Lakshmipat University's premier annual cultural and technical festival featuring pro-shows, flagship competitions, dance battles, and live concerts.",
  url: "https://sabrang.jklu.edu.in",
  startDate: "2026-10-23T09:00:00+05:30",
  endDate: "2026-10-25T22:00:00+05:30",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  inLanguage: "en-IN",
  isAccessibleForFree: false,
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
    alternateName: "JKLU",
    url: "https://jklu.edu.in",
  },
  audience: {
    "@type": "Audience",
    audienceType: "College Students",
  },
  image: ["https://sabrang.jklu.edu.in/sabrang-logo/sabrang-logo.png"],
  offers: {
    "@type": "Offer",
    url: "https://sabrang.jklu.edu.in/register",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    validFrom: "2026-08-01T00:00:00+05:30",
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
  ],
};

const summitImages = [
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060185/sabrang-2026/about/step-up.jpg"
];

const summitNames = [
  "PANACHE",
  "BANDJAM",
  "STEP-UP"
];

const summitBriefs = [
  "The ultimate fashion showdown. Assert dominance on the runway with style that speaks volumes.",
  "Pure sonic warfare under the open sky. The battle of the bands — raw, unfiltered, electric.",
  "Premier solo dance showdown. Technical mastery, freestyle finesse, and electric expression."
];

export default function Home() {
  return (
    <>
      <JsonLd data={festivalEventSchema} />
      <JsonLd data={breadcrumbSchema} />
      <HomeClient 
        summitImages={summitImages}
        summitNames={summitNames}
        summitBriefs={summitBriefs}
      />
    </>
  );
}

