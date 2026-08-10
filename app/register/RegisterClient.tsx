'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { validateName, validateEmail, sanitizeInput } from '@/lib/utils';

export default function RegisterClient() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const firstNameValidation = validateName(firstName);
      if (!firstNameValidation.isValid) {
        setError(`First Name: ${firstNameValidation.error}`);
        setLoading(false);
        return;
      }

      const lastNameValidation = validateName(lastName);
      if (!lastNameValidation.isValid) {
        setError(`Last Name: ${lastNameValidation.error}`);
        setLoading(false);
        return;
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Invalid email');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const sanitizedFirstName = sanitizeInput(firstName);
      const sanitizedLastName = sanitizeInput(lastName);
      const sanitizedEmail = emailValidation.email || email.trim().toLowerCase();
      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim();

      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: fullName,
        email: sanitizedEmail,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b12] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-white/50">Register for Sabrang 2026 and access all events.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                First Name
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                placeholder="John"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                Last Name
              </label>
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              suppressHydrationWarning
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suppressHydrationWarning
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              placeholder="Min. 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0d0b12] px-3 text-xs text-white/40 uppercase tracking-widest">
                or continue with
              </span>
            </div>
          </div>
          <GoogleSignIn />
        </div>
      </div>
    </div>
  );
}
