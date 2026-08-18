import Link from "next/link";

export default function SubtleFooter() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
      <Link
        href="/credits"
        className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-white/5 rounded-full text-[10px] sm:text-xs text-white/40 hover:text-white/80 transition-all hover:bg-black/50 group shadow-xl"
      >
        <span className="hidden sm:inline">&copy; 2026 Sabrang. All rights reserved.</span>
        <span className="hidden sm:inline opacity-50">•</span>
        <span className="flex items-center gap-1">
          Made with
          <svg className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block group-hover:scale-125 transition-transform" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          by Tech Team
        </span>
      </Link>
    </div>
  );
}
