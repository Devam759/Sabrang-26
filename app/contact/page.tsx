import { Metadata } from "next";
import ContactClient from "./ContactClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Contact Us – Sabrang 2026 | JKLU",
  description:
    "Get in touch with the Sabrang 2026 organizing team. Reach out to our organizing heads or send an email to sabrang@jklu.edu.in for event queries, sponsorship, or media.",
  keywords: [
    "Contact Sabrang",
    "Sabrang 2026 Organizing Team",
    "Sabrang Email",
    "JKLU Fest Contact",
    "Sabrang Sponsorship Enquiry",
    "Sabrang 2026 Help",
  ],
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/contact",
  },
  openGraph: {
    title: "Contact Us – Sabrang 2026 | JKLU",
    description:
      "Connect with the Sabrang 2026 organizing heads and festival committee at JKLU.",
    url: "https://sabrang.jklu.edu.in/contact",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Sabrang 2026 Contact Page",
  description:
    "Contact details for the Sabrang 2026 organizing team and official helpdesk at JK Lakshmipat University.",
  url: "https://sabrang.jklu.edu.in/contact",
  mainEntity: {
    "@type": "Organization",
    name: "Sabrang 2026 Organizing Committee",
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: "JK Lakshmipat University",
      url: "https://jklu.edu.in",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "sabrang@jklu.edu.in",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
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
      name: "Contact",
      item: "https://sabrang.jklu.edu.in/contact",
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={contactSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ContactClient />
    </>
  );
}
