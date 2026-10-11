  'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { Loader2 } from 'lucide-react';

// ============================================================================
// BESPOKE CUSTOM GEOMETRIC SVG ICONS FOR SIDEBAR (Gradient-free, Sharp, Heavy-mitre)
// ============================================================================

const CustomShieldIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CustomDashboardIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const CustomBarChartIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="13" width="4" height="8" />
    <rect x="10" y="7" width="4" height="14" />
    <rect x="17" y="3" width="4" height="18" />
  </svg>
);

const CustomClipboardIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="5" y="5" width="14" height="16" />
    <path d="M9 5V2H15V5" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const CustomEntryLogsIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" />
    <path d="M9 9l3 3-3 3" />
    <line x1="15" y1="12" x2="12" y2="12" />
  </svg>
);

const CustomAuditIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="13" y2="12" />
    <line x1="7" y1="16" x2="11" y2="16" />
  </svg>
);

const CustomDutyIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const CustomLogoutIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M10 22H3V2H10" />
    <path d="M21 12H9" />
    <path d="M16 7L21 12L16 17" />
  </svg>
);

const CustomTagIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const CustomMenuIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CustomCloseIcon = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    className={className}
  >
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
);

const CustomScannerIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M4 4h4V2H2v6h2V4zm12-2v2h4v4h2V2h-6zM4 20h4v2H2v-6h2v4zm16 2v-2h-4v-2h6v6h-2z" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const CustomSettingsIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CustomLockIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CustomAlertCircleIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CustomLightbulbIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <path d="M9 21h6" />
    <path d="M9 18h6" />
    <path d="M10 15H14c.55 0 1-.45 1-1v-1c1.2-1.2 2-2.8 2-4.5C17 5.02 14.76 3 12 3S7 5.02 7 8.5c0 1.7.8 3.3 2 4.5v1c0 .55.45 1 1 1z" />
  </svg>
);

const CustomHubIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" />
  </svg>
);

const CustomChevronIcon = ({ isOpen, size = 12, className = '' }: { isOpen: boolean; size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3.2" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${className}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CustomShareIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="square" 
    strokeLinejoin="miter" 
    className={className}
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userRole, setUserRole] = useState<string>(() => {
    // Attempt to guess initial role from URL to prevent flash
    const isScannerRoute = pathname?.startsWith('/scanner') || pathname === '/scan';
    return isScannerRoute ? 'scanner' : 'admin';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authData = sessionStorage.getItem('sabrang_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.role) {
            setUserRole(parsed.role);
          }
        } catch (e) {}
      }
    }
  }, []);

  const navItems = [
    { name: 'Overview', href: '/admin', icon: CustomDashboardIcon },
    { name: 'Registration', href: '/admin/registrations', icon: CustomClipboardIcon },
    { name: 'Ticket Scanner', href: '/admin/scanner', icon: CustomScannerIcon },
    { name: 'Entry Logs', href: '/admin/entry-logs', icon: CustomEntryLogsIcon },
    { name: 'Coupons', href: '/admin/coupons', icon: CustomTagIcon },
    { name: 'Audit Logs', href: '/admin/audit', icon: CustomAuditIcon },
    { name: 'System Errors', href: '/admin/errors', icon: CustomAlertCircleIcon },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    let performer = 'Admin';
    if (isFirebaseConfigured() && auth && auth.currentUser) {
      performer = auth.currentUser.email || auth.currentUser.uid || 'Admin';
    }
    try {
      const { logAdminAction } = await import('../../lib/audit');
      await logAdminAction('LOGOUT', 'sessions', `Admin ${performer} signed out successfully`, performer);
    } catch (err) {
      console.error("Failed to log logout action:", err);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sabrang_auth');
    }
    if (isFirebaseConfigured() && auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Link href="/admin" className="flex items-center gap-2 p-1">
          <img src="/sabrang-logo/Sabrang_Logo.png" alt="Sabrang Logo" className="h-12 w-auto object-contain " />
          <span className="text-sm font-bold text-slate-900 font-space-grotesk">Sabrang Admin</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-600 p-2 cursor-pointer focus:outline-none"
        >
          {isOpen ? <CustomCloseIcon size={24} /> : <CustomMenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Contents - Floating Island Design */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-[100dvh] md:h-[calc(100dvh-48px)] md:w-64 md:m-6 md:rounded-[32px] bg-white backdrop-blur-[40px] border border-slate-200 flex flex-col transition-all duration-500 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 p-1 group">
            <img src="/sabrang-logo/Sabrang_Logo.png" alt="Sabrang Logo" className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-md " />
            <div>
              <p className="text-[13px] font-black text-slate-900 font-space-grotesk leading-tight uppercase tracking-widest">Sabrang '26</p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-none">
          {navItems.map((item: any) => {
            const Icon = item.icon;
            
            // Define restricted items for scanners
            const allowedForScanner = ['Registration', 'Ticket Scanner', 'Entry Logs'];
            const isRestrictedForScanner = userRole === 'scanner' && !allowedForScanner.includes(item.name);
            
            // Adjust href for scanner
            let href = item.href;
            if (userRole === 'scanner') {
              if (item.name === 'Registration') href = '/scanner/registrations';
              if (item.name === 'Ticket Scanner') href = '/scanner';
              if (item.name === 'Entry Logs') href = '/scanner/entry-logs';
            }
            
            const isActive = pathname === href || (href !== '/admin' && href !== '/scanner' && pathname?.startsWith(href));

            if (isRestrictedForScanner) {
              return null;
            }
            
            return (
              <Link 
                key={item.name} 
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-500 relative group overflow-hidden ${
                  isActive 
                    ? 'text-slate-900' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {/* Active State Background & Glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-slate-50 border border-slate-300 rounded-2xl shadow-sm" />
                )}
                
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                )}

                <div className="flex items-center gap-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                  <Icon size={18} className={`transition-all duration-300 ${isActive ? 'text-slate-900 drop-drop-shadow-sm' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span className={isActive ? 'font-semibold tracking-wide' : 'tracking-wide'}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 pb-8 md:pb-4 border-t border-slate-200 shrink-0">
          <button 
            onClick={handleLogoutClick}
            className="flex items-center gap-3.5 px-4 py-3 w-full rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white transition-all duration-300 cursor-pointer text-[13px] font-medium tracking-wide group"
          >
            <CustomLogoutIcon size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-space-grotesk">Sign Out</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to sign out of the Sabrang administration dashboard?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-medium text-slate-900 bg-red-600/80 hover:bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-[110px] justify-center border border-red-500/50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing Out
                    </>
                  ) : (
                    <>
                      <CustomLogoutIcon size={16} />
                      Sign Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
