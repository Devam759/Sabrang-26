import { AuthProvider } from '@/components/auth/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import InitialLoader from '@/components/effects/InitialLoader';
import TubesCursor from '@/components/effects/TubesCursor';
import CursorFollower from '@/components/effects/CursorFollower';
import { InteractionProvider } from '@/components/InteractionContext';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sabrang - College Festival Management',
  description: 'Manage and register for Sabrang college festival events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InteractionProvider>
          <AuthProvider>
            <TubesCursor />
            <CursorFollower />
            <InitialLoader />
            <div className="min-h-screen flex flex-col bg-black text-white overflow-x-clip">
              <Navbar />
              <main className="flex-grow w-full">
                {children}
              </main>
              <footer className="py-6 border-t border-white/10 bg-black text-center text-white/50 text-sm">
                &copy; {new Date().getFullYear()} Sabrang Festival. All rights reserved.
              </footer>
            </div>
          </AuthProvider>
        </InteractionProvider>
      </body>
    </html>
  );
}
