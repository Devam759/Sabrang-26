'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { OFFICIAL_EVENTS } from '../../../lib/eventPricing';
import { getDisplayPaymentAmount } from '@/lib/registrationDataHelper';

// ============================================================================
// BESPOKE CUSTOM GEOMETRIC SVG ICONS (Gradient-free, Sharp, Heavy-mitre)
// ============================================================================

const CustomUsersIcon = ({ className = '', size = 20 }: { className?: string; size?: number }) => (
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
    <rect x="3" y="14" width="7" height="7" />
    <circle cx="6.5" cy="7.5" r="3.5" />
    <rect x="14" y="14" width="7" height="7" />
    <circle cx="17.5" cy="7.5" r="3.5" />
  </svg>
);

const CustomDownloadIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CustomEyeIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CustomSearchIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <circle cx="10" cy="10" r="6" />
    <line x1="14.5" y1="14.5" x2="21" y2="21" />
  </svg>
);

const CustomFilterIcon = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
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
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CustomMailIcon = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
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
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// ============================================================================
// REGISTRATIONS VIEW Component
// ============================================================================

const getEventTitles = (reg: any): { full: string; short: string; list: string[] } => {
  let eventIds: string[] = [];
  if (Array.isArray(reg.selectedEvents)) eventIds = reg.selectedEvents;
  else if (Array.isArray(reg.events)) eventIds = reg.events;
  else if (reg.eventId) eventIds = [reg.eventId];
  else if (reg.event) eventIds = [reg.event];

  if (eventIds.length === 0) return { full: 'N/A', short: 'N/A', list: [] };

  const titles = eventIds.map(id => OFFICIAL_EVENTS.find(e => e.id === id)?.title || id);
  const full = titles.join(', ');
  
  return { full, short: full, list: titles };
};

