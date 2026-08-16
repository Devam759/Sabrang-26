import Link from "next/link";

export default function SubtleFooter() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
      <Link
        href="/credits"
        className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md border border-white/5 rounded-full text-[10px] sm:text-xs text-white/40 hover:text-white/80 transition-all hover:bg-black/40 group shadow-xl"
      >
        <span className="hidden sm:inline">&copy; 2026 Sabrang Festival. All rights reserved.</span>
        <span className="hidden sm:inline opacity-50">•</span>
        <span className="flex items-center gap-1.5">
          Made with <span className="text-pink-500 group-hover:scale-110 transition-transform">💖</span> by Tech Team
        </span>
      </Link>
    </div>
  );
}
