import { Metadata } from 'next'; 
import GalleryClient from './GalleryClient';
import JsonLd from '@/components/common/JsonLd';

export const metadata: Metadata = {
  title: 'Gallery | Sabrang 2026',
  description: 'Explore photos and memorable highlights from Sabrang 2026, featuring flagship events, cultural performances, bandjam, fashion show, and DJ nights.',
  keywords: ['Sabrang Gallery', 'Sabrang Photos', 'Event Highlights', 'College Fest Photos', 'Sabrang 2026'],
  alternates: {
    canonical: 'https://sabrang.jklu.edu.in/gallery',
  },
  openGraph: {
    title: 'Gallery | Sabrang 2026',
    description: 'Explore photos and memorable highlights from Sabrang 2026.',
    url: 'https://sabrang.jklu.edu.in/gallery',
    siteName: 'Sabrang 2026',
    type: 'website',
  },
};

export default function GalleryPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Sabrang 2026 Photo Gallery',
    description: 'Official photo gallery of Sabrang 2026 festival events',
    url: 'https://sabrang.jklu.edu.in/gallery',
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <GalleryClient />
    </>
  );
}
