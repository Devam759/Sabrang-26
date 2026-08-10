import { Metadata } from 'next'; 
import SponsorsClient from './SponsorsClient';
import JsonLd from '@/components/common/JsonLd';

export const metadata: Metadata = {
  title: 'Sponsors & Partners | Sabrang 2026',
  description: 'Meet the sponsors and corporate partners supporting Sabrang 2026 festival events, cash prizes, and tech showcases.',
  keywords: ['Sabrang Sponsors', 'Partners', 'Corporate Sponsors', 'Fest Sponsorship', 'Sabrang 2026'],
  alternates: {
    canonical: 'https://sabrang.jklu.edu.in/sponsors',
  },
  openGraph: {
    title: 'Sponsors & Partners | Sabrang 2026',
    description: 'Meet the sponsors and corporate partners supporting Sabrang 2026.',
    url: 'https://sabrang.jklu.edu.in/sponsors',
    siteName: 'Sabrang 2026',
    type: 'website',
  },
};

export default function SponsorsPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sabrang 2026 Partners',
    url: 'https://sabrang.jklu.edu.in/sponsors',
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <SponsorsClient />
    </>
  );
}
