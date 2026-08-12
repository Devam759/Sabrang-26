'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LiquidMetalButton } from '@/components/ui/liquid-metal';
import { NAV_PROJECTS } from '@/components/FilmStripCarousel/projects';
import type { Project } from '@/components/FilmStripCarousel/types';

const FilmStripCarousel = dynamic(
  () => import('@/components/FilmStripCarousel/FilmStripCarousel'),
  { ssr: false }
);

// The menu is an object that arrives and leaves, not a panel that is shown and
// hidden. Opening: the surface springs up from slightly back while its
// contents stagger in behind it; closing runs the same motion in reverse,
// faster, because a dismissal that takes as long as an entrance feels like the
// interface is arguing. Opacity + transform ONLY ΓÇö an animated blur() on a
// fullscreen layer holding a live WebGL canvas re-filters the whole viewport
// every frame, which is what made opening the menu stutter.
const SHELL = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.8 },
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
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
};

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Last scroll position lives in a local, not state: keeping it in state
  // re-rendered the whole navbar on every scroll event and re-subscribed the
  // listener each time. setIsVisible is a no-op render when the value is
  // unchanged, so this only renders on an actual show/hide flip.
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 20) setIsVisible(true);
      else if (y > lastY && y > 60) setIsVisible(false);
      else if (y < lastY) setIsVisible(true);
      lastY = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setNavLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (pathname && pathname.startsWith('/admin')) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push('/');
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
        className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start transition-all duration-300 ease-out ${
          isVisible || isOpen
            ? 'translate-y-0 opacity-100 pointer-events-none'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className={`navbar-logos pointer-events-auto transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Link href="/" className="flex flex-col items-start outline-none transition-transform hover:scale-105 active:scale-95">
            <img
              src="/sabrang logo.png"
              alt="Sabrang Logo"
              className="h-14 md:h-20 w-auto object-contain drop-shadow-2xl"
            />
            <img
              src="/past sponsors/JK Tyre.png"
              alt="JK Tyre Logo"
              className="h-5 md:h-7 w-auto object-contain mt-1 drop-shadow-lg filter brightness-110"
            />
          </Link>
        </div>

        <div className="pointer-events-auto flex items-start gap-3 md:gap-4">
          <a
            href="https://jklu.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className={`navbar-jklu-logo block outline-none transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <img
              src="/white_jklu_logo.png"
              alt="JKLU Logo"
              className="h-10 md:h-14 w-auto object-contain drop-shadow-xl"
            />
          </a>
          <LiquidMetalButton
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            className="transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-90 active:duration-75"
            metalConfig={{
              colorBack: '#aaaaac',
              colorTint: '#ffffff',
              speed: 0.4,
              repetition: 4,
              distortion: 0.15,
              scale: 1,
            }}
            borderWidth={4}
            size="sm"
            icon={
              isOpen ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="flex flex-col gap-1 w-4 items-center justify-center">
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white rounded-full"></span>
                </div>
              )
            }
          >
            Menu
          </LiquidMetalButton>
        </div>
      </header>

      {/* Unmounted while closed rather than hidden: that releases the WebGL
          context when the menu is not in use, and lets the carousel replay its
          arrival every time the menu opens. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-shell"
            variants={SHELL}
            initial="hidden"
            animate="visible"
            exit="exit"
            // no backdrop-blur: behind 95%-opaque black it is invisible, but
            // the GPU still blurs the entire page underneath every frame
            className="fixed inset-0 z-40 bg-black/95"
          >
            {role !== 'admin' && (
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
                      <p className="font-bold text-white truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-white/50 truncate">{user.email}</p>
                    </motion.div>
                    <motion.div variants={PANEL_ITEM} className="flex flex-wrap gap-2">
                      {role !== 'admin' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
                        >
                          Dashboard
                        </Link>
                      )}
                      {role === 'scanner' && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// --- INCOMING CHANGES FROM GIT PULL ---
// "use client";
// 
// // --- INCOMING CHANGES ---
// // import { useState, useEffect } from "react";
// // import Link from "next/link";
// // import { usePathname, useRouter } from "next/navigation";
// // import { useAuth } from "@/components/auth/AuthProvider";
// // import { signOut } from "firebase/auth";
// // import { auth } from "@/lib/firebase/client";
// // import { LiquidMetalButton } from "@/components/ui/liquid-metal";
// // ------------------------
// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import dynamic from 'next/dynamic';
// import { AnimatePresence, motion } from 'framer-motion';
// import { usePathname, useRouter } from 'next/navigation';
// import { useAuth } from '@/components/auth/AuthProvider';
// import { signOut } from 'firebase/auth';
// import { auth } from '@/lib/firebase/client';
// import { LiquidMetalButton } from '@/components/ui/liquid-metal';
// import { NAV_PROJECTS } from '@/components/FilmStripCarousel/projects';
// import type { Project } from '@/components/FilmStripCarousel/types';
// 
// const FilmStripCarousel = dynamic(
//   () => import('@/components/FilmStripCarousel/FilmStripCarousel'),
//   { ssr: false }
// );
// 
// // The menu is an object that arrives and leaves, not a panel that is shown and
// // hidden. Opening: the surface springs up from slightly back while its
// // contents stagger in behind it; closing runs the same motion in reverse,
// // faster, because a dismissal that takes as long as an entrance feels like the
// // interface is arguing. Opacity + transform ONLY â€” an animated blur() on a
// // fullscreen layer holding a live WebGL canvas re-filters the whole viewport
// // every frame, which is what made opening the menu stutter.
// const SHELL = {
//   hidden: { opacity: 0, scale: 1.04 },
//   visible: {
//     opacity: 1,
//     scale: 1,
//     transition: { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.8 },
//   },
//   exit: {
//     opacity: 0,
//     scale: 1.02,
//     transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
//   },
// };
// 
// const PANEL = {
//   hidden: {},
//   visible: { transition: { delayChildren: 0.06, staggerChildren: 0.04 } },
// };
// 
// const PANEL_ITEM = {
//   hidden: { opacity: 0, y: 14 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
//   },
// };
// 
// export default function Navbar() {
//   const { user, role, loading } = useAuth();
//   const pathname = usePathname();
//   const router = useRouter();
//   const [isOpen, setIsOpen] = useState(false);
//   const [navLoading, setNavLoading] = useState(false);
//   const [isVisible, setIsVisible] = useState(true);
// 
//   // Last scroll position lives in a local, not state: keeping it in state
//   // re-rendered the whole navbar on every scroll event and re-subscribed the
//   // listener each time. setIsVisible is a no-op render when the value is
//   // unchanged, so this only renders on an actual show/hide flip.
//   useEffect(() => {
//     let lastY = window.scrollY;
//     const handleScroll = () => {
//       const y = window.scrollY;
//       if (y <= 20) setIsVisible(true);
//       else if (y > lastY && y > 60) setIsVisible(false);
//       else if (y < lastY) setIsVisible(true);
//       lastY = y;
//     };
// 
// // --- INCOMING CHANGES ---
// //     window.addEventListener("scroll", handleScroll, { passive: true });
// //     return () => window.removeEventListener("scroll", handleScroll);
// //   }, [lastScrollY]);
// // ------------------------
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);
// 
//   useEffect(() => {
//     setIsOpen(false);
//     setNavLoading(false);
//   }, [pathname]);
// 
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOpen]);
// 
//   if (pathname && pathname.startsWith("/admin")) return null;
// 
//   const handleSignOut = async () => {
//     await signOut(auth);
//     setIsOpen(false);
//     router.push("/");
//   };
// 
// // --- INCOMING CHANGES ---
// //   const navLinks = [
// //     { href: "/", label: "Home" },
// //     { href: "/about", label: "About" },
// //     { href: "/gallery", label: "Gallery" },
// //     { href: "/team", label: "Our Team" },
// //     { href: "/sponsors", label: "Sponsors" },
// //     { href: "/events", label: "Events" },
// //     { href: "/schedule", label: "Schedule" },
// //     { href: "/register", label: "Registration" },
// //     { href: "/faq", label: "FAQ" },
// //     { href: "/contact", label: "Contact Us" },
// //     { href: "/credits", label: "Tech Team Credits" },
// //   ];
// // ------------------------
//   const handleProjectSelect = (project: Project) => {
//     if (pathname === project.href) {
//       setIsOpen(false);
//       return;
//     }
//     setNavLoading(true);
//     router.push(project.href);
//   };
// 
//   return (
//     <>
//       <header
//         className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start transition-all duration-300 ease-out ${
//           isVisible || isOpen
//             ? "translate-y-0 opacity-100 pointer-events-none"
//             : "-translate-y-full opacity-0 pointer-events-none"
//         }`}
//       >
//         <div
//           className={`navbar-logos pointer-events-auto transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
//         >
//           <Link
//             href="/"
//             className="flex flex-col items-start outline-none transition-transform hover:scale-105 active:scale-95"
//           >
//             <img
//               src="/sabrang-logo.png"
//               alt="Sabrang Logo"
//               className="h-14 md:h-20 w-auto object-contain drop-shadow-2xl"
//             />
//             <img
//               src="/past-sponsors/JK Tyre.png"
//               alt="JK Tyre Logo"
//               className="h-5 md:h-7 w-auto object-contain mt-1 drop-shadow-lg filter brightness-110"
//             />
//           </Link>
//         </div>
// 
//         <div className="pointer-events-auto flex items-start gap-3 md:gap-4">
//           <a
//             href="https://jklu.edu.in"
//             target="_blank"
//             rel="noopener noreferrer"
// // --- INCOMING CHANGES ---
// //             className={`navbar-jklu-logo block outline-none transition-transform hover:scale-105 active:scale-95 transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
// // ------------------------
//             className={`navbar-jklu-logo block outline-none transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
//           >
//             <img
//               src="/white_jklu_logo.png"
//               alt="JKLU Logo"
//               className="h-10 md:h-14 w-auto object-contain drop-shadow-xl"
//             />
//           </a>
//           <LiquidMetalButton
//             onClick={() => setIsOpen(!isOpen)}
//             aria-label="Toggle navigation menu"
//             aria-expanded={isOpen}
//             className="transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-90 active:duration-75"
//             metalConfig={{
//               colorBack: "#aaaaac",
//               colorTint: "#ffffff",
//               speed: 0.4,
//               repetition: 4,
//               distortion: 0.15,
//               scale: 1,
//             }}
//             borderWidth={4}
//             size="sm"
//             icon={
//               isOpen ? (
//                 <svg
//                   className="w-5 h-5 text-white"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   strokeWidth={2}
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               ) : (
//                 <div className="flex flex-col gap-1 w-4 items-center justify-center">
//                   <span className="w-4 h-[2px] bg-white rounded-full"></span>
//                   <span className="w-4 h-[2px] bg-white rounded-full"></span>
//                   <span className="w-4 h-[2px] bg-white rounded-full"></span>
//                 </div>
//               )
//             }
//           >
//             Menu
//           </LiquidMetalButton>
//         </div>
//       </header>
// 
// // --- INCOMING CHANGES ---
// //       <div
// //         className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between p-6 md:p-12 overflow-y-auto ${
// //           isOpen
// //             ? "opacity-100 pointer-events-auto scale-100"
// //             : "opacity-0 pointer-events-none scale-98"
// //         }`}
// //       >
// //         <div className="max-w-4xl mx-auto w-full pt-24 pb-8 flex flex-col justify-center min-h-[80vh]">
// //           <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
// //             {role !== "admin" &&
// //               navLinks.map((link, idx) => {
// //                 const isActive = pathname === link.href;
// //                 return (
// //                   <Link
// //                     key={link.href}
// //                     href={link.href}
// //                     onClick={() => setIsOpen(false)}
// //                     className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
// //                       isActive
// //                         ? "bg-neutral-900 border-neutral-700 text-white"
// //                         : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.07] hover:border-white/30 hover:text-white"
// //                     }`}
// //                   >
// //                     <div className="flex items-center gap-3">
// //                       <span className="text-xs font-mono text-neutral-400 font-semibold">
// //                         0{idx + 1}
// //                       </span>
// //                       <span className="text-lg md:text-xl font-bold tracking-wide">
// //                         {link.label}
// //                       </span>
// //                     </div>
// //                     <svg
// //                       className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
// //                       fill="none"
// //                       viewBox="0 0 24 24"
// //                       stroke="currentColor"
// //                       strokeWidth={2}
// //                     >
// //                       <path
// //                         strokeLinecap="round"
// //                         strokeLinejoin="round"
// //                         d="M14 5l7 7m0 0l-7 7m7-7H3"
// //                       />
// //                     </svg>
// //                   </Link>
// //                 );
// //               })}
// //           </nav>
// // ------------------------
//       {/* Unmounted while closed rather than hidden: that releases the WebGL
//           context when the menu is not in use, and lets the carousel replay its
//           arrival every time the menu opens. */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             key="nav-shell"
//             variants={SHELL}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             // no backdrop-blur: behind 95%-opaque black it is invisible, but
//             // the GPU still blurs the entire page underneath every frame
//             className="fixed inset-0 z-40 bg-black/95"
//           >
//             {role !== 'admin' && (
//               <div className="absolute inset-0">
//                 <FilmStripCarousel
//                   projects={NAV_PROJECTS}
//                   loading={navLoading}
//                   onProjectSelect={handleProjectSelect}
//                 />
//               </div>
//             )}
// 
//             {!loading && (
//               <motion.div
//                 variants={PANEL}
//                 initial="hidden"
//                 animate="visible"
//                 className="absolute top-5 left-5 z-10 flex flex-col gap-2 max-w-[260px] text-sm"
//               >
//                 {user ? (
// // --- INCOMING CHANGES ---
// //                   <div className="flex flex-wrap items-center justify-between w-full gap-4">
// //                     <div className="flex items-center gap-3 text-sm text-white/80">
// //                       <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
// //                         <svg
// //                           className="w-5 h-5"
// //                           fill="none"
// //                           viewBox="0 0 24 24"
// //                           stroke="currentColor"
// //                           strokeWidth={2}
// //                         >
// //                           <path
// //                             strokeLinecap="round"
// //                             strokeLinejoin="round"
// //                             d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
// //                           />
// //                         </svg>
// //                       </div>
// //                       <div>
// //                         <p className="font-bold text-white">
// //                           {user.displayName || "User"}
// //                         </p>
// //                         <p className="text-xs text-white/50">{user.email}</p>
// //                       </div>
// //                     </div>
// // 
// //                     <div className="flex items-center gap-3">
// //                       {role !== "admin" && (
// // ------------------------
//                   <>
//                     <motion.div variants={PANEL_ITEM}>
//                       <p className="font-bold text-white truncate">{user.displayName || 'User'}</p>
//                       <p className="text-xs text-white/50 truncate">{user.email}</p>
//                     </motion.div>
//                     <motion.div variants={PANEL_ITEM} className="flex flex-wrap gap-2">
//                       {role !== 'admin' && (
//                         <Link
//                           href="/dashboard"
//                           onClick={() => setIsOpen(false)}
//                           className="px-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
//                         >
//                           Dashboard
//                         </Link>
//                       )}
//                       {role === "scanner" && (
//                         <Link
//                           href="/admin"
//                           onClick={() => setIsOpen(false)}
//                           className="px-4 py-2 rounded-full bg-red-950/50 border border-red-700 text-red-200 hover:bg-red-900/50 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
//                         >
// // --- INCOMING CHANGES ---
// //                           <svg
// //                             className="w-4 h-4"
// //                             fill="none"
// //                             viewBox="0 0 24 24"
// //                             stroke="currentColor"
// //                             strokeWidth={2}
// //                           >
// //                             <path
// //                               strokeLinecap="round"
// //                               strokeLinejoin="round"
// //                               d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
// //                             />
// //                           </svg>
// // ------------------------
//                           Entry Portal
//                         </Link>
//                       )}
//                       <button
//                         onClick={handleSignOut}
//                         className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 hover:-translate-y-0.5 active:scale-90 active:duration-75 font-semibold text-xs transition-all duration-300 ease-out"
//                       >
// // --- INCOMING CHANGES ---
// //                         <svg
// //                           className="w-4 h-4"
// //                           fill="none"
// //                           viewBox="0 0 24 24"
// //                           stroke="currentColor"
// //                           strokeWidth={2}
// //                         >
// //                           <path
// //                             strokeLinecap="round"
// //                             strokeLinejoin="round"
// //                             d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
// //                           />
// //                         </svg>
// // ------------------------
//                         Logout
//                       </button>
//                     </motion.div>
//                   </>
//                 ) : (
// // --- INCOMING CHANGES ---
// //                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
// //                     <div>
// //                       <p className="text-base font-bold text-white">
// //                         Join Sabrang 2026
// //                       </p>
// //                       <p className="text-xs text-white/50">
// //                         Register now to participate in all festival events
// //                       </p>
// //                     </div>
// // ------------------------
//                   <motion.div variants={PANEL_ITEM}>
//                     <Link
//                       href="/register"
//                       onClick={() => setIsOpen(false)}
//                       className="block px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wide shadow-xl hover:bg-neutral-200 hover:-translate-y-0.5 active:scale-90 active:duration-75 transition-all duration-300 ease-out text-center"
//                     >
//                       Register Now
//                     </Link>
//                   </motion.div>
//                 )}
//               </motion.div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }
// -----------------------------------------

