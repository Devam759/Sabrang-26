import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Register – Sabrang 2026',
  description: 'Create your Sabrang 2026 account and register for events at the annual cultural festival.',
  openGraph: {
    title: 'Register – Sabrang 2026',
    description: 'Join Sabrang 2026 – the annual cultural festival.',
  },
  alternates: { canonical: '/register' },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
