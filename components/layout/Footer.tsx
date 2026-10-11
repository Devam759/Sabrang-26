"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/events" || pathname === "/login" || pathname?.startsWith("/admin") || pathname?.startsWith("/scanner")) {
    return null;
  }

  // Render the expanded compliance footer ONLY on Hero and Register pages as requested
  const isComplianceFooter = pathname === "/" || pathname === "/register";

  if (isComplianceFooter) {
    return (
      <footer className="relative z-30 py-3 sm:py-4 border-t border-white/10 bg-black/95 backdrop-blur-md text-white/50 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left End: Sabrang Logo */}
          <div className="flex items-center justify-between md:justify-start w-full md:w-auto flex-shrink-0">
            <Link
              href="/"
              aria-label="Sabrang 2026 Home"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/sabrang-logo/Sabrang_Logo.png"
                alt="Sabrang 2026"
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </Link>

            {/* Mobile-only JKLU logo aligned to the right on the same row */}
            <a
              href="https://jklu.edu.in"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JK Lakshmipat University Website"
              className="inline-flex md:hidden items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/sabrang-logo/jklu_logo.png"
                alt="JK Lakshmipat University (JKLU)"
                className="h-6 w-auto object-contain"
              />
            </a>
          </div>

          {/* Center: Compliance Links & Rights Meta */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            {/* Nav Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-[11px] sm:text-xs text-white/70">
              <Link href="/about" className="hover:text-purple-300 transition-colors">
                About Us
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link href="/contact" className="hover:text-purple-300 transition-colors">
                Contact Us
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link href="/terms" className="hover:text-purple-300 transition-colors">
                Terms &amp; Conditions
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link href="/privacy" className="hover:text-purple-300 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link href="/refund-policy" className="hover:text-purple-300 transition-colors">
                Refund &amp; Cancellation
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link href="/shipping-policy" className="hover:text-purple-300 transition-colors">
                Shipping &amp; Delivery
              </Link>
            </nav>

            {/* Copyright & Meta */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-white/40 text-[10px] sm:text-[11px]">
              <span>&copy; 2026 Sabrang | JK Lakshmipat University, Jaipur.</span>
              <span className="text-white/20 select-none">•</span>
              <Link
                href="/credits"
                className="inline-flex items-center gap-1 text-white/60 hover:text-purple-400 transition-colors group font-medium"
              >
                <span>Made with</span>
                <svg className="w-3 h-3 text-red-500 fill-red-500 inline-block group-hover:scale-125 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>by Tech Team</span>
              </Link>
            </div>
          </div>

          {/* Right End: JKLU Logo (Desktop) */}
          <div className="hidden md:flex items-center justify-end flex-shrink-0">
            <a
              href="https://jklu.edu.in"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JK Lakshmipat University Website"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/sabrang-logo/jklu_logo.png"
                alt="JK Lakshmipat University (JKLU)"
                className="h-6 sm:h-8 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  // Original Minimalist Footer for all other pages
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
