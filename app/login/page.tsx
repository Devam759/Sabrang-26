"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Send,
} from "lucide-react";
import LiquidBackground from "../../components/admin/LiquidBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setNeedsVerification(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Check rate limit on server before authentication attempt
      const rateLimitCheckRes = await fetch("/api/auth/login-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", email: cleanEmail }),
      });

      if (rateLimitCheckRes.status === 429) {
        const data = await rateLimitCheckRes.json();
        setError(data.message || "Too many failed login attempts. Please try again later.");
        setLoading(false);
        return;
      }

      // 2. Client Authentication with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 3. Email verification enforcement
      if (!user.emailVerified) {
        console.warn("[Auth] Email verification required for:", cleanEmail);
        setNeedsVerification(true);
        setError("Email verification is required. Please verify your email before accessing the portal.");
        // Sign out unverified session
        await signOut(auth);
        setLoading(false);
        return;
      }

      // 4. Reset rate limit counter on successful authentication
      await fetch("/api/auth/login-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email: cleanEmail }),
      }).catch(() => {});

      // 5. Establish secure HttpOnly session with expiration
      const idToken = await user.getIdToken();
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      let role: string = "attendee";
      let name = user.displayName || "User";

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        role = sessionData.user?.role || "attendee";
        name = sessionData.user?.name || name;

        if (sessionData.expiresAt && typeof window !== "undefined") {
          sessionStorage.setItem("sabrang_session_expires", String(sessionData.expiresAt));
        }
      } else {
        // Fallback: direct database lookup if session endpoint fails
        try {
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
          const [userDoc, roleDoc] = await Promise.all([
            Promise.race([getDoc(doc(db, "users", user.uid)), timeout]).catch(() => null),
            Promise.race([getDoc(doc(db, "roles", user.uid)), timeout]).catch(() => null),
          ]);

          if (roleDoc && "exists" in roleDoc && roleDoc.exists()) {
            role = roleDoc.data()?.role || "attendee";
          } else if (userDoc && "exists" in userDoc && userDoc.exists()) {
            role = userDoc.data()?.role || "attendee";
            name = userDoc.data()?.name || name;
          }
        } catch {
          role = "attendee";
        }
      }

      // Store non-sensitive metadata for UI display only (never relied on for authorization)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "sabrang_auth",
          JSON.stringify({
            email: user.email || cleanEmail,
            role,
            name,
            uid: user.uid,
          })
        );
      }

      // 6. Role-based routing (fail-closed: attendee is not allowed to admin)
      setRedirecting(true);

      if (role === "scanner") {
        router.push("/scanner");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        // Standard registered attendee
        router.push("/dashboard");
      }
      return;
    } catch (err: any) {
      console.error("Login error:", err);

      // Record failed attempt to rate-limiter
      try {
        const failRes = await fetch("/api/auth/login-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "record-failure", email: cleanEmail }),
        });

        if (failRes.status === 429) {
          const data = await failRes.json();
          setError(data.message || "Account locked due to multiple failed login attempts.");
          setLoading(false);
          return;
        }
      } catch {}

      let userMsg = "Invalid email or password. Please verify your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        userMsg = "Incorrect email or password.";
      } else if (err.code === "auth/user-not-found") {
        userMsg = "No account found matching this email address.";
      } else if (err.code === "auth/too-many-requests") {
        userMsg = "Access temporarily disabled due to too many failed attempts. Try again later.";
      }

      setError(userMsg);
      setRedirecting(false);
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendingVerification(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setSuccessMsg(data.message || "Verification email sent. Please check your inbox.");
    } catch (err) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setResetStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetStatus(data.message || "Password reset instructions dispatched.");
      } else {
        setResetStatus(data.error || "Failed to process password reset request.");
      }
    } catch (err) {
      setResetStatus("An error occurred. Please try again.");
    } finally {
      setResetLoading(false);
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
              Establishing Secure Session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal-scope min-h-screen bg-slate-50/70 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      <LiquidBackground />

      {/* Atmospheric Background Layer: Fine Engineering Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.45] mix-blend-multiply"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%)",
        }}
      />

      {/* Vinyl Record Player Background Element */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-[780px] h-[780px] sm:w-[920px] sm:h-[920px] flex items-center justify-center animate-[spin_24s_linear_infinite]">
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
              `,
            }}
          />
          <div className="absolute w-[86%] h-[86%] rounded-full border border-slate-300/30 border-dashed" />
          <div className="absolute w-[76%] h-[76%] rounded-full border border-indigo-200/40" />
          <div className="absolute w-[66%] h-[66%] rounded-full border border-purple-200/40 border-dashed" />
          <div className="absolute w-[56%] h-[56%] rounded-full border border-slate-300/30" />
          <div className="absolute w-[46%] h-[46%] rounded-full border border-pink-200/40 border-dotted" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-200/50" />
          <div className="absolute w-[360px] h-[360px] rounded-full border-2 border-indigo-300/40 bg-gradient-to-tr from-purple-100/30 via-indigo-100/20 to-pink-100/30 shadow-inner" />
          <div className="absolute w-[320px] h-[320px] rounded-full border border-slate-300/40" />
        </div>
        <div className="absolute w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-indigo-300/20 via-purple-300/20 to-pink-300/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[32px] p-7 sm:p-10 shadow-[0_24px_70px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.04] relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Branding Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="group mb-4 inline-block transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
          >
            <img
              src="/sabrang-logo/Sabrang_Logo.png"
              alt="Sabrang 2026 Logo"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm transition-all"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-space-grotesk">
            Sabrang Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Encrypted Authentication Gateway</span>
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs leading-relaxed font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email Verification Action */}
        {needsVerification && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-950 font-space-grotesk">
              <Mail size={16} className="text-amber-700" />
              <span>Verify Your Email Address</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              A verification email has been sent. If you did not receive it, click below to generate a new verification link.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {resendingVerification ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
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
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest font-space-grotesk">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowForgotPassword(true);
                  setResetStatus(null);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
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
                className="w-full pl-10 pr-11 py-3.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-space-grotesk">Reset Password</h3>
                <p className="text-xs text-slate-500">Security-enforced time-limited link</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Enter the email address registered with your account. A single-use reset link valid for <strong>15 minutes</strong> will be dispatched to your inbox.
            </p>

            {resetStatus && (
              <div className="mb-4 p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-space-grotesk">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetLoading ? <Loader2 size={14} className="animate-spin" /> : <span>Send Reset Link</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
