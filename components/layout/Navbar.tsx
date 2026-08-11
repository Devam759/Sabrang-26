'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LiquidMetalButton } from '@/components/ui/liquid-metal';

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setIsOpen(false);
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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/team', label: 'Our Team' },
    { href: '/sponsors', label: 'Sponsors' },
    { href: '/events', label: 'Events' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/register', label: 'Registration' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/credits', label: 'Tech Team Credits' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start transition-all duration-300 ease-out ${
          isVisible || isOpen
            ? 'translate-y-0 opacity-100 pointer-events-none'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="pointer-events-auto">
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
            className="block outline-none transition-transform hover:scale-105 active:scale-95"
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
            metalConfig={{
              colorBack: '#aaaaac',
              colorTint: '#ffffff',
              speed: 0.4,
              repetition: 4,
              distortion: 0.15,
              scale: 1,
            }}
            borderWidth={4}
            size="md"
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

      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between p-6 md:p-12 overflow-y-auto ${
          isOpen
            ? 'opacity-100 pointer-events-auto scale-100'
            : 'opacity-0 pointer-events-none scale-98'
        }`}
      >
        <div className="max-w-4xl mx-auto w-full pt-24 pb-8 flex flex-col justify-center min-h-[80vh]">
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
            {role !== 'admin' &&
              navLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.07] hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-400 font-semibold">
                        0{idx + 1}
                      </span>
                      <span className="text-lg md:text-xl font-bold tracking-wide">
                        {link.label}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                );
              })}
          </nav>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            {!loading && (
              <>
                {user ? (
                  <div className="flex flex-wrap items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.displayName || 'User'}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {role !== 'admin' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="px-6 py-3 rounded-full bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 font-semibold text-sm transition-all"
                        >
                          Dashboard
                        </Link>
                      )}
                      {role === 'scanner' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="px-6 py-3 rounded-full bg-red-950/50 border border-red-700 text-red-200 hover:bg-red-900/50 font-semibold text-sm transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Entry Portal
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="px-6 py-3 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 font-semibold text-sm transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div>
                      <p className="text-base font-bold text-white">Join Sabrang 2026</p>
                      <p className="text-xs text-white/50">Register now to participate in all festival events</p>
                    </div>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm tracking-wide shadow-xl hover:bg-neutral-200 active:scale-95 transition-all text-center w-full sm:w-auto"
                    >
                      Register Now
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
