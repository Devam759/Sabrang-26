'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { SkeletonCard } from '../../components/admin/SkeletonLoader';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    todayRegistrations: 0,
    totalEntriesToday: 0,
    totalEntries: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    loading: true
  });

  useEffect(() => {
    // 1. Fetch server-side stats via Admin SDK API
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setStats({
            totalRegistrations: data.totalRegistrations || 0,
            todayRegistrations: data.todayRegistrations || 0,
            totalEntriesToday: data.totalEntriesToday || 0,
            totalEntries: data.totalEntries || 0,
            totalRevenue: data.totalRevenue || 0,
            todayRevenue: data.todayRevenue || 0,
            loading: false,
          });
        } else {
          setStats(s => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        setStats(s => ({ ...s, loading: false }));
      });

    // 2. Client-side Firestore listener for realtime sync attached when Auth is confirmed
    let unsubRegs = () => {};
    let unsubScans = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        unsubRegs = onSnapshot(
          collection(db, 'registrations'),
          (snap) => {
            const allRegs = snap.docs.map(d => d.data());
            const validRegs = allRegs.filter((reg: any) => reg.name && reg.name.trim() !== '' && reg.isTest !== true);
            
            let totalRev = 0;
            let todayRev = 0;
            let todayCount = 0;

            validRegs.forEach((reg: any) => {
              const amountNum = parseFloat(reg.receivedAmount || reg.paymentAmount || reg.amount || reg.price || '0') || 0;
              totalRev += amountNum;

              if (reg.registeredAt || reg.createdAt) {
                const regDate = reg.registeredAt?.toDate ? reg.registeredAt.toDate() : new Date(reg.registeredAt || reg.createdAt);
                if (regDate >= today) {
                  todayCount++;
                  todayRev += amountNum;
                }
              }
            });

            const checkedInCount = validRegs.filter((reg: any) => reg.hasEntered === true || reg.attended === true).length;

            setStats(s => ({
              ...s,
              totalRegistrations: validRegs.length,
              todayRegistrations: todayCount,
              totalEntries: checkedInCount,
              totalRevenue: totalRev,
              todayRevenue: todayRev,
              loading: false,
            }));
          },
          (err) => {
            console.warn("Realtime registrations listener warning:", err.message);
          }
        );

        unsubScans = onSnapshot(
          query(collection(db, 'scanLogs'), where('timestamp', '>=', today), where('result', '==', 'accepted')),
          (snap) => {
            setStats(s => ({ ...s, totalEntriesToday: snap.size }));
          },
          (err) => {
            console.warn("Realtime scan logs listener warning:", err.message);
          }
        );
      } catch (err) {
        console.warn("Firestore listeners error:", err);
      }
    });

    return () => {
      unsubAuth();
      unsubRegs();
      unsubScans();
    };
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-12 text-slate-900 font-body pb-12">
      {/* Formal Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Overview</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-2 font-semibold">Live Festival Metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/scanner"
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full hover:text-slate-900 text-xs font-bold transition-colors duration-300 cursor-pointer overflow-hidden shadow-md"
          >
            <div className="absolute inset-0 bg-slate-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10 tracking-widest uppercase">Scanner</span>
          </Link>
          <Link
            href="/admin/registrations"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-full text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            <span className="tracking-widest uppercase text-slate-700 group-hover:text-slate-900 transition-colors">Directory</span>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-slate-900 transition-colors" />
          </Link>
        </div>
      </div>

      {stats.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Revenue Bento (Wide) */}
          <div className="md:col-span-4 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[32px] p-8 md:p-10 flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-purple-500/20 transition-all duration-700 ease-out" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10">Total Collection</span>
            <div className="mt-8 relative z-10 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-light text-slate-500">₹</span>
              <span className="text-6xl md:text-8xl font-light tracking-tighter text-slate-900 font-space-grotesk">{stats.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Today's Revenue Bento (Square) */}
          <div className="md:col-span-2 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[32px] p-8 md:p-10 flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-50 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 group-hover:bg-green-500/20 transition-all duration-700 ease-out" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Today's Revenue</span>
              <span className="text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600 tracking-widest">{todayFormatted}</span>
            </div>
            <div className="mt-8 relative z-10 flex items-baseline gap-1">
              <span className="text-2xl font-light text-green-400/60">₹</span>
              <span className="text-5xl md:text-6xl font-light tracking-tighter text-slate-900 font-space-grotesk">{stats.todayRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Registrations Bento */}
          <div className="md:col-span-2 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[32px] p-8 md:p-10 flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Total Registrations</span>
            <div className="mt-8">
              <span className="text-5xl md:text-7xl font-light tracking-tighter text-slate-900 font-space-grotesk">{stats.totalRegistrations.toLocaleString('en-IN')}</span>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] text-slate-500 tracking-widest uppercase">+{stats.todayRegistrations} Today</span>
              </div>
            </div>
          </div>

          {/* Gate Entries Bento */}
          <div className="md:col-span-4 bg-white backdrop-blur-[40px] border border-slate-200 rounded-[32px] p-8 md:p-10 flex flex-col justify-between group transition-all duration-500 hover:bg-white/[0.07] overflow-hidden relative">
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[70px] -translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/20 transition-all duration-700 ease-out" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10">Festival Check-Ins</span>
            <div className="mt-8 relative z-10 flex items-end justify-between">
              <div>
                <span className="text-6xl md:text-8xl font-light tracking-tighter text-slate-900 font-space-grotesk">{stats.totalEntries.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="text-3xl md:text-5xl font-light tracking-tighter text-slate-700 font-space-grotesk">{stats.totalEntriesToday.toLocaleString('en-IN')}</span>
                <span className="block text-[10px] text-slate-500 tracking-widest uppercase mt-1">Entered Today</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
