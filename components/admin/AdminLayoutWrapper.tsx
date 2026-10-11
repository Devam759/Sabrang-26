'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';
import LiquidBackground from './LiquidBackground';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    setMounted(true);

    // Early check: if sessionStorage already says scanner, redirect immediately
    // before Firebase even initializes. This prevents any flash.
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('sabrang_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'scanner') {
            window.location.href = '/scanner';
            return; // Don't even set up the auth listener
          }
        }
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }

      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const [roleDoc, userDoc] = await Promise.all([
          Promise.race([getDoc(doc(db, 'roles', user.uid)), timeout]).catch(() => null),
          Promise.race([getDoc(doc(db, 'users', user.uid)), timeout]).catch(() => null),
        ]);

        let role = 'admin';
        if (roleDoc && 'exists' in roleDoc && roleDoc.exists()) {
          role = roleDoc.data()?.role || 'admin';
        } else if (userDoc && 'exists' in userDoc && userDoc.exists()) {
          role = userDoc.data()?.role || 'admin';
        }

        if (role === 'scanner') {
          window.location.href = '/scanner';
          return;
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white backdrop-blur-xl border border-slate-200 p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-space-grotesk">Firebase Configuration Required</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {FIREBASE_SETUP_MESSAGE}
          </p>
          <div className="text-xs bg-black/50 border border-slate-200 p-3 rounded-lg text-left font-mono text-slate-600">
            1. Copy .env.example to .env.local<br/>
            2. Fill in your Firebase configuration keys
          </div>
        </div>
      </div>
    );
  }

  // Consistent SSR / Initial client render avoids hydration mismatch
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-500" size={36} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-body relative overflow-hidden">
      <LiquidBackground />
      
      {/* Floating Sidebar Container */}
      <div className="relative z-50 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area with fluid padding to match floating sidebar */}
      <main className="flex-1 w-full overflow-y-auto relative z-10 bg-transparent flex flex-col h-[100dvh]">
        <header className="sticky top-0 z-30 bg-white backdrop-blur-xl mx-4 mt-4 md:mx-6 md:mt-6 rounded-[24px] px-6 h-16 hidden md:flex items-center justify-between border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-[0.2em] font-space-grotesk">
            Sabrang '26 Administration
          </span>

        </header>

        {/* Page content with fluid fade-in animation container */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
          {children}
        </div>
      </main>
    </div>
  );
}
