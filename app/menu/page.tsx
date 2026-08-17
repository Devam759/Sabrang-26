import type { Metadata } from "next";
import MenuClient from "./MenuClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Navigation Menu | SABRANG 2026",
  description:
    "Explore full navigation menu for Sabrang 2026 - JK Lakshmipat University's annual fest. Access event registration, pro-shows, schedule, gallery, and team contacts.",
  keywords: [
    "Sabrang 2026 Navigation",
    "Sabrang Menu",
    "Sabrang JKLU Events",
    "College Fest Navigation",
    "Sabrang Schedule",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/menu",
  },
  openGraph: {
    title: "Navigation Menu | SABRANG 2026",
    description:
      "Explore full navigation menu for Sabrang 2026 - JK Lakshmipat University's annual fest.",
    url: "https://sabrang.jklu.edu.in/menu",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Navigation Menu | SABRANG 2026",
    description:
      "Explore full navigation menu for Sabrang 2026 - JK Lakshmipat University's annual fest.",
  },
};

const menuPageSchema = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: "Sabrang 2026 Menu",
  url: "https://sabrang.jklu.edu.in/menu",
  hasPart: [
    { "@type": "WebPage", name: "Home", url: "https://sabrang.jklu.edu.in/" },
    { "@type": "WebPage", name: "About", url: "https://sabrang.jklu.edu.in/about" },
    { "@type": "Events", name: "Events", url: "https://sabrang.jklu.edu.in/events" },
    { "@type": "WebPage", name: "Schedule", url: "https://sabrang.jklu.edu.in/schedule" },
    { "@type": "WebPage", name: "Gallery", url: "https://sabrang.jklu.edu.in/gallery" },
    { "@type": "WebPage", name: "Sponsors", url: "https://sabrang.jklu.edu.in/sponsors" },
    { "@type": "WebPage", name: "Team", url: "https://sabrang.jklu.edu.in/team" },
    { "@type": "WebPage", name: "Register", url: "https://sabrang.jklu.edu.in/register" },
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
      name: "Menu",
      item: "https://sabrang.jklu.edu.in/menu",
    },
  ],
};

export default function MenuPage() {
  return (
    <>
      <JsonLd data={menuPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <MenuClient />
    </>
  );
}
