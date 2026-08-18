"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { NAV_PROJECTS } from "@/components/FilmStripCarousel/projects";
import type { Project } from "@/components/FilmStripCarousel/types";
import "@/components/ui/StaggeredMenu.css";

const FilmStripCarousel = dynamic(
  () => import("@/components/FilmStripCarousel/FilmStripCarousel"),
  { ssr: false }
);

const SHELL = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

const PANEL = {
  hidden: {},
  visible: { transition: { delayChildren: 0.06, staggerChildren: 0.04 } },
};

const PANEL_ITEM = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 20) setIsVisible(true);
      else if (y > lastY && y > 60) setIsVisible(false);
      else if (y < lastY) setIsVisible(true);
      lastY = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setNavLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (pathname && pathname.startsWith("/admin")) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push("/");
  };

  const handleProjectSelect = (project: Project) => {
    if (pathname === project.href) {
      setIsOpen(false);
      return;
    }
    setNavLoading(true);
    router.push(project.href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center transition-all duration-300 ease-out ${
          isVisible || isOpen
            ? "translate-y-0 opacity-100 pointer-events-none"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`pointer-events-auto transition-opacity duration-300 ${
            isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Link
            href="/"
            className="flex flex-col items-start outline-none transition-transform hover:scale-105 active:scale-95"
          >
            <Image
              src="https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png"
              alt="Sabrang Logo"
              width={70}
              height={56}
              loading="eager"
              fetchPriority="high"
              className="h-10 md:h-14 w-auto object-contain drop-shadow-2xl"
            />
          </Link>
        </div>

        <div className="pointer-events-auto flex items-center gap-3 md:gap-4">
          <a
            href="https://jklu.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:block outline-none transition-all duration-300 hover:scale-105 active:scale-95 ${
              isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <Image
              src="https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060374/sabrang-2026/sabrang-logo/white_jklu_logo.png"
              alt="JKLU Logo"
              width={46}
              height={40}
              className="h-8 md:h-10 w-auto object-contain drop-shadow-xl"
            />
          </a>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            data-open={isOpen || undefined}
            className="sm-toggle-btn"
            style={{
              position: "relative",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 0.4rem",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.65)",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <span>{isOpen ? "CLOSE" : "MENU"}</span>
            {/* Drawn, not typed: these used to be ☰/✕ glyphs in 'Space Mono', a
                font nothing here loads, so the icon rendered or vanished purely on
                what the OS fallback happened to have. Bars morph via CSS off
                data-open — see .sm-icon in StaggeredMenu.css. */}
            <span className="sm-icon" aria-hidden>
              <span className="sm-icon-line" />
              <span className="sm-icon-line" />
              <span className="sm-icon-line" />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-shell"
            variants={SHELL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/95"
          >
            {role !== "admin" && (
              <div className="absolute inset-0">
                <FilmStripCarousel
                  projects={NAV_PROJECTS}
                  loading={navLoading}
                  onProjectSelect={handleProjectSelect}
                />
              </div>
            )}

            {!loading && (
              <motion.div
                variants={PANEL}
                initial="hidden"
                animate="visible"
                className="absolute top-5 left-5 z-10 flex flex-col gap-2 max-w-[260px] text-sm"
              >
                {user ? (
                  <>
                    <motion.div variants={PANEL_ITEM}>
                      <p className="font-bold text-white truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {user.email}
                      </p>
                    </motion.div>
                    <motion.div
                      variants={PANEL_ITEM}
                      className="flex flex-wrap gap-2"
                    >
                      {role !== "admin" && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
                        >
                          Dashboard
                        </Link>
                      )}
                      {role === "scanner" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-full bg-red-950/50 border border-red-700 text-red-200 hover:bg-red-900/50 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
                        >
                          Entry Portal
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
                      >
                        Logout
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={PANEL_ITEM}>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="block px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wide shadow-xl hover:bg-neutral-200 hover:-translate-y-0.5 active:scale-90 active:duration-75 transition-all duration-300 ease-out text-center"
                    >
                      Register Now
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}

            <motion.p
              variants={PANEL_ITEM}
              initial="hidden"
              animate="visible"
              className="sm-tagline pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-center"
            >
              Where every shade finds its own spectrum
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
