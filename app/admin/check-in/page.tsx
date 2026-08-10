'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase/client';

export default function QRCheckIn() {
  const { user, role, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      };
    }
  }, [authLoading, role]);

  async function onScanSuccess(decodedText: string) {
    if (processing) return;
    markAttendance(decodedText);
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  const markAttendance = async (code: string) => {
    setProcessing(true);
    setStatus({ type: 'info', message: `Processing QR: ${code}...` });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ qrCode: code }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Attendance marked for ${result.userName} in ${result.eventTitle}!` 
        });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to mark attendance.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setProcessing(false);
      setManualCode('');
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!user || role !== 'admin') return <div className="text-center mt-20">Unauthorized</div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-8">QR Attendance Check-in</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-8">
        <div id="reader" className="overflow-hidden rounded-xl border-4 border-slate-50"></div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500 font-medium">OR ENTER MANUALLY</span>
          </div>
        </div>

        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="Enter Unique QR String"
            className="flex-grow p-3 border rounded-xl font-mono uppercase tracking-widest text-sm"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          />
          <button 
            disabled={processing || !manualCode}
            onClick={() => markAttendance(manualCode)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            Mark
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl text-sm font-medium animate-pulse ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 
            status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status.message}
          </div>
        )}
      </div>

      <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-dashed text-slate-500 text-xs leading-relaxed">
        <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-slate-400">Scanner Instructions</h3>
        <ul className="list-disc ml-4 space-y-1">
          <li>Ensure the QR code is clearly visible and well-lit.</li>
          <li>The system will automatically recognize the code and mark attendance.</li>
          <li>For manual entry, copy the unique string below the QR code in user dashboard.</li>
          <li>Attendance can only be marked once per registration.</li>
        </ul>
      </div>
    </div>
  );
}