export default function Registrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending' | 'declined'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'unsent'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [emailSendingState, setEmailSendingState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [emailSendingMessage, setEmailSendingMessage] = useState('');
  const [serviceEnabled, setServiceEnabled] = useState(true);

  const [reconciling, setReconciling] = useState(false);
  const [reconMessage, setReconMessage] = useState('');
  const [reconState, setReconState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  const handleTriggerReconcile = async () => {
    if (!confirm('Are you sure you want to run the 9 PM reconciliation sync now?')) return;
    setReconState('running');
    setReconMessage('Starting reconciliation...');
    setReconciling(true);
    try {
      const res = await fetch('/api/admin/reconcile-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReconState('done');
        setReconMessage(data.message || 'Reconciliation completed successfully!');
      } else {
        setReconState('error');
        setReconMessage(data.error || data.message || 'Reconciliation failed.');
      }
    } catch (err: any) {
      setReconState('error');
      setReconMessage(err.message || 'An error occurred.');
    } finally {
      setReconciling(false);
      setTimeout(() => {
        setReconState('idle');
        setReconMessage('');
      }, 6000);
    }
  };

  // 1. Fetch Registrations Data& Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 50;

  useEffect(() => {
    let active = true;
    let unsubSnapshot = () => {};

    const safetyTimeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user || !active) return;

      unsubSnapshot = onSnapshot(
        query(collection(db, 'registrations'), orderBy('registeredAt', 'desc')),
        (snap) => {
          if (!active) return;
          clearTimeout(safetyTimeout);
          const allRegs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const validRegs = allRegs.filter((reg: any) => reg.name && reg.name.trim() !== '');
          setRegistrations(validRegs);
          setLoading(false);
        },
        (err) => {
          console.warn("Registrations ordered query fallback:", err.message);
          unsubSnapshot = onSnapshot(
            collection(db, 'registrations'),
            (snap) => {
              if (!active) return;
              clearTimeout(safetyTimeout);
              const allRegs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              setRegistrations(allRegs.filter((reg: any) => reg.name && reg.name.trim() !== ''));
              setLoading(false);
            },
            () => {
              if (active) setLoading(false);
            }
          );
        }
      );
    });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      unsubAuth();
      unsubSnapshot();
    };
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 1. Apply search and dropdown filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesSearch = 
        (reg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.phone || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'entered' && reg.hasEntered) ||
        (statusFilter === 'pending' && !reg.hasEntered && reg.status !== 'declined') ||
        (statusFilter === 'declined' && reg.status === 'declined');

      const matchesEmail = 
        emailFilter === 'all' ||
        (emailFilter === 'sent' && reg.emailSent) ||
        (emailFilter === 'unsent' && !reg.emailSent);

      const matchesEvent = 
        eventFilter === 'all' || 
        (() => {
          if (Array.isArray(reg.selectedEvents) && reg.selectedEvents.includes(eventFilter)) return true;
          if (Array.isArray(reg.events) && reg.events.includes(eventFilter)) return true;
          if (reg.eventId === eventFilter) return true;
          if (reg.event === eventFilter) return true;
          return false;
        })();

      return matchesSearch && matchesStatus && matchesEmail && matchesEvent;
    });
  }, [registrations, searchQuery, statusFilter, emailFilter, eventFilter]);

  // Reset pagination on search query or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, emailFilter, eventFilter]);

  // 2. Apply sorting
  const sortedRegistrations = useMemo(() => {
    const sorted = [...filteredRegistrations].sort((a, b) => {
      // Prioritize test registrations at the top
      if (a.isTest && !b.isTest) return -1;
      if (!a.isTest && b.isTest) return 1;

      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'registeredAt') {
        valA = valA?.toMillis() || 0;
        valB = valB?.toMillis() || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRegistrations, sortField, sortOrder]);

  // 3. Paginate
  const paginatedRegistrations = sortedRegistrations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sortedRegistrations.length / itemsPerPage);

  // Calculate Today's Registrations
  const todaysRegistrationsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return registrations.filter(reg => {
      if (!reg.registeredAt) return false;
      const regDate = reg.registeredAt.toDate();
      return regDate >= today;
    }).length;
  }, [registrations]);

  // Excel (.xlsx) export
  const exportExcel = async () => {
    const headers = [
      'S.No',
      'Registration Number', 
      'Student Name', 
      'Gender', 
      'Application Number', 
      'Phone Number', 
      'Parent Name', 
      'Parent Phone', 
      'Student Email', 
      'Parent Email', 
      'Pincode', 
      'State',
      'Course', 
      'Payment Amount', 
      'Received Amount', 
      'Date Of Payment', 
      'UTR No.', 
      'Bank Reference No.', 
      'Settlement ID', 
      'Transaction ID'
    ];

    const formatSinglePhone = (phone: string): string => {
      if (!phone) return '';
      if (phone.includes(':') || phone.includes('|')) return phone;
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `+91 ${digits.slice(-10)}`;
      }
      return phone;
    };

    const rows = sortedRegistrations
      .filter(r => !r.isTest)
      .map((r, index) => {
        const pin = r.pincode || (r.address ? (r.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');
        const state = r.region || r.state || 'N/A';
        const formattedDate = r.dateOfPayment || (r.registeredAt ? r.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-') : 'N/A');
        const payAmount = getDisplayPaymentAmount(r);
        const recAmount = getDisplayPaymentAmount(r);

        return [
          index + 1,
          r.rollNumber || r.registrationNumber || 'N/A',
          r.name || '',
          r.gender || 'N/A',
          r.rollNumber || '',
          formatSinglePhone(r.phone || ''),
          r.parentName || r.fatherName || '',
          formatSinglePhone(r.parentPhone || r.fatherMobile || ''),
          r.email || '',
          r.parentEmail || r.fatherEmail || 'N/A',
          pin,
          state,
          r.course || 'N/A',
          payAmount,
          recAmount,
          formattedDate,
          r.paymentId || 'N/A',
          r.paymentId || 'N/A',
          r.settlementId || 'N/A',
          r.orderId || 'N/A'
        ];
      });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_registrations_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Registrations',
      headers,
      rows,
    });

    await logAdminAction('EXPORT_REGISTRATIONS_EXCEL', 'registrations', `Exported ${registrations.length} registrations to Excel (.xlsx)`);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'settlementReconciler');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setServiceEnabled(docSnap.data().enabled !== false);
        } else {
          await setDoc(docRef, { enabled: true, updatedAt: serverTimestamp() });
          setServiceEnabled(true);
        }
      } catch (err) {
        console.error('Failed to fetch settlement settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleService = async () => {
    const newValue = !serviceEnabled;
    setServiceEnabled(newValue);
    try {
      const docRef = doc(db, 'settings', 'settlementReconciler');
      await setDoc(docRef, {
        enabled: newValue,
        updatedAt: serverTimestamp(),
        updatedBy: 'Admin Console'
      }, { merge: true });
      await logAdminAction(
        'SETTLEMENT_TOGGLE',
        'settings/settlementReconciler',
        `Daily settlement reconciler service toggled ${newValue ? 'ON' : 'OFF'}`
      );
    } catch (err) {
      console.error('Failed to update service status:', err);
      setServiceEnabled(!newValue);
    }
  };

  const unsentCount = useMemo(() => {
    return registrations.filter(reg => !reg.emailSent).length;
  }, [registrations]);

  const unsyncedCount = useMemo(() => {
    return registrations.filter(reg => !reg.sheetSynced).length;
  }, [registrations]);

  const handleSendUnsentEmails = async () => {
    if (confirm(`Are you sure you want to send confirmation emails to all ${unsentCount} unsent users?`)) {
      setEmailSendingState('sending');
      setEmailSendingMessage(`Starting email dispatch for ${unsentCount} users...`);
      
      let totalSent = 0;
      let totalFailed = 0;
      let hasMore = true;

      try {
        while (hasMore) {
          const res = await fetch('/api/admin/resend-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sendAllUnsent: true })
          });
          const result = await res.json();
          if (!res.ok) {
            setEmailSendingState('error');
            setEmailSendingMessage(result.error || 'Failed to send emails.');
            return;
          }
          totalSent += result.sentCount || 0;
          totalFailed += result.failedCount || 0;
          hasMore = !!result.hasMore;

          if (hasMore) {
            setEmailSendingMessage(`Sent ${totalSent} emails. Continuing dispatch...`);
          } else {
            setEmailSendingState('done');
            setEmailSendingMessage(`Email dispatch complete: ${totalSent} sent successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}.`);
          }
        }
      } catch (err: any) {
        setEmailSendingState('error');
        setEmailSendingMessage(err.message || 'Network error');
      } finally {
        setTimeout(() => {
          setEmailSendingState('idle');
          setEmailSendingMessage('');
        }, 6000);
      }
    }
  };


  return (
    <div className="space-y-8 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Live Counter Cards - Bento Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Registrations */}
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 p-8 md:p-10 rounded-[32px] shadow-xs flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3 group-hover:bg-purple-500/20 transition-all duration-700 ease-out" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10 mb-8">Total Registrations</h2>
          <div className="relative z-10">
            <p className="text-6xl md:text-8xl font-light tracking-tighter text-slate-900 font-space-grotesk">
              {loading ? '-' : registrations.length.toLocaleString('en-IN')}
            </p>
            {filteredRegistrations.length !== registrations.length && (
              <p className="text-[10px] font-bold text-slate-600 mt-3 tracking-widest uppercase bg-white px-3 py-1.5 border border-slate-200 rounded-lg inline-block">
                Filtered: {filteredRegistrations.length}
              </p>
            )}
          </div>
        </div>
        
        {/* Today's Registrations */}
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 p-8 md:p-10 rounded-[32px] shadow-xs flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-[50px] translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/20 transition-all duration-700 ease-out" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10 mb-8">Today's Registrations</h2>
          <div className="relative z-10 flex items-end">
            <p className="text-6xl md:text-8xl font-light tracking-tighter text-slate-600 font-space-grotesk">
              {loading ? '-' : todaysRegistrationsCount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Title & Action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200 mt-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Registration Directory</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-2 font-semibold">Attendee Database</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {unsentCount > 0 && (
            <button
              onClick={handleSendUnsentEmails}
              disabled={loading || emailSendingState === 'sending'}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {emailSendingState === 'sending' ? (
                <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              ) : (
                <CustomMailIcon size={14} />
              )}
              <span>Send Unsent ({unsentCount})</span>
            </button>
          )}
          <button 
            onClick={exportExcel}
            disabled={loading || registrations.length === 0}
            className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CustomDownloadIcon size={14} className="text-slate-700 group-hover:text-slate-900 transition-colors" /> <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Email sending status feedback banner */}
      {emailSendingState !== 'idle' && (
        <div className={`border rounded-2xl px-5 py-4 text-xs font-bold tracking-wider uppercase shadow-xs ${
          emailSendingState === 'sending' ? 'bg-white text-slate-600 border-slate-200' :
          emailSendingState === 'done' ? 'bg-white text-slate-600 border-slate-200' :
          'bg-white text-slate-600 border-slate-200'
        }`}>
          {emailSendingMessage}
        </div>
      )}

      {/* Structured Filters Option Bar - Glassmorphic */}
      <div className="bg-white backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <CustomSearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500/50 transition-all font-mono"
            placeholder="Search Name, Application Number, or Email..."
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full sm:w-[160px] bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all" className="bg-[#1a1525]">Filter: All Status</option>
            <option value="entered" className="bg-[#1a1525]">Checked-In</option>
            <option value="pending" className="bg-[#1a1525]">Pending Check-In</option>
            <option value="declined" className="bg-[#1a1525]">Declined / Blocked</option>
          </select>

          <select
            value={eventFilter}
            onChange={(e: any) => setEventFilter(e.target.value)}
            className="w-full sm:w-[180px] bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all" className="bg-[#1a1525]">Event: All Events</option>
            {OFFICIAL_EVENTS.map(evt => (
              <option key={evt.id} value={evt.id} className="bg-[#1a1525]">{evt.title}</option>
            ))}
          </select>

          <select
            value={emailFilter}
            onChange={(e: any) => setEmailFilter(e.target.value)}
            className="w-full sm:w-[140px] bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all" className="bg-[#1a1525]">Email: All</option>
            <option value="sent" className="bg-[#1a1525]">Email: Sent</option>
            <option value="unsent" className="bg-[#1a1525]">Email: Unsent</option>
          </select>
        </div>
      </div>

      {/* Main Table Segment - Glassmorphic */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/80 border-b border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                  <th className="p-5 w-14 text-center">#</th>
                  <th className="p-5 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-5 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('email')}>
                    Contact {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}


                  </th>
                  <th className="p-5 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('registeredAt')}>
                    Registered {sortField === 'registeredAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-5">Events</th>
                  <th className="p-5">Entry Status</th>
                  <th className="p-5">Email Status</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {paginatedRegistrations.map((reg, idx) => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors duration-500 ease-out group animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: "both", animationDelay: `${idx * 50}ms` }}>
                    <td className="p-5 text-center text-slate-400 font-mono text-[10px]">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-slate-900 transition-colors text-[13px]">{reg.name}</span>
                        {reg.isTest && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-md text-[9px] font-bold uppercase tracking-widest">
                            Test
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-medium text-slate-800 lowercase">{reg.email}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-widest">{reg.phone}</div>
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      {reg.registeredAt && reg.registeredAt.toDate ? (
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-xs">{reg.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">{reg.registeredAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {getEventTitles(reg).list.length === 0 ? (
                          <span className="text-slate-400 font-mono text-[10px]">N/A</span>
                        ) : (
                          getEventTitles(reg).list.map((title, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] whitespace-nowrap uppercase tracking-widest font-bold">
                              {title}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        reg.hasEntered 
                          ? 'bg-white text-slate-600 border border-slate-200' 
                          : (reg.status === 'declined' ? 'bg-white text-slate-600 border border-slate-200' : 'bg-white text-slate-600 border border-slate-200')
                      }`}>
                        {reg.hasEntered ? 'Entered' : (reg.status === 'declined' ? 'Declined' : 'Pending')}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                        reg.emailSent 
                          ? 'bg-white text-slate-600 border border-slate-200' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        {reg.emailSent ? 'Sent' : 'Unsent'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => setSelectedReg(reg)} 
                        className="p-2 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-500 rounded-xl transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <CustomEyeIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
                      No matching registration logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-slate-200 flex justify-between items-center bg-white/80 text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({filteredRegistrations.length} total)
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-[10px] uppercase tracking-widest font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-[10px] uppercase tracking-widest font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Details */}
      <Modal isOpen={!!selectedReg} onClose={() => setSelectedReg(null)} title="Registration Details">
        {selectedReg && (
          <div className="space-y-6 text-slate-900 text-xs">
            <div className="grid grid-cols-2 gap-4">
              {/* Student Details */}
              <div className="col-span-2 border-b border-slate-200 pb-3">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em]">Student Credentials</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Full Name</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">{selectedReg.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Email Address</p>
                <p className="font-medium text-xs text-slate-800 bg-white/80 p-3 border border-slate-100 rounded-xl break-all lowercase">{selectedReg.email}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Phone Number</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono tracking-widest">{selectedReg.phone}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Gender</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">{selectedReg.gender || 'N/A'}</p>
              </div>
              
              {/* Additional Information */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em]">Additional Information</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Registration / Roll No.</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono tracking-widest">{selectedReg.rollNumber || selectedReg.registrationNumber || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Registered At</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">
                  {selectedReg.registeredAt?.toDate ? selectedReg.registeredAt.toDate().toLocaleString('en-IN') : 'N/A'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Address / Locality</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">{selectedReg.address || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Institution ID Card</p>
                <div className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">
                  {selectedReg.idCard !== undefined ? (
                    typeof selectedReg.idCard === 'string' && (selectedReg.idCard.startsWith('http') || selectedReg.idCard.startsWith('/')) ? (
                      <a href={selectedReg.idCard} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full max-w-[200px] overflow-hidden rounded-xl border border-slate-200 group">
                        <img src={selectedReg.idCard} alt="ID Card" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                          <span className="text-white bg-slate-900/80 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">Open Full Image</span>
                        </div>
                      </a>
                    ) : (
                      <span className="text-[12px]">Attached</span>
                    )
                  ) : (
                    <span className="text-slate-400 text-[12px]">Not provided</span>
                  )}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Enrolled Events</p>
                <div className="flex flex-wrap gap-2 bg-white/80 p-3 border border-slate-100 rounded-xl">
                  {getEventTitles(selectedReg).list.length === 0 ? (
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">N/A</span>
                  ) : (
                    getEventTitles(selectedReg).list.map((title, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[9px] uppercase tracking-widest font-bold">
                        {title}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Other Specific Fields */}
              {(selectedReg.teamName || selectedReg.bgmi_teamName || selectedReg.valorant_teamName || selectedReg.freefire_teamName || selectedReg.generic_teamName) && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Team Name</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl break-all">
                    {selectedReg.teamName || selectedReg.bgmi_teamName || selectedReg.valorant_teamName || selectedReg.freefire_teamName || selectedReg.generic_teamName}
                  </p>
                </div>
              )}
              {selectedReg.generic_vaadVivaadRepresentative && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Vaad Vivaad Representative</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">
                    {selectedReg.generic_vaadVivaadRepresentative}
                  </p>
                </div>
              )}
              {selectedReg.bgmi_leaderIgn && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">BGMI Leader IGN</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono">
                    {selectedReg.bgmi_leaderIgn}
                  </p>
                </div>


              )}
              {selectedReg.bgmi_leaderUid && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">BGMI Leader UID</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono">
                    {selectedReg.bgmi_leaderUid}
                  </p>
                </div>
              )}
              {selectedReg.valorant_leaderRiotId && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Valorant Leader Riot ID</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono">
                    {selectedReg.valorant_leaderRiotId}
                  </p>
                </div>
              )}
              {selectedReg.freefire_leaderUid && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Free Fire Leader UID</p>
                  <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl font-mono">
                    {selectedReg.freefire_leaderUid}
                  </p>
                </div>
              )}

              {/* Team Members */}
              {selectedReg.teamMembers && (
                <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-4">Team Members</p>
                  <div className="space-y-4">
                    {(() => {
                      let membersToRender = [];
                      if (Array.isArray(selectedReg.teamMembers)) {
                        membersToRender = selectedReg.teamMembers;
                      } else if (typeof selectedReg.teamMembers === 'object') {
                        Object.entries(selectedReg.teamMembers).forEach(([group, members]) => {
                          if (Array.isArray(members)) {
                            membersToRender.push(...members.map((m) => ({ ...m, _group: group })));
                          }
                        });
                      }

                      if (membersToRender.length === 0) {
                        return <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">No team members registered.</p>;
                      }

                      return membersToRender.map((m: any, idx: number) => (
                        <div key={m.id || idx} className="bg-white/80 border border-slate-100 rounded-xl p-4">
                          <p className="font-bold text-slate-900 mb-3 text-sm">{idx + 1}. {m.name || 'Unknown Name'}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                            {m.email && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Email</span> <span className="font-medium text-slate-800 lowercase">{m.email}</span></p>}
                            {(m.mobileNumber || m.phone) && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Phone</span> <span className="font-mono text-slate-800">{m.mobileNumber || m.phone}</span></p>}
                            {m.gender && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Gender</span> <span className="font-medium text-slate-800">{m.gender}</span></p>}
                            {m.age && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Age</span> <span className="font-medium text-slate-800">{m.age}</span></p>}
                            {m.institutionName && <p className="col-span-1 sm:col-span-2"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Institution</span> <span className="font-medium text-slate-800">{m.institutionName}</span></p>}
                            {m.idCard !== undefined && (
                              <div className="col-span-1 sm:col-span-2 mt-2">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-2">Institution ID Card</span> 
                                {typeof m.idCard === 'string' && (m.idCard.startsWith('http') || m.idCard.startsWith('/')) ? (
                                  <a href={m.idCard} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 group">
                                    <img src={m.idCard} alt={`${m.name} ID Card`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                      <span className="text-white bg-slate-900/80 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">Open Full Image</span>
                                    </div>
                                  </a>
                                ) : (
                                  <span className="font-medium text-slate-800 text-[10px]">Attached</span>
                                )}
                              </div>
                            )}
                            {m._group && <p className="col-span-1 sm:col-span-2"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Event Group</span> <span className="uppercase text-slate-600 font-bold">{m._group}</span></p>}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em]">Payment & Security</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Payment Amount</p>
                <p className="font-medium text-sm text-slate-900 bg-white/80 p-3 border border-slate-100 rounded-xl">
                  {getDisplayPaymentAmount(selectedReg)}
                </p>
              </div>
              {selectedReg.coupon && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Coupon Applied</p>
                  <p className="font-bold text-[13px] text-slate-600 bg-white p-3 border border-slate-200 rounded-xl font-mono">
                    {selectedReg.coupon}
                  </p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-1">Transaction / Order ID</p>
                <p className="font-mono text-[13px] font-bold text-slate-800 bg-white/80 p-3 border border-slate-100 rounded-xl break-all">{selectedReg.orderId || selectedReg.paymentId || 'N/A'}</p>
              </div>

              {/* QR Code */}
              <div className="col-span-2 flex flex-col items-center justify-center p-6 bg-white/80 border border-slate-100 rounded-2xl mt-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full blur-[30px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-4 relative z-10">Ticket QR Code</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${selectedReg.id}&color=ffffff&bgcolor=000000`} 
                  alt="Registration QR Code" 
                  className="w-32 h-32 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10 opacity-90 mix-blend-screen"
                />
              </div>
              
              {/* Actions */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Resend confirmation email to ${selectedReg.name} (${selectedReg.email})?`)) {
                      try {
                        const res = await fetch('/api/admin/resend-emails', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [selectedReg.id] })
                        });
                        const result = await res.json();
                        if (res.ok) {
                          alert('Email sent successfully!');
                          setSelectedReg((prev: any) => (prev ? { ...prev, emailSent: true } : null));
                        } else {
                          alert(`Failed to send email: ${result.error}`);
                        }
                      } catch (err: any) {
                        alert(`Network error: ${err?.message || err}`);
                      }
                    }
                  }}
                  className="px-5 py-3.5 bg-white hover:bg-blue-500/20 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Resend Confirmation Email
                </button>
                <a 
                  href={`/api/receipt?id=${selectedReg.id}`}
                  download
                  className="px-5 py-3.5 bg-white hover:bg-white/90 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center"
                >
                  Download Receipt
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
