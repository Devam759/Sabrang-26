'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { normalizeEventKey } from '../../../lib/couponHelper';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Download, 
  Ticket, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface EntryLogItem {
  id: string;
  ticketId?: string;
  registrationId?: string;
  eventId?: string;
  eventTitle?: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeeRoll?: string;
  entryTime?: any;
  scannedBy?: string;
  scannerId?: string;
  status?: string;
  createdAt?: string;
  timestamp?: any;
}

const DEFAULT_EVENTS = [
  'PANACHE - RAMPWALK',
  'BANDJAM - BATTLE OF BANDS',
  'STEP UP - SOLO DANCE',
  'SYNC - GROUP DANCE',
  'ECHOES OF NOOR - SUFI NIGHT',
  'VERSEVAAD - SLAM POETRY',
  'VALORANT SHOWDOWN',
  'GENERAL FEST ENTRY'
];

export default function EventEntryLogsPage() {
  const [entryLogs, setEntryLogs] = useState<EntryLogItem[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // 1. Fetch live Entry Logs from Firestore
  useEffect(() => {
    let unsubLogs = () => {};
    let unsubRegs = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      unsubLogs = onSnapshot(
        query(collection(db, 'entryLogs'), orderBy('entryTime', 'desc'), limit(2000)),
        (snap) => {
          const fetched = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as EntryLogItem[];
          setEntryLogs(fetched);
          setLoading(false);
        },
        (err) => {
          console.warn("Entry logs query notice:", err?.message);
          setLoading(false);
        }
      );

      unsubRegs = onSnapshot(
        collection(db, 'registrations'),
        (snap) => {
          const regs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAllRegistrations(regs);

          const foundEvents = new Set<string>(DEFAULT_EVENTS);
          regs.forEach((r: any) => {
            const evt = r.eventName || r.eventTitle || r.event;
            if (evt && typeof evt === 'string' && evt.trim()) {
              foundEvents.add(evt.trim().toUpperCase());
            }
          });
          setAvailableEvents(Array.from(foundEvents));
        },
        (err) => {
          console.warn("Entry logs registrations listener notice:", err?.message);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubLogs();
      unsubRegs();
    };
  }, []);

  // Compute Event Entry Statistics
  const eventStats = useMemo(() => {
    let relevantRegs = allRegistrations;
    let relevantLogs = entryLogs;

    if (selectedEvent !== 'all') {
      const targetKey = normalizeEventKey(selectedEvent);
      relevantRegs = allRegistrations.filter(r => {
        const evtName = r.eventName || r.eventTitle || r.event || '';
        const regKey = normalizeEventKey(evtName);
        return regKey.includes(targetKey) || targetKey.includes(regKey);
      });

      relevantLogs = entryLogs.filter(l => {
        const evtName = l.eventTitle || l.eventId || '';
        const logKey = normalizeEventKey(evtName);
        return logKey.includes(targetKey) || targetKey.includes(logKey);
      });
    }

    const registered = relevantRegs.length || relevantLogs.length;
    // Count distinct attendees who entered
    const enteredSet = new Set<string>();
    relevantLogs.forEach(l => {
      if (l.registrationId) enteredSet.add(l.registrationId);
      else if (l.ticketId) enteredSet.add(l.ticketId);
      else if (l.id) enteredSet.add(l.id);
    });

    const entered = Math.max(enteredSet.size, relevantRegs.filter(r => r.hasEntered || r.attended).length);
    const notEntered = Math.max(0, registered - entered);

    return {
      registered,
      entered,
      notEntered,
      attendanceRate: registered > 0 ? Math.round((entered / registered) * 100) : 0,
    };
  }, [allRegistrations, entryLogs, selectedEvent]);

  // Filter Entry Logs dynamically
  const filteredLogs = useMemo(() => {
    return entryLogs.filter((log) => {
      // 1. Event filter
      if (selectedEvent !== 'all') {
        const targetKey = normalizeEventKey(selectedEvent);
        const logKey = normalizeEventKey(log.eventTitle || log.eventId || '');
        const isMatch = logKey.includes(targetKey) || targetKey.includes(logKey);
        if (!isMatch) return false;
      }

      // 2. Search Query (matches name, ticketId, regId, rollNumber, email, staff)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (log.attendeeName || '').toLowerCase().includes(q) ||
          (log.ticketId || '').toLowerCase().includes(q) ||
          (log.registrationId || '').toLowerCase().includes(q) ||
          (log.attendeeRoll || '').toLowerCase().includes(q) ||
          (log.attendeeEmail || '').toLowerCase().includes(q) ||
          (log.scannedBy || '').toLowerCase().includes(q) ||
          (log.eventTitle || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 3. Date Range Filter
      const logMillis = log.entryTime?.toMillis 
        ? log.entryTime.toMillis() 
        : (log.createdAt ? new Date(log.createdAt).getTime() : 0);

      if (filterDateFrom && logMillis < new Date(filterDateFrom).getTime()) {
        return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logMillis > toDate.getTime()) return false;
      }

      return true;
    });
  }, [entryLogs, selectedEvent, searchQuery, filterDateFrom, filterDateTo]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEvent, searchQuery, filterDateFrom, filterDateTo]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportExcel = async () => {
    if (filteredLogs.length === 0) return alert('No entry logs to export.');
    const headers = ['S.No', 'Attendee Name', 'Roll Number', 'Email', 'Event', 'Ticket ID', 'Registration ID', 'Entry Time', 'Scanned By'];
    const rows = filteredLogs.map((l, index) => {
      const timeStr = l.entryTime?.toDate ? l.entryTime.toDate().toLocaleString('en-IN') : (l.createdAt || 'N/A');
      return [
        index + 1,
        l.attendeeName || 'N/A',
        l.attendeeRoll || 'N/A',
        l.attendeeEmail || 'N/A',
        l.eventTitle || 'General Fest Entry',
        l.ticketId || 'N/A',
        l.registrationId || 'N/A',
        timeStr,
        l.scannedBy || 'Staff',
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_event_entry_logs_${selectedEvent === 'all' ? 'all_events' : selectedEvent.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`,
      sheetName: 'Entry Logs',
      headers,
      rows,
    });
  };


  return (
    <div className="space-y-8 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Entry Logs</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-2 font-semibold">Live Scanner Feed</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
          >
            <Download size={15} className="text-slate-700 group-hover:text-slate-900 transition-colors" /> Export Excel
          </button>
        </div>
      </div>

      {/* Entry Statistics Cards - Bento Box Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registered */}
        <div className="p-6 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-500/20 transition-all duration-700 ease-out" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Registered</span>
            <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200">
              <Users size={16} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-5xl font-light tracking-tighter text-slate-900 font-space-grotesk">{eventStats.registered.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-2 tracking-widest uppercase">
              {selectedEvent === 'all' ? 'Total festival registrations' : `For ${selectedEvent}`}
            </p>
          </div>
        </div>

        {/* Entered */}
        <div className="p-6 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative lg:col-span-2">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-[50px] translate-y-1/2 translate-x-1/4 group-hover:bg-green-500/20 transition-all duration-700 ease-out" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Entered (Checked-In)</span>
            <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <p className="text-6xl md:text-7xl font-light tracking-tighter text-slate-900 font-space-grotesk">{eventStats.entered.toLocaleString()}</p>
            <p className="text-[12px] text-slate-600 mt-1 font-bold tracking-widest uppercase bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              {eventStats.attendanceRate}% turn-out
            </p>
          </div>
        </div>

        {/* Not Entered */}
        <div className="p-6 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-white rounded-full blur-[40px] -translate-y-1/2 -translate-x-1/3 group-hover:bg-purple-500/20 transition-all duration-700 ease-out" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Selected Event</span>
            <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200">
              <Calendar size={16} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-lg font-bold text-slate-900 truncate" title={selectedEvent === 'all' ? 'All Events' : selectedEvent}>{selectedEvent === 'all' ? 'All Events (Global)' : selectedEvent}</p>
            <p className="text-[10px] text-slate-600 mt-2 tracking-widest uppercase font-semibold">
              {filteredLogs.length} verified records
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search - Glassmorphic Pills */}
      <div className="bg-white backdrop-blur-xl border border-slate-200 p-3 rounded-2xl flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-xl text-xs text-slate-900 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
            placeholder="Search name, ticket ID, roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Event Filter */}
        <div className="relative w-full md:w-64 shrink-0">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="block w-full pl-4 pr-10 py-3 bg-white/80 border border-slate-100 rounded-xl text-xs text-slate-900 font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="all" className="bg-[#1a1525]">All Events (Global)</option>
            {availableEvents.map(evt => (
              <option key={evt} value={evt} className="bg-[#1a1525]">{evt}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <ChevronRight className="h-4 w-4 text-slate-500 rotate-90" />
          </div>
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-48 shrink-0 flex items-center gap-2">
          <input
            type="date"
            className="block w-full px-4 py-3 bg-white/80 border border-slate-100 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500/50 custom-date-input"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table - Glassmorphic */}
      <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        {loading ? (
          <div className="p-4">
             <SkeletonTable rows={5} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-t border-slate-100">
            <div className="bg-white p-4 rounded-full mb-4 border border-slate-200">
               <UserX className="text-slate-500 h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Check-ins Found</h3>
            <p className="text-slate-500 text-xs">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead>
                <tr className="bg-white/80 border-b border-slate-200">
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500 w-16 text-center">#</th>
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500">Attendee</th>
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500">Event</th>
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500">Ticket ID</th>
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500">Entry Time</th>
                  <th className="p-5 font-bold uppercase tracking-[0.2em] text-[9px] text-slate-500 text-right">Scanned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log, index) => {
                  const entryDate = new Date(log.timestamp);
                  const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors duration-500 ease-out group animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}>
                      <td className="p-5 text-center text-slate-400 font-mono text-[10px]">
                        {globalIdx}
                      </td>

                      {/* Attendee */}
                      <td className="p-5">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-[13px] group-hover:text-slate-900 transition-colors">
                            {log.attendeeName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest">
                            {log.attendeeRoll && log.attendeeRoll !== 'N/A' ? log.attendeeRoll : (log.attendeeEmail || 'N/A')}
                          </p>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="p-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] tracking-widest uppercase">
                          <Calendar size={12} className="text-slate-600" />
                          <span>{log.eventTitle || 'General Fest Entry'}</span>
                        </span>
                      </td>

                      {/* Ticket ID */}
                      <td className="p-5">
                        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-slate-700">
                          <Ticket size={12} className="text-slate-400" />
                          <span>{log.ticketId || log.registrationId || 'TKT-VALID'}</span>
                        </div>
                      </td>

                      {/* Entry Time */}
                      <td className="p-5">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-xs">
                            {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                            {entryDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </td>

                      {/* Scanned By */}
                      <td className="p-5 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200">
                          <ShieldCheck size={12} />
                          <span>{log.scannedBy || log.scannerId || 'Staff Member'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Glassmorphic */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-black/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of{' '}
              <span className="text-slate-800">{filteredLogs.length}</span> entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1 px-2">
                 {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    const isCurrent = page === currentPage;
                    
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                            isCurrent 
                              ? 'bg-slate-900 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 || 
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-slate-400 text-xs px-1">...</span>;
                    }
                    return null;
                 })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        /* Custom date input icon hiding for glassmorphic look */
        .custom-date-input::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}
