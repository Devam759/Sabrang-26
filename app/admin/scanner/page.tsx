'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { Check, X, User, AlertCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { getEventById } from '@/lib/eventPricing';
import { extractRegistrationInfo } from '@/lib/registrationDataHelper';

function getScannedEventName(data: any): string {
  if (!data) return 'N/A';

  if (Array.isArray(data.selectedEvents) && data.selectedEvents.length > 0) {
    const names = data.selectedEvents
      .map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string') {
          const ev = getEventById(item);
          return ev?.title || item;
        }
        if (typeof item === 'object') {
          return item.title || item.name || item.id || '';
        }
        return String(item);
      })
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(', ');
    }
  }

  if (data.eventName && typeof data.eventName === 'string' && data.eventName.trim()) {
    return data.eventName.trim();
  }
  if (data.eventTitle && typeof data.eventTitle === 'string' && data.eventTitle.trim()) {
    return data.eventTitle.trim();
  }

  if (Array.isArray(data.events) && data.events.length > 0) {
    const names = data.events
      .map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string') {
          const ev = getEventById(item);
          return ev?.title || item;
        }
        if (typeof item === 'object') {
          return item.title || item.name || item.id || '';
        }
        return String(item);
      })
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(', ');
    }
  }

  if (typeof data.selectedEvents === 'string' && data.selectedEvents.trim()) {
    const ev = getEventById(data.selectedEvents.trim());
    return ev?.title || data.selectedEvents.trim();
  }

  if (data.eventId && typeof data.eventId === 'string' && data.eventId.trim()) {
    const ev = getEventById(data.eventId.trim());
    return ev?.title || data.eventId.trim();
  }
  if (data.event && typeof data.event === 'string' && data.event.trim()) {
    const ev = getEventById(data.event.trim());
    return ev?.title || data.event.trim();
  }

  if (data.visitorConfig) {
    return 'Visitor Pass';
  }

  return 'General Fest Entry';
}

