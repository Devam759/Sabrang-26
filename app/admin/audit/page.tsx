'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Download, Filter, RotateCcw } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    // Keep max 500 audit logs synchronized in realtime
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore auditLogs stream failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter action
      if (filterAction && log.action !== filterAction) return false;
      
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
  }, [logs, filterAction, filterDateFrom, filterDateTo]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, filterDateFrom, filterDateTo]);

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportExcel = async () => {
    if (filteredLogs.length === 0) return alert('No audit records to export.');
    const headers = ['S.No', 'Timestamp', 'Action Type', 'Performed By', 'Target Entity', 'Details'];
    const rows = filteredLogs.map((log, index) => {
      const timeStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('en-IN') : 'N/A';
      return [
        index + 1,
        timeStr,
        log.action || 'N/A',
        log.performedBy || 'System',
        log.targetEntity || 'N/A',
        log.details || 'N/A'
      ];
    });

    const { exportToExcel } = await import('../../../lib/excelExportHelper');
    await exportToExcel({
      filename: `sabrang_audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Audit Logs',
      headers,
      rows,
    });
  };


  return (
    <div className="space-y-8 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Audit Logs</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-2 font-semibold">System Action Tracking</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={filteredLogs.length === 0}
          className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={15} className="text-slate-700 group-hover:text-slate-900 transition-colors" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between text-slate-900 text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span>Search & Filter</span>
          </div>
          <span className="text-[10px] text-slate-600 font-bold">
            {isMobileFiltersOpen ? 'HIDE' : 'SHOW'}
          </span>
        </button>
      </div>

      {/* Filter Card */}
      <div className={`grid transition-all duration-300 md:grid-rows-[1fr] md:opacity-100 ${isMobileFiltersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-[24px] shadow-xs flex flex-wrap gap-4 items-end">
            
            {/* Action filter */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">Action Type</label>
              <select 
                value={filterAction} 
                onChange={e => setFilterAction(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
              >
                <option value="" className="bg-[#1a1525]">All Actions ({uniqueActions.length})</option>
                {uniqueActions.map(a => <option key={a} value={a} className="bg-[#1a1525]">{a}</option>)}
              </select>
            </div>

            {/* Date From */}
            <div className="flex-grow min-w-[140px]">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">From Date</label>
              <input 
                type="date" 
                value={filterDateFrom} 
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-mono focus:outline-none focus:border-purple-500/50 custom-date-input"
              />
            </div>

            {/* Date To */}
            <div className="flex-grow min-w-[140px]">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">To Date</label>
              <input 
                type="date" 
                value={filterDateTo} 
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl py-3 px-4 text-xs text-slate-900 font-mono focus:outline-none focus:border-purple-500/50 custom-date-input"
              />
            </div>

            {/* Clear buttons */}
            <button 
              onClick={() => { setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:text-slate-900 rounded-xl transition-colors cursor-pointer shadow-xs h-[46px]"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/80 border-b border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                  <th className="p-5 w-14 text-center">#</th>
                  <th className="p-5">Timestamp</th>
                  <th className="p-5">Performed By</th>
                  <th className="p-5">Action</th>
                  <th className="p-5">Target Entity</th>
                  <th className="p-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {paginatedLogs.map((log, index) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : null;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors duration-500 ease-out group animate-in fade-in slide-in-from-bottom-2" style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}>
                      <td className="p-5 text-center text-slate-400 font-bold font-mono text-[10px]">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-5">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-[13px]">
                            {logDate ? logDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                            {logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </p>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{log.performedBy}</p>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold tracking-widest uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-5">
                        <p className="text-slate-600 font-mono text-[10px] tracking-wider">{log.targetEntity || 'System'}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-slate-700 text-xs leading-relaxed max-w-sm whitespace-normal">{log.details}</p>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <Filter className="mx-auto h-8 w-8 mb-3 opacity-50" />
                      <p className="font-bold text-sm">No logs match criteria.</p>
                      <p className="text-[10px] mt-1 uppercase tracking-widest">Adjust filters to see results.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                     if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                       return (
                         <button
                           key={page}
                           onClick={() => setCurrentPage(page)}
                           className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                             currentPage === page 
                               ? 'bg-slate-900 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                           }`}
                         >
                           {page}
                         </button>
                       );
                     } else if (page === currentPage - 2 || page === currentPage + 2) {
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
      )}

      <style jsx global>{`
        .custom-date-input::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}
