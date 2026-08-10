import { Metadata } from 'next';
import ContactClient from './ContactClient';
import JsonLd from '@/components/common/JsonLd';

export const metadata: Metadata = {
  title: 'Contact Us | Sabrang 2026',
  description: 'Get in touch with the Sabrang 2026 organizing team. Reach out to our organizing heads or send an email to sabrang@jklu.edu.in.',
  keywords: ['Contact Sabrang', 'Sabrang 2026 Organizing Team', 'Kartik Sharma Sabrang', 'Rishika Singh Sabrang', 'Gurseerat Kaur Sabrang', 'Pratigya Bomb Sabrang', 'JKLU Fest Contact'],
  alternates: {
    canonical: 'https://sabrang.jklu.edu.in/contact',
  },
  openGraph: {
    title: 'Contact Us | Sabrang 2026',
    description: 'Connect with the Sabrang 2026 organizing heads and festival committee.',
    url: 'https://sabrang.jklu.edu.in/contact',
    siteName: 'Sabrang 2026',
    type: 'website',
  },
};

export default function ContactPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Sabrang 2026 Contact Page',
    description: 'Contact details for Sabrang 2026 organizing heads and official helpdesk.',
    url: 'https://sabrang.jklu.edu.in/contact',
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <ContactClient />
    </>
  );
}
