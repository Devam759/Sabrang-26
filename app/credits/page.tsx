import { Metadata } from "next";
import CodePenCredits from "./CodePenCredits";
import JsonLd from "@/components/seo/JsonLd";
import { DEV_TEAM } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tech Team Credits | Sabrang 2026 | JKLU",
  description:
    "Meet the developers, web architects, and UI/UX designers behind the Sabrang 2026 digital platform at JK Lakshmipat University.",
  keywords: [
    ...DEV_TEAM.map((m) => m.name),
    ...DEV_TEAM.map((m) => `${m.name} JKLU`),
    ...DEV_TEAM.map((m) => `${m.name} Sabrang`),
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
    title: "Tech Team Credits | Sabrang 2026 | JKLU",
    description:
      "Meet the developers, web architects, and UI/UX designers behind the Sabrang 2026 digital platform at JK Lakshmipat University.",
    url: "https://sabrang.jklu.edu.in/credits",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1787060383/sabrang-2026/tech-team-credit/Devam-gupta.png",
        width: 800,
        height: 800,
        alt: "Sabrang 2026 Tech Team Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Team Credits | Sabrang 2026 | JKLU",
    description:
      "Meet the developers, web architects, and UI/UX designers behind the Sabrang 2026 platform.",
    images: [
      "https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1787060383/sabrang-2026/tech-team-credit/Devam-gupta.png",
    ],
  },
};

// Generate full Person and ImageObject schema for every single developer on the team
const teamPersonSchemas = DEV_TEAM.map((m) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: m.name,
  alternateName: [`${m.name} JKLU`, `${m.name} Sabrang`],
  jobTitle:
    m.name === "Devam Gupta"
      ? "Lead Developer & Web Architect"
      : "Developer, Sabrang 2026 Tech Team",
  url: "https://sabrang.jklu.edu.in/credits",
  image: {
    "@type": "ImageObject",
    url: m.avatar,
    contentUrl: m.avatar,
    caption: `${m.name} - Sabrang 2026 Developer, JK Lakshmipat University`,
    name: m.name,
  },
  sameAs: [m.linkedin, m.github, m.instagram].filter(Boolean),
  worksFor: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
}));

const techTeamOrgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sabrang 2026 Tech & Digital Team",
  parentOrganization: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
  url: "https://sabrang.jklu.edu.in/credits",
  member: DEV_TEAM.map((m) => ({
    "@type": "Person",
    name: m.name,
    image: m.avatar,
    jobTitle:
      m.name === "Devam Gupta"
        ? "Lead Developer & Web Architect"
        : "Developer, Sabrang 2026 Tech Team",
    url: "https://sabrang.jklu.edu.in/credits",
    sameAs: [m.linkedin, m.github, m.instagram].filter(Boolean),
  })),
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
      {teamPersonSchemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <JsonLd data={techTeamOrgSchema} />
      <JsonLd data={breadcrumbSchema} />
      <CodePenCredits />
    </>
  );
}
