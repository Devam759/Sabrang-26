import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Register & Passes – Sabrang 2026',
  description: 'Register online for Sabrang 2026 events, pro-show entry passes, fashion shows, dance battles, and band jam competitions at JKLU.',
  keywords: [
    'Register Sabrang 2026',
    'Sabrang Event Entry Pass',
    'Sabrang Registration Form',
    'JKLU Fest Registration',
    'Sabrang Participant Signup',
  ],
  alternates: { canonical: 'https://sabrang.jklu.edu.in/register' },
  openGraph: {
    title: 'Register & Passes – Sabrang 2026',
    description: 'Create your account and register for Sabrang 2026 flagship competitions and pro-shows.',
    url: 'https://sabrang.jklu.edu.in/register',
  },
};

const registerSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sabrang 2026 Registration Portal',
  description: 'Online registration for Sabrang 2026 events and entry passes.',
  url: 'https://sabrang.jklu.edu.in/register',
  potentialAction: {
    '@type': 'RegisterAction',
    target: 'https://sabrang.jklu.edu.in/register',
  },
};

export default function RegisterPage() {
  return (
    <>
      <JsonLd data={registerSchema} />
      <RegisterClient />
    </>
  );
}
