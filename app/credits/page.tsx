import { Metadata } from "next";
import CodePenCredits from "./CodePenCredits";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Tech Team Credits | Sabrang 2026",
  description:
    "Meet the developers, web architects, and UI/UX designers behind the Sabrang 2026 digital platform at JK Lakshmipat University.",
  keywords: [
    "Tech Team",
    "Sabrang Developers",
    "Credits",
    "Web Team",
    "Sabrang 2026",
    "JKLU Web Developers",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/credits",
  },
  openGraph: {
    title: "Tech Team Credits | Sabrang 2026",
    description: "Meet the developers and designers behind Sabrang 2026.",
    url: "https://sabrang.jklu.edu.in/credits",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sabrang 2026 Tech & Digital Team",
  parentOrganization: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
  url: "https://sabrang.jklu.edu.in/credits",
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
      name: "Credits",
      item: "https://sabrang.jklu.edu.in/credits",
    },
  ],
};

export default function CreditsPage() {
  return (
    <>
      <JsonLd data={jsonLdData} />
      <JsonLd data={breadcrumbSchema} />
      <CodePenCredits />
    </>
  );
}
