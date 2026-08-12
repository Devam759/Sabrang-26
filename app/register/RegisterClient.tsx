"use client";

import { useRouter } from "next/navigation";

export default function RegisterClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0d0b12] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-[0.2em]">
            Sabrang 2026
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-3">
            Registrations Opening Soon
          </h1>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Registrations for Sabrang 2026 events are not yet open. Stay tuned
            to secure your spot in our flagship competitions, fashion shows, and
            musical performances.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-sm transition-colors duration-200 shadow-lg shadow-violet-500/20 active:scale-95"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
