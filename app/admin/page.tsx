'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Registration, Event } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const { role, loading } = useAuth();
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalCheckedIn: 0,
    eventBreakdown: [] as { title: string, count: number, status: string }[]
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [regSnap, eventSnap] = await Promise.all([
          getDocs(collection(db, 'registrations')),
          getDocs(collection(db, 'events'))
        ]);

        const registrations = regSnap.docs.map(doc => doc.data() as Registration);
        const events = eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

        const totalRegs = registrations.length;
        const totalChecked = registrations.filter(r => r.attended).length;

        const breakdown = events.map(event => {
          const eventRegs = registrations.filter(r => r.eventId === event.id);
          let status = 'Ready';
          if (eventRegs.length > 300) status = 'High Capacity';
          if (eventRegs.length > 500) status = 'Sold Out';
          
          return {
            title: event.title,
            count: eventRegs.length,
            status
          };
        }).sort((a, b) => b.count - a.count);

        setStats({
          totalRegistrations: totalRegs,
          totalCheckedIn: totalChecked,
          eventBreakdown: breakdown
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setDataLoading(false);
      }
    };

    if (role === 'admin' || role === 'scanner') {
      fetchStats();
    }
  }, [role]);

  if (loading) return <div className="text-center mt-20 font-bold text-outline animate-pulse">VERIFYING AUTH...</div>;

  const attendanceRatio = Math.round((stats.totalCheckedIn / (stats.totalRegistrations || 1)) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* Title Section */}
      <section className="flex flex-col gap-1">
        <h1 className="font-h1 text-h1 text-on-background">Administrative Control</h1>
        <p className="text-lg text-on-surface-variant font-medium">Real-time overview of festival activity and registrations.</p>
      </section>

      {/* Metric Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Registrations */}
        <div className="bg-surface-container-lowest p-6 rounded-xl card-shadow border border-outline-variant flex flex-col justify-between h-44 hover-scale transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">Total Registrations</p>
            <span className="text-primary font-bold text-xs">+12%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface leading-none">
                {dataLoading ? '...' : stats.totalRegistrations.toLocaleString()}
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 font-medium">Users</p>
            </div>
            <div className="w-24 h-12 bg-primary/5 flex items-end px-1 pb-1 gap-1">
              <div className="h-1/3 w-full bg-primary/20"></div>
              <div className="h-2/3 w-full bg-primary/20"></div>
              <div className="h-1/2 w-full bg-primary/20"></div>
              <div className="h-full w-full bg-primary"></div>
            </div>
          </div>
        </div>

        {/* Attendance Ratio */}
        <div className="bg-surface-container-lowest p-6 rounded-xl card-shadow border border-outline-variant flex flex-col justify-between h-44 hover-scale transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">Attendance Ratio</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-high" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-primary transition-all duration-1000" 
                  cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" 
                  strokeWidth="8"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * attendanceRatio / 100)}
                ></circle>
              </svg>
              <span className="absolute text-sm font-bold text-on-surface">{attendanceRatio}%</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">{attendanceRatio}%</h2>
              <p className="text-sm text-on-surface-variant mt-1 font-medium">Confirmed Entry</p>
            </div>
          </div>
        </div>

        {/* Live Events */}
        <div className="bg-surface-container-lowest p-6 rounded-xl card-shadow border border-outline-variant flex flex-col justify-between h-44 hover-scale transition-all">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">Live Events</p>
            <span className="flex h-2 w-2 bg-error rounded-full animate-pulse"></span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface leading-none">
                {dataLoading ? '...' : stats.eventBreakdown.length}
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 font-medium">In Progress</p>
            </div>
            <span className="text-primary-container font-bold text-xs uppercase tracking-wider bg-primary/5 px-2 py-1 rounded">Live Tracking</span>
          </div>
        </div>
      </section>

      {/* Lower Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Breakdown Table */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl card-shadow border border-outline-variant flex flex-col overflow-hidden">
          <div className="px-6 py-6 border-b border-surface-container flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface">Registration Breakdown</h3>
            <Link className="text-primary text-sm font-bold hover:underline" href="/admin/registrations">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">Event Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-secondary-container uppercase tracking-widest text-center">Regs</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-secondary-container uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {dataLoading ? (
                  [1,2,3,4].map(i => <tr key={i}><td colSpan={3} className="px-6 py-8 animate-pulse bg-surface-container-low/20"></td></tr>)
                ) : (
                  stats.eventBreakdown.slice(0, 5).map((event, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-6 text-sm font-bold text-on-surface">{event.title}</td>
                      <td className="px-6 py-6 text-sm text-on-surface-variant text-center font-bold">{event.count}</td>
                      <td className="px-6 py-6 text-right">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          event.status === 'Sold Out' ? 'bg-error-container text-on-error-container' :
                          event.status === 'High Capacity' ? 'bg-tertiary-fixed text-tertiary' :
                          'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar Actions */}
        <section className="flex flex-col gap-6">
          {/* Live QR Scanner Card */}
          <div className="relative overflow-hidden bg-inverse-surface rounded-xl p-6 card-shadow text-on-primary-container h-[26rem] flex flex-col justify-between group">
            <div className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110">
              <img 
                className="w-full h-full object-cover grayscale" 
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" 
                alt="Event background" 
              />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-1">Live QR Scanner</h3>
              <p className="text-sm text-primary-fixed-dim font-medium">Instant check-in for on-site participants.</p>
            </div>
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-center py-8 bg-white/5 border border-white/10 backdrop-blur-sm">
                <svg className="w-20 h-20 text-white opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <Link 
                href="/admin/check-in"
                className="w-full bg-primary py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 hover-scale shadow-lg shadow-primary/20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Launch Scanner
              </Link>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 gap-4">
            <Link href="/admin/events" className="bg-surface-container-highest p-4 rounded-lg hover:bg-primary hover:text-white transition-all group flex items-center justify-between hover-scale">
              <span className="font-bold text-sm px-2">Manage Events</span>
              <svg className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/admin/coupons" className="bg-surface-container-highest p-4 rounded-lg hover:bg-primary hover:text-white transition-all group flex items-center justify-between hover-scale">
              <span className="font-bold text-sm px-2">Coupons</span>
              <svg className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
