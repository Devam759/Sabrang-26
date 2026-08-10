'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Registration, Event, User } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminRegistrations() {
  const { role, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchRegistrations();
    }
  }, [authLoading, role]);

  const fetchRegistrations = async () => {
    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const data = await Promise.all(querySnapshot.docs.map(async (regDoc) => {
      const reg = regDoc.data() as Registration;
      const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
      const userDoc = await getDoc(doc(db, 'users', reg.userId));
      
      let scannerName = '';
      if (reg.checkedInBy) {
        const scannerDoc = await getDoc(doc(db, 'users', reg.checkedInBy));
        scannerName = scannerDoc.data()?.name || 'Unknown Scanner';
      }
      
      return {
        id: regDoc.id,
        ...reg,
        eventTitle: eventDoc.data()?.title || 'Unknown',
        userName: userDoc.data()?.name || 'Unknown',
        userEmail: userDoc.data()?.email || 'Unknown',
        scannerName,
      };
    }));
    
    setRegistrations(data);
    setLoading(false);
  };

  if (authLoading || loading) return <div>Loading registrations...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight uppercase">Registrations</h1>
      
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left font-medium">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Participant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Event</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">QR Code</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-slate-900 font-bold">{reg.userName}</div>
                  <div className="text-xs text-slate-500 font-normal">{reg.userEmail}</div>
                </td>
                <td className="px-6 py-4 text-slate-900 font-medium">{reg.eventTitle}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400 uppercase tracking-widest">
                  <div>Entry: {reg.qrCode}</div>
                  <div className="text-indigo-600 font-bold mt-0.5">Ref: {reg.referralCode}</div>
                </td>
                <td className="px-6 py-4">
                  {reg.attended ? (
                    <div className="flex flex-col">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase mb-1">Attended</span>
                      <span className="text-[10px] text-slate-400 font-medium">By: {reg.scannerName}</span>
                    </div>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(reg.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
