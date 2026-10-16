import type { Metadata } from "next";
import FAQClient from "./FAQClient";
import JsonLd from "@/components/seo/JsonLd";

import { FAQS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ | Sabrang 2026",
  description:
    "Frequently asked questions regarding registrations, passes, event slots, accommodation, and venue guidelines for Sabrang 2026 at JKLU Jaipur.",
  keywords: [
    "Sabrang FAQ",
    "Sabrang 2026 Questions",
    "Sabrang Passes",
    "Sabrang Event Entry",
    "JKLU Fest Help",
    "Sabrang 2026 Registration FAQ",
    "Sabrang Accommodation",
    "Sabrang Venue",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/faq" },
  openGraph: {
    title: "FAQ | Sabrang 2026",
    description:
      "Find answers to common questions about Sabrang 2026 registrations, passes, schedules, accommodation, and venue guidelines.",
    url: "https://sabrang.jklu.edu.in/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
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
      name: "FAQ",
      item: "https://sabrang.jklu.edu.in/faq",
    },
  ],
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <FAQClient />
    </>
  );
}
