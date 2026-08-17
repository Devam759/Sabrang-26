"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Registration, Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import QRCode from "qrcode";

interface DashboardRegistration extends Registration {
  eventTitle?: string;
  eventDate?: any;
  qrDataUrl?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<DashboardRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;

      const q = query(
        collection(db, "registrations"),
        where("userId", "==", user.uid),
      );
      const regSnap = await getDocs(q);

      const regData = await Promise.all(
        regSnap.docs.map(async (regDoc) => {
          const data = regDoc.data() as Registration;
          const eventDoc = await getDoc(doc(db, "events", data.eventId));
          const eventData = eventDoc.data() as Event;

          // Generate QR Code data URL
          const qrDataUrl = await QRCode.toDataURL(data.qrCode);

          return {
            id: regDoc.id,
            ...data,
            eventTitle: eventData?.title || "Unknown Event",
            eventDate: eventData?.dateTime,
            qrDataUrl,
          };
        }),
      );

      setRegistrations(regData);
      setLoading(false);
    };

    if (!authLoading && user) {
      if (userData?.role === "admin" || userData?.role === "scanner") {
        router.push("/admin");
        return;
      }
      fetchRegistrations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, userData, router]);

  const handleUnregister = async (regId: string) => {
    if (confirm("Are you sure you want to unregister?")) {
      try {
        await deleteDoc(doc(db, "registrations", regId));
        setRegistrations(registrations.filter((r) => r.id !== regId));
      } catch (err) {
        console.error(err);
        alert("Error unregistering.");
      }
    }
  };

  if (authLoading || loading)
    return <div className="text-center mt-20">Loading dashboard...</div>;
  if (!user)
    return (
      <div className="text-center mt-20">
        Please login to view your dashboard.
      </div>
    );

  // Extract first name from user data (priority: Firestore name > Firebase displayName > email)
  const fullName = userData?.name || user.displayName || user.email || "User";
  const firstName = fullName.split(" ")[0].split("@")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white sm:text-slate-900">User Dashboard</h1>
          <p className="text-white/60 sm:text-slate-500 text-sm">Welcome back, {firstName}</p>
        </div>
      </header>

      <section>
        <h2 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 text-white sm:text-slate-900 tracking-tight uppercase">
          Your Registered Events
        </h2>
        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-neutral-900/90 sm:bg-white rounded-2xl shadow-md border border-white/10 sm:border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6"
              >
                <div className="flex-shrink-0 flex flex-col items-center justify-center p-3 border border-white/10 sm:border-slate-200 rounded-xl bg-neutral-950 sm:bg-slate-50">
                  {/* Plain img: qrDataUrl is a client-generated data: URI, which
                      the image optimizer cannot process — next/image would only
                      add a wrapper and an `unoptimized` escape hatch. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reg.qrDataUrl}
                    alt="QR Code"
                    className="w-28 h-28 sm:w-32 sm:h-32"
                  />
                  <div className="mt-2 text-center">
                    <span className="block text-[10px] text-white/50 sm:text-slate-400 font-mono uppercase tracking-widest leading-none">
                      Entry: {reg.qrCode}
                    </span>
                    <span className="block text-[11px] text-indigo-400 sm:text-indigo-600 font-bold mt-1 font-mono uppercase tracking-widest leading-none">
                      Referral: {reg.referralCode}
                    </span>
                  </div>
                </div>

                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white sm:text-slate-900 leading-tight">
                        {reg.eventTitle}
                      </h3>
                      {reg.attended ? (
                        <span className="bg-green-500/20 sm:bg-green-100 text-green-400 sm:text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                          Attended
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 sm:bg-amber-100 text-amber-400 sm:text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-white/50 sm:text-slate-500 mb-4">
                      {formatDate(reg.eventDate)}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-4 border-t border-white/10 sm:border-slate-100">
                    {!reg.attended && (
                      <button
                        onClick={() => handleUnregister(reg.id!)}
                        className="text-red-400 sm:text-red-500 text-xs font-semibold hover:underline min-h-[44px] flex items-center"
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
          <div className="bg-neutral-900/60 sm:bg-white border-2 border-dashed border-white/10 sm:border-slate-300 rounded-2xl p-8 sm:p-12 text-center text-white/50 sm:text-slate-500 italic text-sm">
            You haven't registered for any events yet.
          </div>
        )}
      </section>
    </div>
  );
}