export default function AdminScannerView() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // States for scanner console
  const [scannedData, setScannedData] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [cameraError, setCameraError] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedScanEvent, setSelectedScanEvent] = useState<string>('all');
  const [availableEvents, setAvailableEvents] = useState<string[]>([
    'PANACHE - RAMPWALK',
    'BANDJAM - BATTLE OF BANDS',
    'STEP UP - SOLO DANCE',
    'SYNC - GROUP DANCE',
    'ECHOES OF NOOR - SUFI NIGHT',
    'VERSEVAAD - SLAM POETRY',
    'VALORANT SHOWDOWN',
    'GENERAL FEST ENTRY'
  ]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(true);
  const transitionLock = useRef<Promise<any>>(Promise.resolve());

  // 1. Session Guard and Role Authorization Check
  useEffect(() => {
    // Check session fallback first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sabrang_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'admin' || parsed.role === 'scanner') {
            setAdminEmail(parsed.email || 'Admin');
            setAuthorized(true);
            setLoadingSession(false);
            // Don't return here! We still need onAuthStateChanged to populate auth.currentUser
          }
        } catch {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (typeof window !== 'undefined' && sessionStorage.getItem('sabrang_auth')) {
          setAuthorized(true);
          setLoadingSession(false);
          return;
        }
        router.push('/login');
        return;
      }

      setAdminEmail(user.email || 'Admin');
      setAuthorized(true);
      setLoadingSession(false);
    });

    return () => unsubscribe();
  }, [router]);

  function runSafeCameraTransition(action: () => Promise<void>) {
    transitionLock.current = transitionLock.current
      .then(action)
      .catch((err) => console.error("Camera transition error:", err));
    return transitionLock.current;
  }

  const forceReleaseCameraHardware = () => {
    try {
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach((track) => {
            track.stop();
            console.log("Forced hardware track release:", track.label);
          });
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.error("Error forced releasing camera hardware:", err);
    }
  };

  function detectCameraFacing() {
    const videoElement = document.querySelector("#qr-reader video") as HTMLVideoElement;
    if (!videoElement) return;

    const performDetection = () => {
      if (videoElement.srcObject) {
        try {
          const stream = videoElement.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            const label = videoTrack.label?.toLowerCase() || "";
            
            const isFront = 
              settings.facingMode === "user" || 
              label.includes("front") || 
              label.includes("user") || 
              label.includes("selfie") || 
              label.includes("facetime");
            
            setIsFrontCamera(isFront);
            console.log(`Camera detected - Label: "${videoTrack.label}", Front-facing: ${isFront}`);
          }
        } catch (err) {
          console.error("Error detecting camera facing mode:", err);
        }
      }
    };

    performDetection();
    videoElement.addEventListener("loadedmetadata", performDetection, { once: true });
  }

  async function startCameraInternal(deviceIdOverride?: string) {
    if (!authorized || scannedData || !cameraActive) return;

    if (scannerRef.current?.isScanning) {
      return;
    }

    // Force release any existing camera hardware locks before starting a new one
    forceReleaseCameraHardware();

    const element = document.getElementById("qr-reader");
    if (!element) return;
    element.innerHTML = ""; // Clear duplicate/stray elements

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      const targetDevice = deviceIdOverride || selectedCameraId || { facingMode: "environment" };
      
      await scanner.start(
        targetDevice,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      
      isScanning.current = true;
      setCameraError(false);
      detectCameraFacing();
      await fetchCameras(deviceIdOverride || selectedCameraId);
    } catch (e) {
      console.error("Failed to start camera:", e);
      setCameraError(true);
    }
  }

  async function stopCameraInternal() {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.error("Failed to stop camera via html5-qrcode:", e);
      }
      scannerRef.current = null;
    }
    
    // Explicitly release all media stream tracks to guarantee the camera indicator light turns off
    forceReleaseCameraHardware();
    
    isScanning.current = false;
    setIsFrontCamera(false);
  }

  async function fetchCameras(activeDeviceId?: string) {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        if (activeDeviceId) {
          setSelectedCameraId(activeDeviceId);
        } else {
          const videoElement = document.querySelector("#qr-reader video") as HTMLVideoElement;
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack?.getSettings();
            if (settings && settings.deviceId) {
              setSelectedCameraId(settings.deviceId);
              return;
            }
          }
          setSelectedCameraId(devices[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching cameras:", err);
    }
  }

  // 2. Global Interceptors to prevent uncaught AbortErrors from crashing Next.js dev overlay
  useEffect(() => {
    if (!authorized) return;

    // Override HTMLVideoElement.prototype.play to cleanly swallow play() AbortErrors at the source
    const originalPlay = HTMLVideoElement.prototype.play;
    
    HTMLVideoElement.prototype.play = function (...args) {
      const promise = originalPlay.apply(this, args);
      if (promise && typeof promise.catch === 'function') {
        return promise.catch((err: any) => {
          if (err && err.name === 'AbortError') {
            console.warn('Muted browser play() AbortError inside HTMLVideoElement:', err);
            return;
          }
          throw err;
        });
      }
      return promise;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason && 
        (event.reason.name === 'AbortError' || 
         event.reason.message?.includes('play() request was interrupted') ||
         event.reason.message?.includes('The play() request was interrupted'))
      ) {
        event.preventDefault();
        console.warn('Prevented unhandled play() AbortError:', event.reason);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error &&
        (event.error.name === 'AbortError' ||
         event.error.message?.includes('play() request was interrupted') ||
         event.error.message?.includes('The play() request was interrupted'))
      ) {
        event.preventDefault();
        console.warn('Prevented global AbortError:', event.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      // Restore original play method on unmount
      HTMLVideoElement.prototype.play = originalPlay;
      runSafeCameraTransition(stopCameraInternal);
    };
  }, [authorized]);

  // 3. Camera Trigger Effect when account/active-state/scannedData changes
  useEffect(() => {
    if (authorized && cameraActive && !scannedData) {
      runSafeCameraTransition(startCameraInternal);
    } else {
      runSafeCameraTransition(stopCameraInternal);
    }
  }, [authorized, cameraActive, scannedData]);

  async function onScanSuccess(decodedText: string) {
    if (!isScanning.current) return;
    isScanning.current = false;

    // Stop camera cleanly BEFORE updating the state to avoid interrupting .play()
    await runSafeCameraTransition(stopCameraInternal);

    try {
      const regID = decodedText.trim();
      const regDoc = await getDoc(doc(db, 'registrations', regID));

      if (!regDoc.exists()) {
        setStatus({ type: 'error', message: 'INVALID QR CODE' });
        setTimeout(() => {
          setStatus({ type: 'idle', message: '' });
          // Restart camera because registration was invalid
          runSafeCameraTransition(startCameraInternal);
        }, 2000);
      } else {
        const data = regDoc.data();
        setScannedData({ ...data, id: regID });
      }
    } catch (error) {
      console.error("Scan fetch error:", error);
      setStatus({ type: 'error', message: 'FETCH ERROR' });
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
        // Restart camera on fetch error
        runSafeCameraTransition(startCameraInternal);
      }, 2000);
    }
  }

  const handleAction = async (approved: boolean) => {
    if (processingAction || !scannedData) return;
    setProcessingAction(true);

    try {
      if (approved) {
        await auth.authStateReady(); // Ensure Firebase Auth is loaded
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
        if (!idToken) {
          setStatus({ type: 'error', message: 'SESSION EXPIRED. PLEASE RELOGIN.' });
          setProcessingAction(false);
          return;
        }
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            registrationID: scannedData.id,
            eventId: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
            eventTitle: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
            scannerId: 'ADMIN',
            volunteerName: adminEmail
          })
        });

        const result = await res.json();
        if (res.ok && result.success) {
          setStatus({ 
            type: 'success', 
            message: `ENTRY SUCCESSFUL • ${result.attendee?.name || scannedData.name}` 
          });
        } else {
          setStatus({ 
            type: 'error', 
            message: result.error || result.code || 'ENTRY VALIDATION FAILED' 
          });
        }
      } else {
        await addDoc(collection(db, 'scanLogs'), {
          scannerId: 'ADMIN',
          volunteerName: adminEmail,
          registrationID: scannedData.id,
          attendeeName: scannedData.name,
          eventTitle: selectedScanEvent,
          timestamp: serverTimestamp(),
          result: 'declined'
        });

        try {
          const { logAdminAction } = await import('../../../lib/audit');
          await logAdminAction('SCANNER_DECLINE_ADMIN', `registrations/${scannedData.id}`, `Declined entry for attendee ${scannedData.name} via admin scanner console`, adminEmail);
        } catch (err) {
          console.error("Failed to log admin scanner decline:", err);
        }

        setStatus({ type: 'idle', message: 'ENTRY DECLINED' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'ACTION FAILED' });
    }

    setTimeout(() => {
      setScannedData(null);
      setStatus({ type: 'idle', message: '' });
      setProcessingAction(false);
    }, 2000);
  };

  const toggleCamera = () => {
    setCameraActive(prev => !prev);
  };

  const dismissDossier = () => {
    setScannedData(null);
    setStatus({ type: 'idle', message: '' });
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedCameraId(deviceId);
    
    runSafeCameraTransition(async () => {
      await stopCameraInternal();
      await startCameraInternal(deviceId);
    });
  };

  if (loadingSession) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-ink mx-auto" size={48} />
          <p className="text-admin-muted text-xs font-bold uppercase tracking-widest font-adminBody">
            Verifying Admin Scanner Access...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] font-adminBody animate-in fade-in duration-200 text-slate-900">
      
      {/* Centered Work Container */}
      <div className="w-full max-w-lg">
        
        {/* Status Banners */}
        {status.message && (
          <div className={`w-full p-4 mb-4 border rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs ${
            status.type === 'success' ? 'bg-green-50 text-green-400 border-green-500/20' :
            status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white text-slate-900 border-slate-200'
          }`}>
            {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span className="font-semibold text-xs leading-none">{status.message}</span>
          </div>
        )}

        {/* Event Selector for Event-Specific Entry Scanning */}
        <div className="w-full bg-white backdrop-blur-[40px] border border-slate-200 p-5 rounded-[24px] shadow-xs mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
            Scanning For Event
          </label>
          <select
            value={selectedScanEvent}
            onChange={(e) => setSelectedScanEvent(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 font-bold text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
          >
            <option value="all" className="bg-[#1a1525]">All Events (Global Fest Entry)</option>
            {availableEvents.map((evt) => (
              <option key={evt} value={evt} className="bg-[#1a1525]">{evt}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-3 font-medium">
            Tickets for other events will be rejected with "WRONG EVENT" when a specific event is selected.
          </p>
        </div>

        {/* Viewfinder Card */}
        <div className={`bg-white backdrop-blur-[40px] border border-slate-200 p-6 rounded-[32px] shadow-xs flex-col items-center gap-6 justify-center w-full ${scannedData ? 'hidden' : 'flex'}`}>
          {/* QR Scanner view box wrapper */}
          <div className="w-full max-w-sm aspect-square bg-white/90 border border-slate-200 overflow-hidden relative rounded-2xl shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Camera Viewfinder DOM element */}
            <div 
              id="qr-reader" 
              className={`w-full h-full bg-transparent relative z-10 ${isFrontCamera ? 'mirrored' : ''}`}
            ></div>

            {/* Stopped Camera Placeholder overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/40 backdrop-blur-md z-20">
                <div className="p-4 bg-white text-slate-500 rounded-2xl border border-slate-200 shadow-xs mb-4">
                  <AlertCircle className="text-slate-600" size={28} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-space-grotesk tracking-wide">Camera Inactive</h3>
                <p className="text-xs text-slate-500 mt-1">Tap start to begin scanning tickets.</p>
              </div>
            )}
          </div>

          {/* Toggle Camera Button */}
          <button 
            onClick={toggleCamera}
            className={`w-full max-w-sm font-semibold text-xs rounded-xl py-3.5 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
              cameraActive 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                : 'bg-white hover:bg-white/90 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            {cameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>

          {/* Camera Selection Dropdown */}
          {cameraActive && cameras.length > 1 && (
            <div className="w-full max-w-sm flex flex-col gap-2 mt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Select Video Camera
              </label>
              <div className="relative w-full">
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="w-full bg-white text-slate-900 border border-slate-200 text-xs rounded-xl py-3 px-4 focus:outline-none cursor-pointer appearance-none"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id} className="bg-[#1a1525]">
                      {camera.label || `Camera ${camera.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Dossier Verification Card (Visible when ticket is scanned) */}
        {scannedData && (
          <div className="w-full bg-white backdrop-blur-[40px] border border-slate-200 p-8 flex flex-col animate-in zoom-in-95 duration-300 rounded-[32px] shadow-2xl my-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            {/* Header with simple title & Status badge */}
            <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-200 relative z-10">
              <div>
                <h2 className="text-xl font-light text-slate-900 font-space-grotesk tracking-wide">Verify Ticket</h2>
                <p className="text-slate-500 font-mono text-[10px] mt-1 tracking-widest">
                  ID: {scannedData.id}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {scannedData.hasEntered && (
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    Already Inside
                  </div>
                )}
                
                {/* Dismiss Cross Button */}
                <button
                  onClick={dismissDossier}
                  className="p-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-100"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Main details */}
            <div className="space-y-4 mb-8 relative z-10">
              {(() => {
                const regInfo = extractRegistrationInfo(scannedData);
                return (
                  <div className="bg-white/80 p-5 border border-slate-100 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Attendee Name</span>
                      <span className="text-2xl font-light text-slate-900 leading-tight block font-space-grotesk">{regInfo.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Application Number</span>
                        <span className="text-xs font-semibold text-slate-800 block font-mono">{regInfo.rollNumber}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Mobile</span>
                        <span className="text-xs font-semibold text-slate-800 block">{regInfo.phone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Event Name</span>
                        <span className="text-xs font-semibold text-slate-800 block">{getScannedEventName(scannedData)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Event Type</span>
                        <span className="text-xs font-semibold text-slate-800 block">{regInfo.eventType}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">Team Name</span>
                        <span className="text-xs font-semibold text-slate-800 block">{regInfo.teamName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">No. of Teammates</span>
                        <span className="text-xs font-semibold text-slate-800 block">{regInfo.noOfTeammates}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Already Checked In Detail Alert */}
              {scannedData.hasEntered && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-red-400 uppercase tracking-wide text-[11px]">Warning: Already Entered</p>
                    <p className="text-[11px] text-red-400/80 mt-1.5 font-mono">
                      Checked in at: {scannedData.enteredAt ? new Date(scannedData.enteredAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                    </p>
                    {scannedData.enteredBy && (
                      <p className="text-[11px] text-red-400/80 font-mono mt-0.5">Operator: {scannedData.enteredBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons (Decline/Approve) */}
            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-200 shrink-0 relative z-10">
              <button 
                disabled={processingAction}
                onClick={() => handleAction(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold uppercase tracking-widest rounded-xl py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <X size={16} /> Decline
              </button>
              <button 
                disabled={processingAction || scannedData.hasEntered}
                onClick={() => handleAction(true)}
                className="bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-widest rounded-xl py-3.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Check size={16} /> Approve
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        #qr-reader { border: none !important; width: 100% !important; height: 100% !important; border-radius: 16px; overflow: hidden; }
        #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 16px; }
        #qr-reader.mirrored video { transform: scaleX(-1) !important; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
}
