import { Metadata } from 'next'; 
import CreditsClient from './CreditsClient';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Tech Team Credits | Sabrang 2026',
  description: 'Meet the developers, web architects, and UI/UX designers behind the Sabrang 2026 digital platform.',
  keywords: ['Tech Team', 'Sabrang Developers', 'Credits', 'Web Team', 'Sabrang 2026'],
  alternates: {
    canonical: 'https://sabrang.jklu.edu.in/credits',
  },
  openGraph: {
    title: 'Tech Team Credits | Sabrang 2026',
    description: 'Meet the developers and designers behind Sabrang 2026.',
    url: 'https://sabrang.jklu.edu.in/credits',
    siteName: 'Sabrang 2026',
    type: 'website',
  },
};

export default function CreditsPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sabrang 2026 Tech Team',
    url: 'https://sabrang.jklu.edu.in/credits',
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <CreditsClient />
    </>
  );
}
