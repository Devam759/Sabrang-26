"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/events") {
    return null;
  }

  return (
    <footer className="relative z-30 py-2.5 border-t border-white/10 bg-black text-center text-white/50 text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-4">
      <span>&copy; 2026 Sabrang. All rights reserved.</span>
      <span className="hidden sm:inline text-white/20">•</span>
      <Link
        href="/credits"
        className="inline-flex items-center gap-1 text-white/70 hover:text-purple-400 transition-colors group font-medium"
      >
        <span>Made with</span>
        <svg className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block group-hover:scale-125 transition-transform" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>by Tech Team</span>
      </Link>
    </footer>
  );
}
