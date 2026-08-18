import type { Metadata } from "next";
import FAQClient from "./FAQClient";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "FAQ – Sabrang 2026",
  description:
    "Frequently asked questions regarding registrations, pass pickup, event slots, accommodation, and venue guidelines for Sabrang 2026 at JKLU Jaipur.",
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
    title: "FAQ – Sabrang 2026",
    description:
      "Find answers to common questions about Sabrang 2026 registrations, passes, schedules, accommodation, and venue guidelines.",
    url: "https://sabrang.jklu.edu.in/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sabrang is the annual cultural festival of JK Lakshmipat University (JKLU), Jaipur. It is a vibrant confluence of music, dance, fashion, art, and youth celebration held every year on the JKLU campus.",
      },
    },
    {
      "@type": "Question",
      name: "When is Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sabrang 2026 is scheduled for October 23–25, 2026, at the JK Lakshmipat University campus, Ajmer Road, Jaipur.",
      },
    },
    {
      "@type": "Question",
      name: "How can I register for events at Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can register online through the official Sabrang 2026 registration portal at sabrang.jklu.edu.in/register. Create an account, choose your events, and complete the payment process to confirm your spot.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the venue for Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sabrang 2026 takes place on the campus of JK Lakshmipat University, near Mahindra SEZ, P.O. Mahapura, Ajmer Road, Jaipur, Rajasthan – 302026.",
      },
    },
    {
      "@type": "Question",
      name: "Are passes required for Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, most flagship events and pro-shows require a valid pass. You can purchase passes online via the registration portal or at the event venue, subject to availability.",
      },
    },
    {
      "@type": "Question",
      name: "Is accommodation available for outstation participants?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Limited accommodation arrangements may be available for outstation participants. Please contact the organizing team at sabrang@jklu.edu.in or visit the contact page for more details.",
      },
    },
    {
      "@type": "Question",
      name: "Can students from other colleges participate in Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Sabrang 2026 is open to students from all colleges and universities across India. Register online to participate in events or purchase pro-show passes.",
      },
    },
    {
      "@type": "Question",
      name: "What flagship events are featured at Sabrang 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sabrang 2026 features flagship events including PANACHE (fashion runway), ECHOES OF NOOR (Sufi night & acoustics), SYNC (group dance showdown), STEP-UP (solo dance competition), VERSEVAAD (literary debates & slam), and BANDJAM (battle of the bands).",
      },
    },
    {
      "@type": "Question",
      name: "How do I contact the Sabrang 2026 organizing team?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can reach the organizing team via the Contact page at sabrang.jklu.edu.in/contact, or email us at sabrang@jklu.edu.in.",
      },
    },
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
