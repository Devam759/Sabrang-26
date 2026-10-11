"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import LiquidBackground from "../../components/admin/LiquidBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Secure Firebase Client Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      let role = "admin";
      let name = user.displayName || "Administrator";

      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const [userDoc, roleDoc] = await Promise.all([
          Promise.race([getDoc(doc(db, "users", user.uid)), timeout]).catch(() => null),
          Promise.race([getDoc(doc(db, "roles", user.uid)), timeout]).catch(() => null),
        ]);

        if (userDoc && 'exists' in userDoc && userDoc.exists()) {
          role = userDoc.data()?.role || "admin";
          name = userDoc.data()?.name || name;
        } else if (roleDoc && 'exists' in roleDoc && roleDoc.exists()) {
          role = roleDoc.data()?.role || "admin";
        }
      } catch {
        // Fallback to token default
      }

      sessionStorage.setItem(
        "sabrang_auth",
        JSON.stringify({
          email: user.email || cleanEmail,
          role: role,
          name: name,
          uid: user.uid,
        })
      );

      // Lock UI into redirecting state BEFORE navigating
      setRedirecting(true);

      if (role === "scanner") {
        router.push("/scanner");
      } else {
        router.push("/admin");
      }
      return;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Login failed: ${err.message || "Please verify your credentials"}`);
      setRedirecting(false);
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-white/50" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest font-space-grotesk">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-on-background flex items-center justify-center p-4 relative overflow-hidden">
      <LiquidBackground />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest uppercase text-white font-space-grotesk drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            Sabrang Portal
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-xs leading-relaxed font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 font-space-grotesk">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 text-sm outline-none focus:bg-black/80 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 font-space-grotesk">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 text-sm outline-none focus:bg-black/80 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-body"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-space-grotesk"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link href="/" className="text-xs font-medium text-gray-500 hover:text-white transition-colors font-space-grotesk tracking-wider">
            Return to Sabrang 2026 Home
          </Link>
        </div>
      </div>
    </div>
  );
}
