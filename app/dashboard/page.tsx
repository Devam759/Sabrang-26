'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Registration, Event } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import QRCode from 'qrcode';

interface DashboardRegistration extends Registration {
  eventTitle?: string;
  eventDate?: any;
  qrDataUrl?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<DashboardRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;

      const q = query(collection(db, 'registrations'), where('userId', '==', user.uid));
      const regSnap = await getDocs(q);
      
      const regData = await Promise.all(regSnap.docs.map(async (regDoc) => {
        const data = regDoc.data() as Registration;
        const eventDoc = await getDoc(doc(db, 'events', data.eventId));
        const eventData = eventDoc.data() as Event;
        
        // Generate QR Code data URL
        const qrDataUrl = await QRCode.toDataURL(data.qrCode);
        
        return {
          id: regDoc.id,
          ...data,
          eventTitle: eventData?.title || 'Unknown Event',
          eventDate: eventData?.dateTime,
          qrDataUrl,
        };
      }));

      setRegistrations(regData);
      setLoading(false);
    };

    if (!authLoading && user) {
      if (userData?.role === 'admin' || userData?.role === 'scanner') {
        router.push('/admin');
        return;
      }
      fetchRegistrations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, userData, router]);

  const handleUnregister = async (regId: string) => {
    if (confirm('Are you sure you want to unregister?')) {
      try {
        await deleteDoc(doc(db, 'registrations', regId));
        setRegistrations(registrations.filter(r => r.id !== regId));
      } catch (err) {
        console.error(err);
        alert('Error unregistering.');
      }
    }
  };

  if (authLoading || loading) return <div className="text-center mt-20">Loading dashboard...</div>;
  if (!user) return <div className="text-center mt-20">Please login to view your dashboard.</div>;

  // Extract first name from user data (priority: Firestore name > Firebase displayName > email)
  const fullName = userData?.name || user.displayName || user.email || 'User';
  const firstName = fullName.split(' ')[0].split('@')[0];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Dashboard</h1>
          <p className="text-slate-500">Welcome back, {firstName}</p>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-black mb-6 text-slate-900 tracking-tight uppercase">Your Registered Events</h2>
        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div key={reg.id} className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center justify-center p-2 border rounded-xl bg-slate-50">
                  <img src={reg.qrDataUrl} alt="QR Code" className="w-32 h-32" />
                  <div className="mt-2 text-center">
                    <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none">Entry: {reg.qrCode}</span>
                    <span className="block text-[11px] text-indigo-600 font-bold mt-1 font-mono uppercase tracking-widest leading-none">Referral: {reg.referralCode}</span>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{reg.eventTitle}</h3>
                    {reg.attended ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Attended
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mb-6">
                    {formatDate(reg.eventDate)}
                  </div>
                  
                  <div className="mt-auto pt-4 flex gap-4">
                    {!reg.attended && (
                      <button 
                        onClick={() => handleUnregister(reg.id!)}
                        className="text-red-500 text-xs font-semibold hover:underline"
                      >
                        Unregister
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed rounded-2xl p-12 text-center text-slate-500 italic">
            You haven't registered for any events yet.
          </div>
        )}
      </section>
    </div>
  );
}
