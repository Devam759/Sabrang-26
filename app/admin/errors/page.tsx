'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Download, Filter, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SystemErrors() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    // Synchronize latest 500 error logs in realtime
    const q = query(
      collection(db, 'systemErrors'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore systemErrors stream failed:", error);
      // Fallback query to auditLogs for legacy compatibility
      const fallbackQuery = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      onSnapshot(fallbackQuery, (snap) => {
        const errs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((l: any) => l.action === 'SYSTEM_ERROR' || l.action === 'ERROR');
        setLogs(errs);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter date range
      if (log.timestamp && log.timestamp.toDate) {
        const logDate = log.timestamp.toDate();
        if (filterDateFrom) {
          const from = new Date(filterDateFrom);
          from.setHours(0, 0, 0, 0);
          if (logDate < from) return false;
        }
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) return false;
        }
      }
      return true;
    });
  }, [logs, filterDateFrom, filterDateTo]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDateFrom, filterDateTo]);

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportExcel = async () => {
    if (filteredLogs.length === 0) return alert('No system errors to export.');
    const headers = ['S.No', 'Timestamp', 'Target Module', 'Component / Performer', 'Error Details'];
    const rows = filteredLogs.map((log, index) => {
      const timeStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('en-IN') : 'N/A';
      return [
        index + 1,
        timeStr,
        log.targetEntity || 'System',
        log.performedBy || 'System Error',
        log.details || 'N/A'
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_system_errors_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'System Errors',
      headers,
      rows,
    });
  };


  return (
    <div className="space-y-8 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200 mt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">System Errors</h1>
          <p className="text-slate-500 uppercase tracking-[0.25em] text-[10px] mt-2 font-medium">Diagnostic Logs</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={filteredLogs.length === 0}
          className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={14} className="text-slate-700 group-hover:text-slate-900 transition-colors" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full bg-white backdrop-blur-xl border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between text-slate-800 text-[10px] uppercase tracking-widest font-bold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-500" />
            <span>Search & Filter Errors</span>
          </div>
          <span className="text-slate-500">
            {isMobileFiltersOpen ? 'Hide' : 'Show'}
          </span>
        </button>
      </div>

      {/* Filter Card - Glassmorphic */}
      <div className={`grid transition-all duration-300 md:grid-rows-[1fr] md:opacity-100 ${isMobileFiltersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-wrap gap-5 items-end">
            <div className="flex items-center gap-3 w-full lg:w-auto mb-1">
              <div className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl">
                <AlertTriangle size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Filter Errors</span>
            </div>

            {/* Date From */}
            <div className="flex-grow min-w-[150px]">
              <label className="block text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">From Date</label>
              <input 
                type="date" 
                value={filterDateFrom} 
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all custom-date-input"
              />
            </div>

            {/* Date To */}
            <div className="flex-grow min-w-[150px]">
              <label className="block text-[9px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">To Date</label>
              <input 
                type="date" 
                value={filterDateTo} 
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all custom-date-input"
              />
            </div>

            {/* Clear buttons */}
            <button 
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-xs h-[42px]"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Grid - Glassmorphic */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/80 border-b border-slate-200 text-slate-500 text-[9px] font-medium uppercase tracking-[0.25em]">
                  <th className="p-5 w-14 text-center">#</th>
                  <th className="p-5">Timestamp</th>
                  <th className="p-5">Component / Performer</th>
                  <th className="p-5">Target Node</th>
                  <th className="p-5">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors duration-500 ease-out group animate-in fade-in slide-in-from-bottom-2 text-slate-700" style={{ animationFillMode: "both", animationDelay: `${idx * 50}ms` }}>
                    <td className="p-5 text-center text-slate-400 font-mono text-[10px]">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      {log.timestamp && log.timestamp.toDate ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-slate-900">{log.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest">
                            {log.timestamp.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-5 font-medium text-sm text-slate-900">{log.performedBy || 'System'}</td>
                    <td className="p-5 text-slate-500 font-mono tracking-widest text-[10px] uppercase">{log.targetEntity || 'N/A'}</td>
                    <td className="p-5 whitespace-normal min-w-[280px] max-w-lg text-slate-800 font-mono text-[10px] leading-relaxed bg-white/80 border border-slate-100 rounded-xl">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-500 font-medium text-[10px] uppercase tracking-[0.25em]">
                      No system error logs recorded. System healthy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-slate-200 flex justify-between items-center bg-white/80 text-xs">
              <span className="text-slate-500 font-medium uppercase tracking-[0.25em] text-[10px]">
                Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({filteredLogs.length} entries)
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-[10px] uppercase tracking-[0.25em] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-[10px] uppercase tracking-[0.25em] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
