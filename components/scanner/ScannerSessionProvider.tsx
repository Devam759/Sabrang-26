'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, FIREBASE_SETUP_MESSAGE } from '../../lib/firebase';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ScannerAccount {
  name: string;
  volunteerName?: string;
  email: string;
  role: 'scanner' | 'admin';
  gate: string;
  scannerId?: string;
}

interface ScannerSessionContextType {
  scannerAccount: ScannerAccount | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const ScannerSessionContext = createContext<ScannerSessionContextType | null>(null);

export function ScannerSessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [scannerAccount, setScannerAccount] = useState<ScannerAccount | null>(null);
  const [configError, setConfigError] = useState(false);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check session expiration
    if (typeof window !== 'undefined') {
      const expires = Number(sessionStorage.getItem('sabrang_session_expires'));
      if (expires && Date.now() > expires) {
        sessionStorage.removeItem('sabrang_auth');
        sessionStorage.removeItem('sabrang_session_expires');
        router.push('/login?expired=true');
        return;
      }
    }

    if (!isFirebaseConfigured() || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setScannerAccount(null);
        setLoading(false);
        router.push('/login');
        return;
      }

      // Verify email verification or active role
      try {
        const [roleDoc, scannerDoc, userDoc] = await Promise.all([
          getDoc(doc(db, 'roles', user.uid)).catch(() => null),
          getDoc(doc(db, 'scannerAccounts', user.uid)).catch(() => null),
          getDoc(doc(db, 'users', user.uid)).catch(() => null),
        ]);

        let role: string | null = null;
        let isInactive = false;
        let displayName = user.displayName || user.email || 'Staff Scanner';

        if (scannerDoc && scannerDoc.exists()) {
          const sData = scannerDoc.data();
          if (sData.status === 'Inactive') {
            isInactive = true;
          }
          displayName = sData.volunteerName || displayName;
          role = 'scanner';
        }

        if (roleDoc && roleDoc.exists()) {
          role = roleDoc.data()?.role || role;
        } else if (userDoc && userDoc.exists()) {
          role = userDoc.data()?.role || role;
          displayName = userDoc.data()?.name || displayName;
        }

        if (isInactive) {
          console.warn("[ScannerAuth] Blocked: Scanner account has been deactivated.");
          setAccessDenied("This scanner account has been deactivated by an administrator.");
          setLoading(false);
          return;
        }

        if (role !== 'scanner' && role !== 'admin') {
          console.warn(`[ScannerAuth] Blocked: User ${user.email} with role '${role}' attempted scanner access.`);
          setAccessDenied("Your account is not authorized as a staff scanner or administrator.");
          setLoading(false);
          return;
        }

        setScannerAccount({
          name: displayName,
          volunteerName: displayName,
          email: user.email || 'scanner@sabrang.com',
          role: role as 'scanner' | 'admin',
          gate: 'Main Gate',
        });
        setLoading(false);
      } catch (err) {
        console.error("[ScannerAuth] Error during role lookup:", err);
        setAccessDenied("Failed to verify scanner authorization credentials.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    } catch {}

    let performer = 'Scanner';
    if (isFirebaseConfigured() && auth) {
      if (auth.currentUser) {
        performer = auth.currentUser.email || auth.currentUser.uid || 'Scanner';
      } else if (scannerAccount) {
        performer = scannerAccount.email || scannerAccount.name || 'Scanner';
      }
      try {
        const { logAdminAction } = await import('../../lib/audit');
        await logAdminAction('LOGOUT', 'sessions', `Scanner ${performer} signed out successfully`, performer);
      } catch (err) {
        console.error("Failed to log logout action:", err);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sabrang_auth');
        sessionStorage.removeItem('sabrang_session_expires');
      }
      await signOut(auth);
    }
    router.push('/login');
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-[#F5F1E5] flex items-center justify-center p-6 text-center select-none font-adminBody">
        <div className="max-w-md bg-white border-4 border-brand-ink p-8 shadow-[4px_4px_0px_0px_#030404] rounded-md">
          <ShieldAlert className="text-brand-orange mx-auto mb-4" size={48} />
          <h2 className="font-adminHeading text-2xl font-black text-brand-ink mb-4 uppercase tracking-tight">Firebase Unconfigured</h2>
          <p className="text-admin-muted text-xs font-bold uppercase mb-6 leading-relaxed">
            {FIREBASE_SETUP_MESSAGE}
          </p>
          <div className="text-[10px] bg-brand-cloud p-4 border-2 border-brand-ink rounded-md text-left font-mono overflow-x-auto text-brand-ink/70">
            1. Copy .env.example to .env.local<br/>
            2. Fill in your Firebase configuration keys
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-xl">
          <ShieldAlert size={48} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-slate-900 mb-2 font-space-grotesk">Scanner Access Denied</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            {accessDenied}
          </p>
          <button
            onClick={() => {
              auth && signOut(auth);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E5] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-ink mx-auto" size={48} />
          <p className="text-admin-muted text-xs font-bold uppercase tracking-widest font-adminBody">
            Verifying Scanner Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScannerSessionContext.Provider value={{ scannerAccount, loading, logout }}>
      {children}
    </ScannerSessionContext.Provider>
  );
}

export function useScannerSession() {
  const context = useContext(ScannerSessionContext);
  if (!context) {
    throw new Error('useScannerSession must be used within a ScannerSessionProvider');
  }
  return context;
}
