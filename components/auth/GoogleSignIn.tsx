'use client';

import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const displayName = user.displayName || 'Google User';

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: displayName,
          email: user.email,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      } else {
        const existingData = userSnap.data();
        if (!existingData.name && displayName !== 'Google User') {
          await setDoc(userRef, { name: displayName }, { merge: true });
        }
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      alert(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 font-bold">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.08 7.08 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.61-2.399.987-4.04.987a7.07 7.07 0 0 1-6.723-4.856l-4.02 3.11C3.186 21.235 7.25 24 12 24c3.059 0 5.792-1.145 7.92-3l-3.88-2.987z"/><path fill="#4A90E2" d="M19.92 21c2.592-2.227 4.08-5.523 4.08-9 0-.627-.053-1.245-.155-1.841H12v4.582h6.814c-.313 1.637-1.254 3.02-2.734 3.982L19.921 21z"/><path fill="#FBBC05" d="M5.277 14.144a7.12 7.12 0 0 1-.368-2.144c0-.746.12-1.463.342-2.14l-4.01-3.102A11.94 11.94 0 0 0 0 12c0 1.83.413 3.565 1.151 5.115l4.126-2.971z"/></svg>
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>
    </div>
  );
}
