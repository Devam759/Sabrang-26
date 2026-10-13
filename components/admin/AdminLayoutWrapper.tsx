'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import Sidebar from './Sidebar';
import { Loader2, ShieldAlert } from 'lucide-react';
import LiquidBackground from './LiquidBackground';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // Verify session expiration
    if (typeof window !== 'undefined') {
      const expires = Number(sessionStorage.getItem('sabrang_session_expires'));
      if (expires && Date.now() > expires) {
        sessionStorage.removeItem('sabrang_auth');
        sessionStorage.removeItem('sabrang_session_expires');
        router.push('/login?expired=true');
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }

      // Check email verification status
      if (!user.emailVerified) {
        console.warn("[AdminAuth] Access blocked: User email is not verified.");
        setIsAuthenticated(false);
        setUnauthorized(true);
        router.push('/login?verification_required=true');
        return;
      }

      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const [roleDoc, userDoc] = await Promise.all([
          Promise.race([getDoc(doc(db, 'roles', user.uid)), timeout]).catch(() => null),
          Promise.race([getDoc(doc(db, 'users', user.uid)), timeout]).catch(() => null),
        ]);

        // FAIL-CLOSED: Default role is null, never 'admin'
        let role: string | null = null;
        if (roleDoc && 'exists' in roleDoc && roleDoc.exists()) {
          role = roleDoc.data()?.role || null;
        } else if (userDoc && 'exists' in userDoc && userDoc.exists()) {
          role = userDoc.data()?.role || null;
        }

        if (role === 'scanner') {
          window.location.href = '/scanner';
          return;
        }

        if (role === 'admin') {
          setIsAuthenticated(true);
          setUnauthorized(false);
        } else {
          // Strictly forbid any non-admin account from entering the admin dashboard
          console.warn(`[AdminAuth] Forbidden: User ${user.email} with role '${role || 'none'}' attempted admin access.`);
          setIsAuthenticated(false);
          setUnauthorized(true);
        }
      } catch (err) {
        console.error("[AdminAuth] Verification error:", err);
        // FAIL-CLOSED: Deny access on database error
        setIsAuthenticated(false);
        setUnauthorized(true);
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

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LiquidBackground />
        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xl border border-rose-200 rounded-3xl p-8 text-center shadow-xl">
          <ShieldAlert size={48} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-slate-900 mb-2 font-space-grotesk">Access Restricted</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your account does not possess administrator credentials for the Sabrang Management Portal.
          </p>
          <button
            onClick={() => {
              auth?.signOut();
              sessionStorage.clear();
              router.push('/login');
            }}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-space-grotesk"
          >
            Return to Login
          </button>
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
    <div className="admin-portal-scope flex min-h-screen bg-slate-50 text-slate-900 font-body relative overflow-hidden">
      <LiquidBackground />
      
      {/* Floating Sidebar Container */}
      <div className="relative z-50 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area with fluid padding to match floating sidebar */}
      <main className="flex-1 w-full overflow-y-auto relative z-10 bg-transparent flex flex-col h-[100dvh] admin-scrollbar">
        {/* Page content with fluid fade-in animation container */}
        <div className="pt-20 md:pt-8 px-4 pb-6 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
          {children}
        </div>
      </main>
    </div>
  );
}
