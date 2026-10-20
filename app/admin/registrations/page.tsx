'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { X, Maximize2, Loader2, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { logAdminAction } from '../../../lib/audit';
import { OFFICIAL_EVENTS } from '../../../lib/eventPricing';
import { getDisplayPaymentAmount, getRegistrationInstituteRaw, normalizeInstitute } from '@/lib/registrationDataHelper';
import { isDateInTodayIST } from '@/lib/dateUtils';

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

/**
 * Robustly extract a valid image URL for ID card from string, object, or fallbacks.
 */
const extractIdCardUrl = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    return null;
  }
  if (typeof val === 'object') {
    if (typeof val.url === 'string' && (val.url.startsWith('http') || val.url.startsWith('/'))) {
      return val.url.trim();
    }
    if (typeof val.secure_url === 'string' && (val.secure_url.startsWith('http') || val.secure_url.startsWith('/'))) {
      return val.secure_url.trim();
    }
  }
  return null;
};

export default function Registrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);

  // Close image preview on Escape key without refreshing or navigating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending' | 'declined' | 'deleted'>('all');
  const [instituteFilter, setInstituteFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState(false);
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

  const [isTogglingCheckIn, setIsTogglingCheckIn] = useState(false);

  const handleToggleCheckIn = async () => {
    if (!selectedReg || isTogglingCheckIn) return;
    const newEntered = !selectedReg.hasEntered;
    const actionLabel = newEntered ? 'CHECK IN' : 'UNDO check-in for';
    if (!confirm(`Are you sure you want to ${actionLabel} attendee ${selectedReg.name}?`)) return;

    setIsTogglingCheckIn(true);
    try {
      const regRef = doc(db, 'registrations', selectedReg.id);
      const adminIdentifier = auth?.currentUser?.email || auth?.currentUser?.uid || 'Admin';
      
      await updateDoc(regRef, {
        hasEntered: newEntered,
        enteredAt: newEntered ? serverTimestamp() : null,
        enteredBy: newEntered ? adminIdentifier : null,
      });

      if (newEntered) {
        await addDoc(collection(db, 'entryLogs'), {
          registrationId: selectedReg.id,
          ticketId: selectedReg.id,
          attendeeName: selectedReg.name || '',
          attendeeRoll: selectedReg.rollNumber || '',
          attendeeEmail: selectedReg.email || '',
          eventTitle: Array.isArray(selectedReg.selectedEvents) 
            ? selectedReg.selectedEvents.join(', ') 
            : (selectedReg.eventName || selectedReg.eventTitle || 'General Fest Entry'),
          entryTime: serverTimestamp(),
          scannedBy: adminIdentifier,
          scannerId: 'ADMIN_CONSOLE',
        });
      }

      await logAdminAction(
        newEntered ? 'MANUAL_CHECKIN' : 'MANUAL_UNDO_CHECKIN',
        `registrations/${selectedReg.id}`,
        `Admin manually ${newEntered ? 'checked in' : 'undid check-in for'} ${selectedReg.name} (${selectedReg.id})`,
        adminIdentifier
      );

      // Update state locally
      setSelectedReg((prev: any) => prev ? {
        ...prev,
        hasEntered: newEntered,
        enteredAt: newEntered ? { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) } : null,
        enteredBy: newEntered ? adminIdentifier : null,
      } : null);

      setRegistrations((prev) => prev.map(r => r.id === selectedReg.id ? {
        ...r,
        hasEntered: newEntered,
        enteredAt: newEntered ? { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) } : null,
        enteredBy: newEntered ? adminIdentifier : null,
      } : r));
    } catch (err: any) {
      console.error('Check-in error:', err);
      alert('Failed to update check-in status: ' + (err?.message || err));
    } finally {
      setIsTogglingCheckIn(false);
    }
  };

  const handleDeleteRegistration = async (regToDelete: any) => {
    if (!regToDelete || isDeleting) return;

    const confirmMessage = `Are you sure you want to delete the registration for "${regToDelete.name}"?\n\nThis will mark them as a deleted user and deactivate their pass.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const regRef = doc(db, 'registrations', regToDelete.id);
      const adminIdentifier = auth?.currentUser?.email || auth?.currentUser?.uid || 'Admin';

      await updateDoc(regRef, {
        isDeleted: true,
        status: 'deleted',
        deletedAt: serverTimestamp(),
        deletedBy: adminIdentifier,
        hasEntered: false,
      });

      await logAdminAction(
        'DELETE_REGISTRATION_SOFT',
        `registrations/${regToDelete.id}`,
        `Admin marked registration as deleted user: ${regToDelete.name} (${regToDelete.email || regToDelete.id})`,
        adminIdentifier
      );

      setRegistrations(prev => prev.map(r => r.id === regToDelete.id ? {
        ...r,
        isDeleted: true,
        status: 'deleted',
        deletedAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) },
        deletedBy: adminIdentifier,
        hasEntered: false,
      } : r));

      if (selectedReg && selectedReg.id === regToDelete.id) {
        setSelectedReg((prev: any) => prev ? {
          ...prev,
          isDeleted: true,
          status: 'deleted',
          deletedAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) },
          deletedBy: adminIdentifier,
          hasEntered: false,
        } : null);
      }

      alert(`Registration for "${regToDelete.name}" has been marked as a deleted user.`);
    } catch (err: any) {
      console.error('Delete registration error:', err);
      alert('Failed to delete registration: ' + (err?.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreRegistration = async (regToRestore: any) => {
    if (!regToRestore || isDeleting) return;

    if (!window.confirm(`Restore registration for "${regToRestore.name}"? This will reactivate them as an active attendee.`)) return;

    setIsDeleting(true);
    try {
      const regRef = doc(db, 'registrations', regToRestore.id);
      const adminIdentifier = auth?.currentUser?.email || auth?.currentUser?.uid || 'Admin';

      await updateDoc(regRef, {
        isDeleted: false,
        status: 'confirmed',
        restoredAt: serverTimestamp(),
        restoredBy: adminIdentifier,
      });

      await logAdminAction(
        'RESTORE_REGISTRATION',
        `registrations/${regToRestore.id}`,
        `Admin restored registration for: ${regToRestore.name} (${regToRestore.email || regToRestore.id})`,
        adminIdentifier
      );

      setRegistrations(prev => prev.map(r => r.id === regToRestore.id ? {
        ...r,
        isDeleted: false,
        status: 'confirmed',
        restoredAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) },
        restoredBy: adminIdentifier,
      } : r));

      if (selectedReg && selectedReg.id === regToRestore.id) {
        setSelectedReg((prev: any) => prev ? {
          ...prev,
          isDeleted: false,
          status: 'confirmed',
          restoredAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) },
          restoredBy: adminIdentifier,
        } : null);
      }

      alert(`Registration for "${regToRestore.name}" has been restored.`);
    } catch (err: any) {
      console.error('Restore registration error:', err);
      alert('Failed to restore registration: ' + (err?.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Fetch Registrations Data & Sorting
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

  // Dynamically compute unique normalized institutes from live registrations, eliminating duplicates
  const instituteOptions = useMemo(() => {
    const map = new Map<string, number>();

    for (const reg of registrations) {
      const isRegDeleted = reg.isDeleted === true || reg.status === 'deleted';
      if (statusFilter === 'deleted') {
        if (!isRegDeleted) continue;
      } else {
        if (isRegDeleted) continue;
      }

      const raw = getRegistrationInstituteRaw(reg);
      const normalized = normalizeInstitute(raw) || 'Other / Not Specified';
      map.set(normalized, (map.get(normalized) || 0) + 1);
    }

    const entries = Array.from(map.entries()).map(([label, count]) => ({
      key: label,
      label,
      count,
    }));

    entries.sort((a, b) => {
      if (a.key.includes('Lakshmipat') || a.key.includes('JKLU')) return -1;
      if (b.key.includes('Lakshmipat') || b.key.includes('JKLU')) return 1;
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });

    return entries;
  }, [registrations, statusFilter]);

  // 1. Apply search and dropdown filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const isRegDeleted = reg.isDeleted === true || reg.status === 'deleted';

      // Hide deleted users by default; only show them when statusFilter === 'deleted'
      if (statusFilter === 'deleted') {
        if (!isRegDeleted) return false;
      } else {
        if (isRegDeleted) return false;
      }

      const rawInst = getRegistrationInstituteRaw(reg);
      const normInst = normalizeInstitute(rawInst);

      const matchesSearch = 
        (reg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        rawInst.toLowerCase().includes(searchQuery.toLowerCase()) ||
        normInst.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        statusFilter === 'deleted' ||
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

      const matchesInstitute =
        instituteFilter === 'all' ||
        (normInst || 'Other / Not Specified') === instituteFilter;

      return matchesSearch && matchesStatus && matchesEmail && matchesEvent && matchesInstitute;
    });
  }, [registrations, searchQuery, statusFilter, emailFilter, eventFilter, instituteFilter]);

  // Reset pagination on search query or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, emailFilter, eventFilter, instituteFilter]);

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
      } else if (sortField === 'amount') {
        const getAmt = (r: any) => {
          const raw = r.paymentAmount ?? r.receivedAmount ?? r.amount ?? r.finalPrice ?? r.price ?? 0;
          const num = Number(raw);
          return isNaN(num) ? 0 : num;
        };
        valA = getAmt(a);
        valB = getAmt(b);
      } else if (sortField === 'college' || sortField === 'institution') {
        valA = normalizeInstitute(getRegistrationInstituteRaw(a)).toLowerCase();
        valB = normalizeInstitute(getRegistrationInstituteRaw(b)).toLowerCase();
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

  // Counts for active vs deleted registrations
  const activeRegistrationsCount = useMemo(() => {
    return registrations.filter(r => !r.isDeleted && r.status !== 'deleted').length;
  }, [registrations]);

  const deletedRegistrationsCount = useMemo(() => {
    return registrations.filter(r => r.isDeleted || r.status === 'deleted').length;
  }, [registrations]);

  // Calculate Today's Registrations (IST standardized, active only)
  const todaysRegistrationsCount = useMemo(() => {
    return registrations.filter(reg => {
      return !reg.isDeleted && reg.status !== 'deleted' && isDateInTodayIST(reg.registeredAt);
    }).length;
  }, [registrations]);

  // Excel (.xlsx) export with Master and individual event sheets
  const exportExcel = async () => {
    const { extractRegistrationInfo } = await import('../../../lib/registrationDataHelper');

    const formatSinglePhone = (phone: string): string => {
      if (!phone) return '';
      if (phone.includes(':') || phone.includes('|')) return phone;
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `+91 ${digits.slice(-10)}`;
      }
      return phone;
    };

    const masterHeaders = [
      'S.No',
      'Participant Name',
      'Gender',
      'Phone Number',
      'Email',
      'College / Institution',
      'Course',
      'Event(s)',
      'Event Type',
      'Team Name',
      'Total Team Members (incl. Leader)',
      'State',
      'Pincode',
      'Payment Amount',
      'Received Amount',
      'Date Of Payment'
    ];

    const eventHeaders = [
      'S.No',
      'Participant Name',
      'Gender',
      'Phone Number',
      'Email',
      'College / Institution',
      'Course',
      'Event Type',
      'Team Name',
      'Total Team Members (incl. Leader)',
      'State',
      'Pincode',
      'Payment Amount',
      'Received Amount',
      'Date Of Payment'
    ];

    const validRegistrations = sortedRegistrations.filter(r => !r.isTest);

    // 1. Build Master Sheet Rows
    const masterRows = validRegistrations.map((r, index) => {
      const pin = r.pincode || (r.address ? (r.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');
      const state = r.region || r.state || 'N/A';
      const formattedDate = r.dateOfPayment || (r.registeredAt ? r.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/ /g, '-') : 'N/A');
      const payAmount = getDisplayPaymentAmount(r);
      const recAmount = getDisplayPaymentAmount(r);
      const unifiedData = extractRegistrationInfo(r, r.id);
      const evTitles = getEventTitles(r);

      return [
        index + 1,
        unifiedData.name,
        r.gender || 'N/A',
        formatSinglePhone(unifiedData.phone || r.phone || ''),
        unifiedData.email,
        unifiedData.college,
        r.course || 'N/A',
        evTitles.full,
        unifiedData.eventType,
        unifiedData.teamName,
        unifiedData.totalMembers,
        state,
        pin,
        payAmount,
        recAmount,
        formattedDate
      ];
    });

    // 2. Build Event Sheets for each official event
    const eventSheets: { sheetName: string; headers: string[]; rows: (string | number | boolean | null | undefined)[][] }[] = [];

    // Track which events have registrations plus include all official events
    const allEventsMap = new Map<string, string>();
    OFFICIAL_EVENTS.forEach(e => allEventsMap.set(e.id, e.title));

    // Also collect any events mentioned in registrations
    validRegistrations.forEach(r => {
      const titles = getEventTitles(r).list;
      titles.forEach(t => {
        if (!allEventsMap.has(t)) {
          allEventsMap.set(t, t);
        }
      });
    });

    allEventsMap.forEach((eventTitle, eventKey) => {
      const matchingRegs = validRegistrations.filter(r => {
        const evTitles = getEventTitles(r);
        return evTitles.list.includes(eventTitle) ||
               (Array.isArray(r.selectedEvents) && r.selectedEvents.includes(eventKey)) ||
               r.eventId === eventKey ||
               r.event === eventTitle;
      });

      const eventRows = matchingRegs.map((r, index) => {
        const pin = r.pincode || (r.address ? (r.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');
        const state = r.region || r.state || 'N/A';
        const formattedDate = r.dateOfPayment || (r.registeredAt ? r.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/ /g, '-') : 'N/A');
        const payAmount = getDisplayPaymentAmount(r);
        const recAmount = getDisplayPaymentAmount(r);
        const unifiedData = extractRegistrationInfo(r, r.id);

        return [
          index + 1,
          unifiedData.name,
          r.gender || 'N/A',
          formatSinglePhone(unifiedData.phone || r.phone || ''),
          unifiedData.email,
          unifiedData.college,
          r.course || 'N/A',
          unifiedData.eventType,
          unifiedData.teamName,
          unifiedData.totalMembers,
          state,
          pin,
          payAmount,
          recAmount,
          formattedDate
        ];
      });

      eventSheets.push({
        sheetName: eventTitle,
        headers: eventHeaders,
        rows: eventRows,
      });
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_registrations_master_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheets: [
        {
          sheetName: 'Master',
          headers: masterHeaders,
          rows: masterRows,
        },
        ...eventSheets,
      ],
    });

    await logAdminAction(
      'EXPORT_REGISTRATIONS_EXCEL',
      'registrations',
      `Exported ${validRegistrations.length} registrations to Excel (.xlsx) with Master and ${eventSheets.length} Event sheets`
    );
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
    return registrations.filter(reg => !reg.emailSent && !reg.isDeleted && reg.status !== 'deleted').length;
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
      {/* Live Counter Cards - Bento Boxes (Side-by-side on mobile, compact vertical footprint) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Registrations */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[32px] shadow-xs flex flex-col justify-between group transition-all duration-500 overflow-hidden relative">
          <div className="hidden sm:block absolute top-0 right-0 w-24 h-24 sm:w-48 sm:h-48 bg-purple-500/10 rounded-full blur-[30px] sm:blur-[50px] -translate-y-1/2 translate-x-1/3 group-hover:bg-purple-500/20 transition-all duration-700 ease-out" />
          <h2 className="text-[10px] sm:text-xs md:text-sm font-bold sm:font-semibold text-slate-500 uppercase tracking-widest sm:tracking-normal relative z-10 mb-2 sm:mb-8 truncate">Total Registrations</h2>
          <div className="relative z-10">
            <p className="text-3xl sm:text-6xl md:text-8xl font-light tracking-tighter text-slate-900 font-space-grotesk leading-none">
              {loading ? '-' : activeRegistrationsCount.toLocaleString('en-IN')}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-3">
              {filteredRegistrations.length !== activeRegistrationsCount && (
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600 bg-white px-2.5 sm:px-3 py-1 border border-slate-200 rounded-lg inline-block">
                  Filtered: {filteredRegistrations.length}
                </p>
              )}
              {deletedRegistrationsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'deleted' ? 'all' : 'deleted')}
                  className={`text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 border rounded-lg inline-block transition-colors cursor-pointer ${
                    statusFilter === 'deleted'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200'
                  }`}
                  title="Click to view deleted users"
                >
                  {deletedRegistrationsCount} Deleted
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Today's Registrations */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[32px] shadow-xs flex flex-col justify-between group transition-all duration-500 overflow-hidden relative">
          <div className="hidden sm:block absolute bottom-0 right-0 w-24 h-24 sm:w-48 sm:h-48 bg-blue-500/10 rounded-full blur-[30px] sm:blur-[50px] translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/20 transition-all duration-700 ease-out" />
          <h2 className="text-[10px] sm:text-xs md:text-sm font-bold sm:font-semibold text-slate-500 uppercase tracking-widest sm:tracking-normal relative z-10 mb-2 sm:mb-8 truncate">Today's Registrations</h2>
          <div className="relative z-10 flex items-end">
            <p className="text-3xl sm:text-6xl md:text-8xl font-light tracking-tighter text-slate-600 font-space-grotesk leading-none">
              {loading ? '-' : todaysRegistrationsCount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Title & Action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200 mt-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Registration Directory</h1>
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
            className="w-full sm:w-[175px] bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all">Status: Active (All)</option>
            <option value="entered">Checked-In</option>
            <option value="pending">Pending Check-In</option>
            <option value="declined">Declined / Blocked</option>
            <option value="deleted">Deleted Users {deletedRegistrationsCount > 0 ? `(${deletedRegistrationsCount})` : ''}</option>
          </select>

          <select
            value={instituteFilter}
            onChange={(e: any) => setInstituteFilter(e.target.value)}
            className="w-full sm:w-[195px] bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none truncate"
            title={instituteFilter === 'all' ? 'All Institutes' : `Institute: ${instituteFilter}`}
          >
            <option value="all">Institute: All ({instituteOptions.length})</option>
            {instituteOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.count})
              </option>
            ))}
          </select>

          <select
            value={eventFilter}
            onChange={(e: any) => setEventFilter(e.target.value)}
            className="w-full sm:w-[180px] bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all">Event: All Events</option>
            {OFFICIAL_EVENTS.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>

          <select
            value={emailFilter}
            onChange={(e: any) => setEmailFilter(e.target.value)}
            className="w-full sm:w-[140px] bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all">Email: All</option>
            <option value="sent">Email: Sent</option>
            <option value="unsent">Email: Unsent</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || eventFilter !== 'all' || emailFilter !== 'all' || instituteFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setEventFilter('all');
                setEmailFilter('all');
                setInstituteFilter('all');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Segment - Crisp Performance Container */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('email')}>
                    Contact {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap" onClick={() => handleSort('amount')}>
                    Amount Paid {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('registeredAt')}>
                    Registered {sortField === 'registeredAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4">Events</th>
                  <th className="p-4">Entry Status</th>
                  <th className="p-4">Email Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {paginatedRegistrations.map((reg, idx) => {
                  const isRegDeleted = reg.isDeleted === true || reg.status === 'deleted';
                  return (
                    <tr 
                      key={reg.id} 
                      className={`transition-colors duration-500 ease-out group animate-in fade-in slide-in-from-bottom-2 ${
                        isRegDeleted ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'
                      }`} 
                      style={{ animationFillMode: "both", animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="p-5 text-center text-slate-400 font-mono text-[10px]">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold transition-colors text-[13px] ${
                            isRegDeleted ? 'line-through text-slate-500' : 'text-slate-900 group-hover:text-slate-900'
                          }`}>
                            {reg.name}
                          </span>
                          {isRegDeleted && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[9px] font-bold uppercase tracking-widest">
                              Deleted
                            </span>
                          )}
                          {reg.isTest && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-md text-[9px] font-bold uppercase tracking-widest">
                              Test
                            </span>
                          )}
                        </div>
                        {(() => {
                          const raw = getRegistrationInstituteRaw(reg);
                          const inst = normalizeInstitute(raw);
                          if (!inst) return null;
                          const isJKLU = inst === 'JK Lakshmipat University' || inst.includes('JKLU');
                          return (
                            <div className="mt-1 flex items-center gap-1.5" title={raw ? `Registered as: "${raw}"` : inst}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${
                                isJKLU 
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                                  : 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold'
                              }`}>
                                🏛️ {inst}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-5">
                        <div className="font-medium text-slate-800 lowercase">{reg.email}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-widest">{reg.phone}</div>
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs font-mono">
                          {getDisplayPaymentAmount(reg)}
                        </div>
                        {reg.coupon && (
                          <span className="inline-block text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-mono mt-0.5 uppercase tracking-wide">
                            {reg.coupon}
                          </span>
                        )}
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        {reg.registeredAt && reg.registeredAt.toDate ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-xs">{reg.registeredAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest">{reg.registeredAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                          </div>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {getEventTitles(reg).list.length === 0 ? (
                            <span className="text-slate-400 font-mono text-[10px]">N/A</span>
                          ) : (
                            getEventTitles(reg).list.map((title, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] uppercase tracking-wider font-semibold whitespace-normal leading-tight">
                                {title}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                          isRegDeleted
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : reg.hasEntered 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : (reg.status === 'declined' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200')
                        }`}>
                          {isRegDeleted ? 'Deleted' : (reg.hasEntered ? 'Entered' : (reg.status === 'declined' ? 'Declined' : 'Pending'))}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                          reg.emailSent 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {reg.emailSent ? 'Sent' : 'Unsent'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedReg(reg)} 
                            className="p-2 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-500 rounded-xl transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <CustomEyeIcon size={16} />
                          </button>
                          {isRegDeleted ? (
                            <button
                              onClick={() => handleRestoreRegistration(reg)}
                              disabled={isDeleting}
                              className="p-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              title="Restore Registration"
                            >
                              <RotateCcw size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteRegistration(reg)}
                              disabled={isDeleting}
                              className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Registration (Set as deleted user)"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                    window.scrollTo(0, 0);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-[10px] uppercase tracking-widest font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo(0, 0);
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
            {(selectedReg.isDeleted || selectedReg.status === 'deleted') && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider text-rose-900">User Marked As Deleted</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Marked as deleted {selectedReg.deletedBy ? `by ${selectedReg.deletedBy}` : ''}. Fest entry pass is inactive.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleRestoreRegistration(selectedReg)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw size={12} />
                  Restore User
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {/* Student Details */}
              <div className="col-span-2 border-b border-slate-200 pb-2">
                <p className="text-xs font-semibold text-slate-700">Student Credentials</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Full Name</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">{selectedReg.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-xs text-slate-800 bg-white/80 p-3 border border-slate-200 rounded-xl break-all lowercase">{selectedReg.email}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Phone Number</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">{selectedReg.phone}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Gender</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">{selectedReg.gender || 'N/A'}</p>
              </div>
              
              {/* Additional Information */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                <p className="text-xs font-semibold text-slate-700">Additional Information</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Registration ID</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">{selectedReg.rollNumber || selectedReg.registrationNumber || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Registered At</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">
                  {selectedReg.registeredAt?.toDate ? selectedReg.registeredAt.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">College / Institution</p>
                <div className="bg-white/80 p-3 border border-slate-200 rounded-xl">
                  <p className="font-semibold text-sm text-slate-900">
                    {normalizeInstitute(getRegistrationInstituteRaw(selectedReg)) || 'N/A'}
                  </p>
                  {getRegistrationInstituteRaw(selectedReg) && getRegistrationInstituteRaw(selectedReg) !== normalizeInstitute(getRegistrationInstituteRaw(selectedReg)) && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate" title={getRegistrationInstituteRaw(selectedReg)}>
                      Raw: &quot;{getRegistrationInstituteRaw(selectedReg)}&quot;
                    </p>
                  )}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Address / Locality</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">{selectedReg.address || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Institution ID Card</p>
                <div className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">
                  {(() => {
                    let cardUrl = extractIdCardUrl(selectedReg.idCard);
                    if (!cardUrl && selectedReg.idCards) {
                      for (const k of Object.keys(selectedReg.idCards)) {
                        cardUrl = extractIdCardUrl(selectedReg.idCards[k]);
                        if (cardUrl) break;
                      }
                    }
                    if (!cardUrl && selectedReg.teamMembers) {
                      for (const group of Object.keys(selectedReg.teamMembers)) {
                        const members = Array.isArray(selectedReg.teamMembers[group]) ? selectedReg.teamMembers[group] : [];
                        for (const mem of members) {
                          cardUrl = extractIdCardUrl(mem?.idCard);
                          if (cardUrl) break;
                        }
                        if (cardUrl) break;
                      }
                    }

                    if (cardUrl) {
                      return (
                        <div className="space-y-2">
                          <button 
                            type="button"
                            onClick={() => setPreviewImage({ url: cardUrl!, title: `${selectedReg.name} - Institution ID Card` })}
                            className="block relative h-44 w-full max-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group shadow-xs cursor-pointer text-left focus:outline-none"
                          >
                            <img 
                              src={cardUrl} 
                              alt="ID Card" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center p-3 text-center text-slate-500 text-[10px] gap-1">
                              <span className="font-bold text-slate-700">Preview Unavailable</span>
                              <span className="text-[9px] text-slate-400">Click to view image</span>
                            </div>
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                              <span className="text-white bg-slate-900/80 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl flex items-center gap-1.5">
                                <Maximize2 size={12} />
                                View Image
                              </span>
                            </div>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPreviewImage({ url: cardUrl!, title: `${selectedReg.name} - Institution ID Card` })}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider cursor-pointer"
                          >
                            <Maximize2 size={12} />
                            View Image (Current Tab)
                          </button>
                        </div>
                      );
                    }

                    return <span className="text-slate-400 text-[12px]">Not uploaded / No image attached</span>;
                  })()}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Enrolled Events</p>
                <div className="flex flex-wrap gap-2 bg-white/80 p-3 border border-slate-200 rounded-xl">
                  {getEventTitles(selectedReg).list.length === 0 ? (
                    <span className="text-slate-500 font-semibold text-xs">N/A</span>
                  ) : (
                    getEventTitles(selectedReg).list.map((title, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                        {title}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Other Specific Fields */}
              {(selectedReg.teamName || selectedReg.bgmi_teamName || selectedReg.valorant_teamName || selectedReg.freefire_teamName || selectedReg.generic_teamName) && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Team Name</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl break-all">
                    {selectedReg.teamName || selectedReg.bgmi_teamName || selectedReg.valorant_teamName || selectedReg.freefire_teamName || selectedReg.generic_teamName}
                  </p>
                </div>
              )}
              {selectedReg.generic_vaadVivaadRepresentative && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Vaad Vivaad Representative</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">
                    {selectedReg.generic_vaadVivaadRepresentative}
                  </p>
                </div>
              )}
              {selectedReg.bgmi_leaderIgn && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">BGMI Leader IGN</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">
                    {selectedReg.bgmi_leaderIgn}
                  </p>
                </div>


              )}
              {selectedReg.bgmi_leaderUid && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">BGMI Leader UID</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">
                    {selectedReg.bgmi_leaderUid}
                  </p>
                </div>
              )}
              {selectedReg.valorant_leaderRiotId && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Valorant Leader Riot ID</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">
                    {selectedReg.valorant_leaderRiotId}
                  </p>
                </div>
              )}
              {selectedReg.freefire_leaderUid && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Free Fire Leader UID</p>
                  <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl font-mono">
                    {selectedReg.freefire_leaderUid}
                  </p>
                </div>
              )}

              {/* Team Members */}
              {selectedReg.teamMembers && (
                <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                  {(() => {
                    let membersToRender: any[] = [];
                    if (Array.isArray(selectedReg.teamMembers)) {
                      membersToRender = selectedReg.teamMembers;
                    } else if (typeof selectedReg.teamMembers === 'object') {
                      Object.entries(selectedReg.teamMembers).forEach(([group, members]) => {
                        if (Array.isArray(members)) {
                          membersToRender.push(...members.map((m) => ({ ...m, _group: group })));
                        }
                      });
                    }
                    const totalMembersCount = membersToRender.length + 1; // Leader + Teammates

                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-semibold text-slate-700">Team Members</p>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Total {totalMembersCount} Members (Leader + {membersToRender.length} Teammate{membersToRender.length === 1 ? '' : 's'})
                          </span>
                        </div>
                        <div className="space-y-4">
                          {membersToRender.length === 0 ? (
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">No team members registered.</p>
                          ) : (
                            membersToRender.map((m: any, idx: number) => (
                              <div key={m.id || idx} className="bg-white/80 border border-slate-100 rounded-xl p-4">
                                <p className="font-bold text-slate-900 mb-3 text-sm">{idx + 1}. {m.name || 'Unknown Name'}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                            {m.email && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Email</span> <span className="font-medium text-slate-800 lowercase">{m.email}</span></p>}
                            {(m.mobileNumber || m.phone) && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Phone</span> <span className="font-mono text-slate-800">{m.mobileNumber || m.phone}</span></p>}
                            {m.gender && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Gender</span> <span className="font-medium text-slate-800">{m.gender}</span></p>}
                            {m.age && <p><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Age</span> <span className="font-medium text-slate-800">{m.age}</span></p>}
                            {m.institutionName && <p className="col-span-1 sm:col-span-2"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Institution</span> <span className="font-medium text-slate-800">{m.institutionName}</span></p>}
                            {(() => {
                              const memberCardUrl = extractIdCardUrl(m.idCard);
                              if (memberCardUrl) {
                                return (
                                  <div className="col-span-1 sm:col-span-2 mt-2">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-2">Institution ID Card</span> 
                                    <div className="space-y-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => setPreviewImage({ url: memberCardUrl, title: `${m.name} - Institution ID Card` })}
                                        className="block relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group shadow-xs cursor-pointer text-left focus:outline-none"
                                      >
                                        <img 
                                          src={memberCardUrl} 
                                          alt={`${m.name} ID Card`} 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                          onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                        />
                                        <div style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center p-3 text-center text-slate-500 text-[10px] gap-1">
                                          <span className="font-bold text-slate-700">Preview Unavailable</span>
                                          <span className="text-[9px] text-slate-400">Click to view image</span>
                                        </div>
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                          <span className="text-white bg-slate-900/80 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl flex items-center gap-1.5">
                                            <Maximize2 size={12} />
                                            View Image
                                          </span>
                                        </div>
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setPreviewImage({ url: memberCardUrl, title: `${m.name} - Institution ID Card` })}
                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider cursor-pointer"
                                      >
                                        <Maximize2 size={12} />
                                        View Image (Current Tab)
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="col-span-1 sm:col-span-2 mt-2">
                                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Institution ID Card</span> 
                                  <span className="font-medium text-slate-400 text-[11px]">Not uploaded / No image attached</span>
                                </div>
                              );
                            })()}
                            {m._group && <p className="col-span-1 sm:col-span-2"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block mb-1">Event Group</span> <span className="uppercase text-slate-600 font-bold">{m._group}</span></p>}
                          </div>
                        </div>
                      ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Payment Details */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-2">
                <p className="text-xs font-semibold text-slate-700">Payment & Security</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Payment Amount</p>
                <p className="font-semibold text-sm text-slate-900 bg-white/80 p-3 border border-slate-200 rounded-xl">
                  {getDisplayPaymentAmount(selectedReg)}
                </p>
              </div>
              {selectedReg.coupon && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Coupon Applied</p>
                  <p className="font-semibold text-sm text-indigo-700 bg-indigo-50/50 p-3 border border-indigo-200 rounded-xl font-mono">
                    {selectedReg.coupon}
                  </p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Transaction / Order ID</p>
                <p className="font-mono text-xs font-semibold text-slate-800 bg-white/80 p-3 border border-slate-200 rounded-xl break-all">{selectedReg.orderId || selectedReg.paymentId || 'N/A'}</p>
              </div>

              {/* QR Code */}
              <div className="col-span-2 flex flex-col items-center justify-center p-6 bg-slate-50/80 border border-slate-200 rounded-2xl mt-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">Ticket QR Code</p>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedReg.id)}&color=0f172a&bgcolor=ffffff`} 
                    alt="Registration QR Code" 
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2.5 select-all">{selectedReg.id}</p>
              </div>
              
              {/* Actions */}
              <div className="col-span-2 border-t border-slate-200 pt-5 mt-4 flex flex-wrap items-center justify-end gap-3">
                {selectedReg.isDeleted || selectedReg.status === 'deleted' ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleRestoreRegistration(selectedReg)}
                    className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    Restore Registration
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteRegistration(selectedReg)}
                    className="px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Delete Registration
                  </button>
                )}
                <button
                  type="button"
                  disabled={isTogglingCheckIn || selectedReg.isDeleted || selectedReg.status === 'deleted'}
                  onClick={handleToggleCheckIn}
                  className={`px-5 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                    selectedReg.hasEntered
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {isTogglingCheckIn ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : selectedReg.hasEntered ? (
                    'Undo Check-In'
                  ) : (
                    'Check In Attendee'
                  )}
                </button>
                <button
                  type="button"
                  disabled={selectedReg.isDeleted || selectedReg.status === 'deleted'}
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
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Resend Confirmation Email
                </button>
                <a 
                  href={`/api/receipt?id=${selectedReg.id}&order_id=${selectedReg.orderId || ''}`}
                  download
                  className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center shadow-sm"
                >
                  Download Receipt
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* In-Tab Image Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* High-visibility Floating Cross Button for Mobile & Desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            className="fixed top-3 right-3 sm:top-6 sm:right-6 z-[220] h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 active:scale-90 border border-white/20 shadow-2xl transition-all cursor-pointer focus:outline-none"
            aria-label="Close image preview"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          {/* Modal Box */}
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden z-[210] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200/80 bg-white/95 shrink-0">
              <div className="truncate pr-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-space-grotesk truncate">
                  {previewImage.title || 'Institution ID Card'}
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                  Identity Verification Preview
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 transition-colors cursor-pointer border border-slate-200 shrink-0"
                aria-label="Close image preview"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative w-full flex-1 max-h-[72vh] sm:max-h-[75vh] flex items-center justify-center overflow-auto p-3 sm:p-6 bg-slate-50/70">
              <img
                src={previewImage.url}
                alt={previewImage.title || "ID Card Preview"}
                className="max-h-[65vh] sm:max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-xs"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none' }} className="flex-col items-center justify-center p-8 text-center text-slate-500 gap-2">
                <p className="font-bold text-sm text-slate-800">Preview Unavailable</p>
                <p className="text-xs text-slate-500 max-w-xs">The image file could not be loaded from the storage URL.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white text-xs shrink-0">
              <a 
                href={previewImage.url} 
                download
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors"
              >
                Open Original File ↗
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
