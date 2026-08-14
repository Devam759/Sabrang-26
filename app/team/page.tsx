import type { Metadata } from "next";
import TeamClient from "./TeamClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Student Organizing Team – Sabrang 2026",
  description:
    "Meet the student-led Organizing Heads and Core Committees of JK Lakshmipat University behind Sabrang 2026.",
  keywords: [
    "Sabrang Team",
    "Sabrang 2026 Organizers",
    "Kartik Sharma Sabrang",
    "Rishika Singh Sabrang",
    "Gurseerat Kaur Sabrang",
    "Pratigya Bomb Sabrang",
    "JKLU Student Committees",
    "Sabrang Leadership",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/team" },
  openGraph: {
    title: "Student Organizing Team – Sabrang 2026",
    description:
      "Meet the Organizing Heads and Core Committees behind Sabrang 2026 at JKLU.",
    url: "https://sabrang.jklu.edu.in/team",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
  },
};

const teamSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sabrang 2026 Student Organizing Committee",
  parentOrganization: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
  member: [
    { "@type": "Person", name: "Kartik Sharma", jobTitle: "Organizing Head" },
    { "@type": "Person", name: "Rishika Singh", jobTitle: "Organizing Head" },
    { "@type": "Person", name: "Gurseerat Kaur", jobTitle: "Organizing Head" },
    { "@type": "Person", name: "Pratigya Bomb", jobTitle: "Organizing Head" },
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
      name: "Team",
      item: "https://sabrang.jklu.edu.in/team",
    },
  ],
};

export default function TeamPage() {
  return (
    <>
      <JsonLd data={teamSchema} />
      <JsonLd data={breadcrumbSchema} />
      <TeamClient />
    </>
  );
}
