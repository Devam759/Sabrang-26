'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Sidebar from '../admin/Sidebar';

export default function ScannerLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }

      try {
        const [roleDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'roles', user.uid)).catch(() => null),
          getDoc(doc(db, 'users', user.uid)).catch(() => null),
        ]);

        const role = roleDoc?.exists() ? roleDoc.data()?.role : (userDoc?.exists() ? userDoc.data()?.role : 'admin');

        if (role === 'scanner' || role === 'admin') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch {
        setIsAuthenticated(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Firebase Configuration Required</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {FIREBASE_SETUP_MESSAGE}
          </p>
        </div>
      </div>
    );
  }

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={36} />
      </div>
    );
  }

  return (
    <div className="admin-portal-scope flex min-h-screen h-[100dvh] max-h-[100dvh] bg-[#f8fafc] text-slate-900 font-sans relative overflow-hidden">
      {/* Floating Sidebar Container */}
      <div className="relative z-50 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area with bounded viewport height for native scrolling */}
      <main 
        id="scanner-main-scroll"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 w-full overflow-y-auto relative z-10 bg-[#f8fafc] flex flex-col h-full min-h-0 admin-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 md:px-8 h-16 hidden md:flex items-center justify-between border-b border-slate-200 shadow-xs shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Sabrang 2026 Scanner
          </span>
        </header>

        {/* pt-20 provides clean clearance for 64px mobile navbar, md:pt-6 for desktop, with generous bottom padding */}
        <div className="pt-20 md:pt-6 p-4 sm:p-6 md:p-8 pb-28 md:pb-20 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
