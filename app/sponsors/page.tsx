import { Metadata } from "next";
import SponsorsClient from "./SponsorsClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Sponsors & Partners – Sabrang 2026 | JKLU",
  description:
    "Meet the sponsors and corporate partners supporting Sabrang 2026 — the annual cultural and technical festival of JK Lakshmipat University, Jaipur.",
  keywords: [
    "Sabrang Sponsors",
    "Sabrang 2026 Partners",
    "Corporate Sponsors JKLU",
    "Fest Sponsorship Jaipur",
    "Sabrang 2026 Sponsor",
    "Sponsor Sabrang JKLU",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/sponsors",
  },
  openGraph: {
    title: "Sponsors & Partners – Sabrang 2026 | JKLU",
    description:
      "Meet the corporate sponsors and partners powering Sabrang 2026 at JK Lakshmipat University.",
    url: "https://sabrang.jklu.edu.in/sponsors",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

const sponsorsSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sabrang 2026 Sponsors & Partners",
  description:
    "Official list of sponsors and corporate partners supporting Sabrang 2026 at JK Lakshmipat University.",
  url: "https://sabrang.jklu.edu.in/sponsors",
  about: {
    "@type": "Festival",
    name: "Sabrang 2026",
    url: "https://sabrang.jklu.edu.in",
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
      name: "Sponsors",
      item: "https://sabrang.jklu.edu.in/sponsors",
    },
  ],
};

export default function SponsorsPage() {
  return (
    <>
      <JsonLd data={sponsorsSchema} />
      <JsonLd data={breadcrumbSchema} />
      <SponsorsClient />
    </>
  );
}
