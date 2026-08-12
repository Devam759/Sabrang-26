import type { Metadata } from 'next';
import FAQClient from './FAQClient';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'FAQ – Sabrang 2026',
  description: 'Frequently asked questions regarding registrations, pass pickup, event slots, accommodation, and venue guidelines for Sabrang 2026 at JKLU.',
  keywords: [
    'Sabrang FAQ',
    'Sabrang 2026 Questions',
    'Sabrang Passes',
    'Sabrang Event Entry',
    'JKLU Fest Help',
  ],
  alternates: { canonical: 'https://sabrang.jklu.edu.in/faq' },
  openGraph: {
    title: 'FAQ – Sabrang 2026',
    description: 'Find answers to common questions about Sabrang 2026 registrations, schedules, and guidelines.',
    url: 'https://sabrang.jklu.edu.in/faq',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Sabrang 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sabrang is the annual flagship cultural and technical festival of JK Lakshmipat University (JKLU), Jaipur.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I register for events at Sabrang 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can register online through the official Sabrang 2026 portal on the registration page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is the venue for Sabrang 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sabrang 2026 takes place on the campus of JK Lakshmipat University, near Mahindra SEZ, Ajmer Road, Jaipur.',
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <FAQClient />
    </>
  );
}
