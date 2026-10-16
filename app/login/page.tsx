"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import LiquidBackground from "../../components/admin/LiquidBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col items-center gap-4 bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
          <img 
            src="/sabrang-logo/Sabrang_Logo.png" 
            alt="Sabrang 2026" 
            className="h-16 w-auto object-contain drop-shadow-sm animate-pulse" 
          />
          <div className="flex items-center gap-2.5 text-slate-700 mt-2">
            <Loader2 size={18} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-widest font-space-grotesk">
              Redirecting to Dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal-scope min-h-[100dvh] bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      <LiquidBackground />

      {/* Atmospheric Background Layer: Fine Engineering Grid (Desktop Only) */}
      <div 
        className="hidden md:block fixed inset-0 pointer-events-none z-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)'
        }}
      />

      {/* Vinyl Record Player Background Element - Desktop Only to ensure maximum mobile smoothness */}
      <div className="hidden sm:flex fixed inset-0 pointer-events-none z-0 items-center justify-center overflow-hidden">
        {/* Spinning Vinyl Disc Container */}
        <div className="relative w-[780px] h-[780px] sm:w-[920px] sm:h-[920px] flex items-center justify-center animate-[spin_24s_linear_infinite]">
          {/* Vinyl Grooves Body (Concentric rings with record sheen) */}
          <div 
            className="absolute inset-0 rounded-full border border-slate-300/40 shadow-[0_20px_80px_rgba(99,102,241,0.08)]"
            style={{
              background: `
                radial-gradient(circle, 
                  transparent 28%,
                  rgba(148, 163, 184, 0.06) 29%, 
                  transparent 30%,
                  rgba(148, 163, 184, 0.08) 36%, 
                  transparent 37%,
                  rgba(148, 163, 184, 0.06) 44%, 
                  transparent 45%,
                  rgba(148, 163, 184, 0.09) 52%, 
                  transparent 53%,
                  rgba(148, 163, 184, 0.07) 60%, 
                  transparent 61%,
                  rgba(148, 163, 184, 0.08) 68%, 
                  transparent 69%,
                  rgba(148, 163, 184, 0.06) 76%, 
                  transparent 77%,
                  rgba(148, 163, 184, 0.08) 84%, 
                  transparent 85%,
                  rgba(148, 163, 184, 0.05) 92%,
                  transparent 93%
                )
              `
            }}
          />

          {/* Micro Fine Grooves (Denser sound grooves) */}
          <div className="absolute w-[86%] h-[86%] rounded-full border border-slate-300/30 border-dashed" />
          <div className="absolute w-[76%] h-[76%] rounded-full border border-indigo-200/40" />
          <div className="absolute w-[66%] h-[66%] rounded-full border border-purple-200/40 border-dashed" />
          <div className="absolute w-[56%] h-[56%] rounded-full border border-slate-300/30" />
          <div className="absolute w-[46%] h-[46%] rounded-full border border-pink-200/40 border-dotted" />

          {/* Vinyl Specular Light Sheen (Two conic light reflection cones typical of vinyl records) */}
          <div 
            className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              background: `conic-gradient(
                from 45deg,
                transparent 0deg,
                rgba(255, 255, 255, 0.8) 35deg,
                transparent 70deg,
                transparent 180deg,
                rgba(255, 255, 255, 0.8) 215deg,
                transparent 250deg,
                transparent 360deg
              )`
            }}
          />

          {/* Outer Rim Highlight */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-200/50" />
          <div className="absolute inset-[3px] rounded-full border border-slate-300/30" />

          {/* Record Center Run-Out Groove & Label Edge */}
          <div className="absolute w-[360px] h-[360px] rounded-full border-2 border-indigo-300/40 bg-gradient-to-tr from-purple-100/30 via-indigo-100/20 to-pink-100/30 shadow-inner" />
          <div className="absolute w-[320px] h-[320px] rounded-full border border-slate-300/40" />
          
          {/* Subtle Stylus/Spindle Indicator Marks around perimeter */}
          <div className="absolute top-2 w-1.5 h-3 bg-indigo-400/60 rounded-full" />
          <div className="absolute bottom-2 w-1.5 h-3 bg-indigo-400/60 rounded-full" />
          <div className="absolute left-2 w-3 h-1.5 bg-indigo-400/60 rounded-full" />
          <div className="absolute right-2 w-3 h-1.5 bg-indigo-400/60 rounded-full" />
        </div>

        {/* Ambient Center Glow */}
        <div className="absolute w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-indigo-300/20 via-purple-300/20 to-pink-300/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Glassmorphic Card - Highly optimized for mobile */}
      <div className="w-full max-w-[400px] bg-white/95 sm:bg-white/85 sm:backdrop-blur-xl border border-slate-200/90 rounded-3xl sm:rounded-[32px] p-6 sm:p-9 shadow-lg sm:shadow-[0_24px_70px_rgba(15,23,42,0.08)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Branding Section */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <Link href="/" className="group mb-3 inline-block transition-transform duration-200 active:scale-95 focus:outline-none">
            <img
              src="/sabrang-logo/Sabrang_Logo.png"
              alt="Sabrang 2026 Logo"
              className="h-14 sm:h-18 w-auto object-contain drop-shadow-xs transition-all"
            />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-space-grotesk">
            Sabrang Portal
          </h1>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-space-grotesk">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="coordinator@sabrang.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base sm:text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-space-grotesk">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 sm:py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base sm:text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-black active:scale-[0.98] text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all shadow-[0_10px_25px_rgba(15,23,42,0.12)] hover:shadow-[0_15px_30px_rgba(15,23,42,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-space-grotesk"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors font-space-grotesk tracking-wide group"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Return to Sabrang 2026 Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
