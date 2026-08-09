import type { Metadata } from 'next';
import TeamClient from './TeamClient';

export const metadata: Metadata = {
  title: 'Our Team – Sabrang 2026',
  description: 'Meet the passionate organizers, coordinators, and leads behind Sabrang 2026.',
  openGraph: {
    title: 'Our Team – Sabrang 2026',
    description: 'Meet the team making Sabrang 2026 a reality.',
  },
  alternates: { canonical: '/team' },
};

export default function TeamPage() {
  return <TeamClient />;
}
