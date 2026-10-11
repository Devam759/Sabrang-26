'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonCard } from '../../../components/admin/SkeletonLoader';
import { Search as SearchIcon, Users, Calendar, Bell, FileText } from 'lucide-react';
import Link from 'next/link';

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // Data state
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch all collections
  useEffect(() => {
    let unsubs: any[] = [];
    
    unsubs.push(onSnapshot(query(collection(db, 'registrations')), snap => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {}));
    unsubs.push(onSnapshot(query(collection(db, 'events')), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {}));
    unsubs.push(onSnapshot(query(collection(db, 'announcements')), snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {}));
    unsubs.push(onSnapshot(query(collection(db, 'auditLogs')), snap => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      setLoading(false);
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const results = useMemo(() => {
    if (!debouncedTerm) return { regs: [], evts: [], anns: [], logs: [] };

    const regs = registrations.filter(r => 
      (r.name && r.name.toLowerCase().includes(debouncedTerm)) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(debouncedTerm)) ||
      (r.email && r.email.toLowerCase().includes(debouncedTerm))
    );

    const evts = events.filter(e => 
      (e.title && e.title.toLowerCase().includes(debouncedTerm)) ||
      (e.venue && e.venue.toLowerCase().includes(debouncedTerm))
    );

    const anns = announcements.filter(a => 
      (a.title && a.title.toLowerCase().includes(debouncedTerm))
    );

    const logs = auditLogs.filter(l => 
      (l.action && l.action.toLowerCase().includes(debouncedTerm)) ||
      (l.details && l.details.toLowerCase().includes(debouncedTerm))
    ).slice(0, 10); // Limit logs since they can be huge

    return { regs, evts, anns, logs };
  }, [debouncedTerm, registrations, events, announcements, auditLogs]);

  const hasResults = results.regs.length > 0 || results.evts.length > 0 || results.anns.length > 0 || results.logs.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-adminHeading text-3xl font-bold mb-2">Global Search</h1>
        <p className="text-admin-muted">Search across all records</p>
      </div>

      <div className="relative mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted" size={24} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, event title, or action..."
          className="w-full bg-admin-surface border-2 border-admin-border rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:border-admin-accent transition-colors shadow-lg"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        debouncedTerm.length > 0 && (
          <div className="space-y-8">
            {!hasResults && (
              <div className="text-center py-12 bg-admin-surface rounded-xl border border-admin-border text-admin-muted">
                <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>No results found for &quot;{searchTerm}&quot;</p>
              </div>
            )}

            {results.regs.length > 0 && (
              <section className="bg-admin-surface border border-admin-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-admin-border pb-2">
                  <Users className="text-admin-accent" /> Registrations
                </h2>
                <div className="space-y-3">
                  {results.regs.map(r => (
                    <div key={r.id} className="bg-admin-bg p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900">{r.name} <span className="text-xs text-admin-muted bg-white px-2 py-0.5 rounded ml-2">{r.rollNumber}</span></p>
                        <p className="text-xs text-admin-muted mt-1">{r.email} &middot; {r.branch} {r.year}</p>
                      </div>
                      <Link href="/admin/registrations" className="text-xs text-admin-accent hover:underline">View</Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.evts.length > 0 && (
              <section className="bg-admin-surface border border-admin-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-admin-border pb-2">
                  <Calendar className="text-admin-accent" /> Events
                </h2>
                <div className="space-y-3">
                  {results.evts.map(e => (
                    <div key={e.id} className="bg-admin-bg p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900">{e.title}</p>
                        <p className="text-xs text-admin-muted mt-1">{e.venue}</p>
                      </div>
                      <Link href="/admin/events" className="text-xs text-admin-accent hover:underline">View</Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.anns.length > 0 && (
              <section className="bg-admin-surface border border-admin-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-admin-border pb-2">
                  <Bell className="text-admin-accent" /> Announcements
                </h2>
                <div className="space-y-3">
                  {results.anns.map(a => (
                    <div key={a.id} className="bg-admin-bg p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900">{a.title}</p>
                        <p className="text-xs text-admin-muted mt-1">{a.postedAt ? a.postedAt.toDate().toLocaleString() : ''}</p>
                      </div>
                      <Link href="/admin/announcements" className="text-xs text-admin-accent hover:underline">View</Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.logs.length > 0 && (
              <section className="bg-admin-surface border border-admin-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-admin-border pb-2">
                  <FileText className="text-admin-accent" /> Audit Logs
                </h2>
                <div className="space-y-3">
                  {results.logs.map(l => (
                    <div key={l.id} className="bg-admin-bg p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900">{l.action}</p>
                        <p className="text-xs text-admin-muted mt-1">{l.details}</p>
                      </div>
                      <Link href="/admin/audit" className="text-xs text-admin-accent hover:underline">View</Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
}
