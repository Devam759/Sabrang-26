import { Metadata } from "next";
import GalleryClient from "./GalleryClient";
import JsonLd from "@/components/seo/JsonLd";
import SubtleFooter from "@/components/layout/SubtleFooter";

export const metadata: Metadata = {
  title: "Gallery – Sabrang 2026 | JKLU Cultural Fest",
  description:
    "Explore photos and memorable highlights from Sabrang — featuring flagship events, cultural performances, Bandjam, Panache fashion show, Echoes of Noor, and DJ nights at JKLU.",
  keywords: [
    "Sabrang Gallery",
    "Sabrang 2026 Photos",
    "JKLU Fest Photos",
    "Sabrang Event Highlights",
    "College Fest Gallery Jaipur",
    "Sabrang 2025 Gallery",
    "Sabrang Cultural Photos",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/gallery",
  },
  openGraph: {
    title: "Gallery – Sabrang 2026 | JKLU Cultural Fest",
    description:
      "Explore photos and memorable highlights from Sabrang 2026 flagship events and cultural performances.",
    url: "https://sabrang.jklu.edu.in/gallery",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

const gallerySchema = {
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  name: "Sabrang 2026 Photo Gallery",
  description:
    "Official photo gallery of the Sabrang annual cultural festival at JK Lakshmipat University, Jaipur.",
  url: "https://sabrang.jklu.edu.in/gallery",
  author: {
    "@type": "Organization",
    name: "JK Lakshmipat University",
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
      name: "Gallery",
      item: "https://sabrang.jklu.edu.in/gallery",
    },
  ],
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd data={gallerySchema} />
      <JsonLd data={breadcrumbSchema} />
      <GalleryClient />
      <SubtleFooter />
    </>
  );
}
