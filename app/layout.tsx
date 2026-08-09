import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import InitialLoader from '@/components/InitialLoader';
import TubesCursor from '@/components/TubesCursor';
import CursorFollower from '@/components/CursorFollower';
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
        <AuthProvider>
          <TubesCursor />
          <CursorFollower />
          <InitialLoader />
          <div className="min-h-screen flex flex-col bg-black text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="py-6 border-t border-white/10 bg-black text-center text-white/50 text-sm">
              &copy; {new Date().getFullYear()} Sabrang Festival. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
