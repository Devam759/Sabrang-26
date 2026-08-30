"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { NAV_PROJECTS } from "@/components/FilmStripCarousel/projects";
import type { Project } from "@/components/FilmStripCarousel/types";
import MusicToggleButton from "@/components/audio/MusicToggleButton";
import "@/components/ui/StaggeredMenu.css";

const FilmStripCarousel = dynamic(
  () => import("@/components/FilmStripCarousel/FilmStripCarousel"),
  { ssr: false }
);

const preloadFilmStrip = () => {
  if (typeof window !== "undefined") {
    import("@/components/FilmStripCarousel/FilmStripCarousel");
  }
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
    const handlePageReady = () => {
      setIsOpen(false);
      setNavLoading(false);
    };

    window.addEventListener("sabrang-page-ready", handlePageReady);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (navLoading) {
      // Graceful timeout so loading never hangs even if event isn't dispatched
      timer = setTimeout(() => {
        setIsOpen(false);
        setNavLoading(false);
      }, 700);
    } else {
      setIsOpen(false);
      setNavLoading(false);
    }

    return () => {
      window.removeEventListener("sabrang-page-ready", handlePageReady);
      if (timer) clearTimeout(timer);
    };
  }, [pathname, navLoading]);

  // Kick off the dynamic chunk request immediately — the import is non-blocking
  // and the browser will parse + cache it in the background well before the
  // user has a chance to click MENU. 0ms means "next microtask" via setTimeout.
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadFilmStrip();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  if (pathname && (pathname.startsWith("/admin") || pathname === "/login")) return null;

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
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center transition-all duration-300 ease-out ${
          isVisible || isOpen
            ? "translate-y-0 opacity-100 pointer-events-none"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="pointer-events-auto relative flex items-center h-16 md:h-20 w-32 md:w-48">
          <div
            className={`absolute left-0 transition-opacity duration-300 ${
              isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <Link
              href="/"
              className="flex flex-col items-start outline-none transition-transform hover:scale-105 active:scale-95 py-2"
            >
              <Image
                src="https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1788091528/sabrang-2026/sabrang-logo/sabrang-logo-dark.png"
                alt="Sabrang Logo"
                width={200}
                height={80}
                loading="eager"
                fetchPriority="high"
                style={{ width: "auto", height: "auto" }}
                className="h-16 md:h-20 object-contain drop-shadow-2xl"
              />
            </Link>
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="user-panel"
                variants={PANEL}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute left-0 z-50 flex flex-col justify-center h-full"
              >
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wide shadow-xl hover:bg-neutral-200 hover:-translate-y-0.5 active:scale-90 active:duration-75 transition-all duration-300 ease-out text-center"
                >
                  Register Now
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5 md:gap-4">
          {/* <div className={`transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <MusicToggleButton />
          </div> */}

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
              width={64}
              height={56}
              style={{ width: "auto", height: "auto" }}
              className="h-10 md:h-13.5 object-contain drop-shadow-xl"
            />
          </a>

          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={preloadFilmStrip}
            onPointerDown={preloadFilmStrip}
            onTouchStart={preloadFilmStrip}
            onFocus={preloadFilmStrip}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            data-open={isOpen || undefined}
            className="cyber-menu-btn"
          >
            <span className="relative z-10">{isOpen ? "CLOSE" : "MENU"}</span>
            <span className="sm-icon relative z-10" aria-hidden>
              <span className="sm-icon-line" />
              <span className="sm-icon-line" />
              <span className="sm-icon-line" />
            </span>
          </button>
        </div>
      </header>

      {/* ── Film strip: always mounted so the WebGL context is never cold-started.
           The canvas is invisible and pointer-inactive when the menu is closed.
           frameloop="never" means zero GPU work while hidden. ── */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-200 ease-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <FilmStripCarousel
          projects={NAV_PROJECTS}
          loading={navLoading}
          active={isOpen}
          onProjectSelect={handleProjectSelect}
        />
      </div>


    </>
  );
}
