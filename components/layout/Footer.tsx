"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/events") {
    return null;
  }

  return (
    <footer className="relative z-30 py-6 border-t border-white/10 bg-black text-center text-white/50 text-sm flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4">
      <span>&copy; 2026 Sabrang Festival. All rights reserved.</span>
      <span className="hidden sm:inline text-white/20">•</span>
      <Link
        href="/credits"
        className="inline-flex items-center gap-1.5 text-white/70 hover:text-purple-400 transition-colors group font-medium"
      >
        <span>Made with</span>
        <span className="text-red-500 group-hover:scale-125 transition-transform inline-block">❤️</span>
        <span>by Tech Team</span>
      </Link>
    </footer>
  );
}
