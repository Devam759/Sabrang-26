'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { Html5Qrcode } from 'html5-qrcode';
import { Check, X, User, AlertCircle, Mail, Phone, Loader2, Search, Users, CheckCheck, Crown, Clock, ArrowRight, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_EVENTS, getEventById } from '@/lib/eventPricing';
import { extractRegistrationInfo, extractAllTeamMembers, isTeamEventRegistration, isStaffRegistration, TeamMemberEntry } from '@/lib/registrationDataHelper';

function formatEntryTime(val: any): string {
  if (!val) return '';
  try {
    let d: Date;
    if (typeof val === 'object' && val !== null && typeof val.seconds === 'number') {
      d = new Date(val.seconds * 1000);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  } catch {
    return '';
  }
}

function playAudioTone(freq: number, type: OscillatorType, duration: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playSuccessChime() {
  playAudioTone(880, 'sine', 0.12);
  setTimeout(() => playAudioTone(1174.66, 'sine', 0.22), 110);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([70, 30, 70]); } catch {}
  }
}

function playErrorBeep() {
  playAudioTone(320, 'sawtooth', 0.25);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([180]); } catch {}
  }
}

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
  const [processingAction, setProcessingAction] = useState<string | boolean>(false);
  const [approvingMemberId, setApprovingMemberId] = useState<string | null>(null);
  const [approvingMemberAction, setApprovingMemberAction] = useState<'checkin' | 'checkout' | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedScanEvent, setSelectedScanEvent] = useState<string>('all');

  // Manual ticket lookup states
  const [manualQuery, setManualQuery] = useState('');
  const [searchingManual, setSearchingManual] = useState(false);
  const [manualError, setManualError] = useState('');

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = manualQuery.trim();
    if (!q) return;

    setSearchingManual(true);
    setManualError('');

    try {
      // 1. Direct Document ID lookup
      const regDoc = await getDoc(doc(db, 'registrations', q));
      if (regDoc.exists()) {
        await runSafeCameraTransition(stopCameraInternal);
        setScannedData({ ...regDoc.data(), id: regDoc.id });
        playSuccessChime();
        setSearchingManual(false);
        return;
      }

      // 2. Query by rollNumber / application no
      const rollQuery = query(collection(db, 'registrations'), where('rollNumber', '==', q));
      const rollSnap = await getDocs(rollQuery);
      if (!rollSnap.empty) {
        const found = rollSnap.docs[0];
        await runSafeCameraTransition(stopCameraInternal);
        setScannedData({ ...found.data(), id: found.id });
        playSuccessChime();
        setSearchingManual(false);
        return;
      }

      // 3. Query by phone
      const phoneQuery = query(collection(db, 'registrations'), where('phone', '==', q));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        const found = phoneSnap.docs[0];
        await runSafeCameraTransition(stopCameraInternal);
        setScannedData({ ...found.data(), id: found.id });
        playSuccessChime();
        setSearchingManual(false);
        return;
      }

      // 4. Query by email
      const emailQuery = query(collection(db, 'registrations'), where('email', '==', q.toLowerCase()));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const found = emailSnap.docs[0];
        await runSafeCameraTransition(stopCameraInternal);
        setScannedData({ ...found.data(), id: found.id });
        playSuccessChime();
        setSearchingManual(false);
        return;
      }

      playErrorBeep();
      setManualError('No registration found matching ticket ID, application no, or phone.');
    } catch (err: any) {
      console.error('Manual search error:', err);
      playErrorBeep();
      setManualError('Search error: ' + (err?.message || 'Failed to search'));
    } finally {
      setSearchingManual(false);
    }
  };

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
      
      // Calculate responsive qrbox size based on actual container width
      const qrBoxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        return {
          width: Math.floor(minEdge * 0.72),
          height: Math.floor(minEdge * 0.72),
        };
      };

      await scanner.start(
        targetDevice,
        { 
          fps: 12, 
          qrbox: qrBoxSize,
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: targetDevice === selectedCameraId ? undefined : "environment",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
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
      let regDoc = await getDoc(doc(db, 'registrations', regID));

      // Fallback: check query by ticketId, orderId, or rollNumber if not direct doc ID
      if (!regDoc.exists()) {
        const qById = query(collection(db, 'registrations'), where('ticketId', '==', regID), limit(1));
        const snap = await getDocs(qById);
        if (!snap.empty) {
          regDoc = snap.docs[0];
        } else {
          const qByOrder = query(collection(db, 'registrations'), where('orderId', '==', regID), limit(1));
          const snapOrder = await getDocs(qByOrder);
          if (!snapOrder.empty) {
            regDoc = snapOrder.docs[0];
          } else {
            const qByRoll = query(collection(db, 'registrations'), where('rollNumber', '==', regID), limit(1));
            const snapRoll = await getDocs(qByRoll);
            if (!snapRoll.empty) {
              regDoc = snapRoll.docs[0];
            }
          }
        }
      }

      if (!regDoc.exists()) {
        playErrorBeep();
        setStatus({ type: 'error', message: 'INVALID QR CODE' });
        setTimeout(() => {
          setStatus({ type: 'idle', message: '' });
          // Restart camera because registration was invalid
          runSafeCameraTransition(startCameraInternal);
        }, 2000);
      } else {
        playSuccessChime();
        const data = regDoc.data();
        setScannedData({ ...data, id: regDoc.id });
      }
    } catch (error) {
      console.error("Scan fetch error:", error);
      playErrorBeep();
      setStatus({ type: 'error', message: 'FETCH ERROR' });
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
        // Restart camera on fetch error
        runSafeCameraTransition(startCameraInternal);
      }, 2000);
    }
  }

  // ----------------------------------------------------
  // DEDICATED CHECK IN HANDLER (Solo or Team Member)
  // ----------------------------------------------------
  const handleCheckIn = async (member?: TeamMemberEntry) => {
    if (processingAction || approvingMemberId || !scannedData) return;
    
    if (member) {
      setApprovingMemberId(member.id);
      setApprovingMemberAction('checkin');
    } else {
      setProcessingAction('checkin');
    }

    try {
      await auth.authStateReady();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
      if (!idToken) {
        playErrorBeep();
        setStatus({ type: 'error', message: 'SESSION EXPIRED. PLEASE RELOGIN.' });
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
          action: member ? 'CHECK_IN_MEMBER' : 'CHECK_IN',
          memberId: member?.id,
          memberName: member?.name,
          eventId: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
          eventTitle: selectedScanEvent === 'all' 
            ? undefined 
            : (OFFICIAL_EVENTS.find(e => e.id === selectedScanEvent)?.title || (selectedScanEvent === 'visitor' ? 'Visitor Pass' : selectedScanEvent)),
          scannerId: 'ADMIN',
          volunteerName: adminEmail
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        playSuccessChime();
        const nowIso = new Date().toISOString();
        if (member) {
          setScannedData((prev: any) => {
            if (!prev) return null;
            const newEnteredMembers = result.enteredMembers || {
              ...(prev.enteredMembers || {}),
              [member.id]: {
                entered: true,
                name: member.name,
                role: member.role,
                enteredAt: nowIso,
                enteredBy: adminEmail,
              }
            };
            const count = result.enteredCount ?? Object.values(newEnteredMembers).filter((m: any) => m && m.entered).length;
            return {
              ...prev,
              enteredMembers: newEnteredMembers,
              enteredCount: count,
              hasEntered: true,
              attended: true,
              allEntered: result.allEntered ?? false,
            };
          });
          setStatus({ 
            type: 'success', 
            message: result.message || `CHECKED IN • ${member.name}` 
          });
        } else {
          setScannedData((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              enteredMembers: result.enteredMembers || prev.enteredMembers,
              enteredCount: result.enteredCount ?? prev.enteredCount,
              hasEntered: true,
              attended: true,
              allEntered: result.allEntered ?? true,
              enteredAt: nowIso,
              enteredBy: adminEmail,
              checkedOut: false,
            };
          });
          setStatus({ 
            type: 'success', 
            message: result.message || `CHECKED IN • ${result.attendee?.name || scannedData.name}` 
          });
        }
      } else {
        playErrorBeep();
        setStatus({ 
          type: 'error', 
          message: result.error || result.code || `FAILED TO CHECK IN ${member?.name || scannedData.name}` 
        });
      }
    } catch (err: any) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'SCANNER NETWORK ERROR' });
    } finally {
      setApprovingMemberId(null);
      setApprovingMemberAction(null);
      setProcessingAction(false);
    }
  };

  // ----------------------------------------------------
  // DEDICATED CHECK OUT HANDLER (Solo or Team Member)
  // ----------------------------------------------------
  const handleCheckOut = async (member?: TeamMemberEntry) => {
    if (processingAction || approvingMemberId || !scannedData) return;

    if (member) {
      setApprovingMemberId(member.id);
      setApprovingMemberAction('checkout');
    } else {
      setProcessingAction('checkout');
    }

    try {
      await auth.authStateReady();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
      if (!idToken) {
        playErrorBeep();
        setStatus({ type: 'error', message: 'SESSION EXPIRED. PLEASE RELOGIN.' });
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
          action: member ? 'CHECK_OUT_MEMBER' : 'CHECK_OUT',
          memberId: member?.id,
          memberName: member?.name,
          scannerId: 'ADMIN',
          volunteerName: adminEmail
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        playSuccessChime();
        const nowIso = new Date().toISOString();
        if (member) {
          setScannedData((prev: any) => {
            if (!prev) return null;
            const newEnteredMembers = result.enteredMembers || {
              ...(prev.enteredMembers || {}),
              [member.id]: {
                ...(prev.enteredMembers?.[member.id] || {}),
                entered: false,
                checkedOutAt: nowIso,
                checkedOutBy: adminEmail,
              }
            };
            const count = result.enteredCount ?? Object.values(newEnteredMembers).filter((m: any) => m && m.entered).length;
            return {
              ...prev,
              enteredMembers: newEnteredMembers,
              enteredCount: count,
              hasEntered: count > 0,
              allEntered: false,
            };
          });
          setStatus({ 
            type: 'success', 
            message: result.message || `CHECKED OUT • ${member.name}` 
          });
        } else {
          setScannedData((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              enteredMembers: result.enteredMembers || prev.enteredMembers,
              enteredCount: 0,
              hasEntered: false,
              allEntered: false,
              checkedOut: true,
              checkedOutAt: nowIso,
              checkedOutBy: adminEmail,
            };
          });
          setStatus({ 
            type: 'success', 
            message: result.message || `CHECKED OUT • ${result.attendee?.name || scannedData.name}` 
          });
        }
      } else {
        playErrorBeep();
        setStatus({ 
          type: 'error', 
          message: result.error || result.code || `FAILED TO CHECK OUT ${member?.name || scannedData.name}` 
        });
      }
    } catch (err: any) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'SCANNER NETWORK ERROR' });
    } finally {
      setApprovingMemberId(null);
      setApprovingMemberAction(null);
      setProcessingAction(false);
    }
  };

  const handleUndoMember = async (member: TeamMemberEntry) => {
    if (approvingMemberId || processingAction || !scannedData) return;
    setApprovingMemberId(member.id);

    try {
      await auth.authStateReady();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
      if (!idToken) {
        setApprovingMemberId(null);
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
          action: 'UNDO_MEMBER',
          memberId: member.id,
          memberName: member.name,
          scannerId: 'ADMIN',
          volunteerName: adminEmail
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setScannedData((prev: any) => {
          if (!prev) return null;
          const newEnteredMembers = result.enteredMembers || { ...(prev.enteredMembers || {}) };
          if (!result.enteredMembers) delete newEnteredMembers[member.id];
          const count = result.enteredCount ?? Object.values(newEnteredMembers).filter((m: any) => m && m.entered).length;
          return {
            ...prev,
            enteredMembers: newEnteredMembers,
            enteredCount: count,
            hasEntered: count > 0,
            attended: count > 0,
            allEntered: false,
          };
        });

        setStatus({ type: 'idle', message: `Entry status reset for ${member.name}` });
      } else {
        playErrorBeep();
        setStatus({ type: 'error', message: result.error || 'FAILED TO UNDO ENTRY' });
      }
    } catch (err) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'FAILED TO UNDO ENTRY' });
    } finally {
      setApprovingMemberId(null);
    }
  };

  const handleCheckInAll = async () => {
    if (processingAction || !scannedData) return;
    setProcessingAction('checkin_all');

    try {
      await auth.authStateReady();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
      if (!idToken) {
        playErrorBeep();
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
          action: 'CHECK_IN_ALL',
          eventId: selectedScanEvent === 'all' ? undefined : selectedScanEvent,
          eventTitle: selectedScanEvent === 'all' 
            ? undefined 
            : (OFFICIAL_EVENTS.find(e => e.id === selectedScanEvent)?.title || (selectedScanEvent === 'visitor' ? 'Visitor Pass' : selectedScanEvent)),
          scannerId: 'ADMIN',
          volunteerName: adminEmail
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        playSuccessChime();
        setScannedData((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            enteredMembers: result.enteredMembers || prev.enteredMembers,
            enteredCount: result.enteredCount ?? prev.enteredCount,
            hasEntered: true,
            attended: true,
            allEntered: true,
            checkedOut: false,
          };
        });
        setStatus({ 
          type: 'success', 
          message: 'ALL TEAM MEMBERS CHECKED IN' 
        });
      } else {
        playErrorBeep();
        setStatus({ 
          type: 'error', 
          message: result.error || result.code || 'FAILED TO CHECK IN ALL' 
        });
      }
    } catch (e) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'ACTION FAILED' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCheckOutAll = async () => {
    if (processingAction || !scannedData) return;
    setProcessingAction('checkout_all');

    try {
      await auth.authStateReady();
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : '';
      if (!idToken) {
        playErrorBeep();
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
          action: 'CHECK_OUT_ALL',
          scannerId: 'ADMIN',
          volunteerName: adminEmail
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        playSuccessChime();
        const nowIso = new Date().toISOString();
        setScannedData((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            enteredMembers: result.enteredMembers || prev.enteredMembers,
            enteredCount: 0,
            hasEntered: false,
            allEntered: false,
            checkedOut: true,
            checkedOutAt: nowIso,
          };
        });
        setStatus({ 
          type: 'success', 
          message: 'ALL TEAM MEMBERS CHECKED OUT' 
        });
      } else {
        playErrorBeep();
        setStatus({ 
          type: 'error', 
          message: result.error || result.code || 'FAILED TO CHECK OUT ALL' 
        });
      }
    } catch (e) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'ACTION FAILED' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDecline = async () => {
    if (processingAction || !scannedData) return;
    setProcessingAction('decline');

    try {
      playErrorBeep();
      await addDoc(collection(db, 'scanLogs'), {
        scannerId: 'ADMIN',
        volunteerName: adminEmail,
        registrationID: scannedData.id,
        attendeeName: scannedData.name,
        eventTitle: selectedScanEvent === 'all' 
          ? 'All Events' 
          : (OFFICIAL_EVENTS.find(e => e.id === selectedScanEvent)?.title || (selectedScanEvent === 'visitor' ? 'Visitor Pass' : selectedScanEvent)),
        timestamp: serverTimestamp(),
        result: 'declined',
        action: 'DECLINE'
      });

      try {
        const { logAdminAction } = await import('../../../lib/audit');
        await logAdminAction('SCANNER_DECLINE_ADMIN', `registrations/${scannedData.id}`, `Declined entry for attendee ${scannedData.name} via admin scanner console`, adminEmail);
      } catch (err) {
        console.error("Failed to log admin scanner decline:", err);
      }

      setStatus({ type: 'idle', message: 'ENTRY DECLINED' });
      setTimeout(() => {
        setScannedData(null);
        setStatus({ type: 'idle', message: '' });
        setProcessingAction(false);
      }, 1500);
    } catch (e) {
      playErrorBeep();
      setStatus({ type: 'error', message: 'FAILED TO DECLINE' });
      setProcessingAction(false);
    }
  };

  // Legacy wrappers for backwards compatibility
  const handleApproveMember = (member: TeamMemberEntry) => handleCheckIn(member);
  const handleApproveAll = () => handleCheckInAll();
  const handleAction = async (approved: boolean) => {
    if (approved) {
      await handleCheckIn();
    } else {
      await handleDecline();
    }
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
    <div className="flex flex-col items-center justify-start min-h-0 w-full font-adminBody animate-in fade-in duration-200 text-slate-900 pb-16">
      
      {/* Centered Work Container */}
      <div className={`w-full ${scannedData ? 'max-w-2xl' : 'max-w-lg lg:max-w-4xl'} mx-auto`}>
        
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

        {/* Normal Scanning View (Camera + Event Filter + Manual Lookup) */}
        {!scannedData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Viewfinder Card */}
            <div className="lg:col-span-7 w-full order-1 lg:order-1">
              <div className="bg-white backdrop-blur-[40px] border border-slate-200 p-6 rounded-[32px] shadow-xs flex flex-col items-center gap-5 justify-center w-full">
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
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>

                {/* Camera Selection Dropdown */}
                {cameraActive && cameras.length > 1 && (
                  <div className="w-full max-w-sm flex flex-col gap-2">
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
                          <option key={camera.id} value={camera.id}>
                            {camera.label || `Camera ${camera.id.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Event Selector & Manual Ticket Lookup */}
            <div className="lg:col-span-5 w-full order-2 lg:order-2 space-y-4">
              {/* Event Selector for Event-Specific Entry Scanning */}
              <div className="w-full bg-white backdrop-blur-[40px] border border-slate-200 p-5 rounded-[24px] shadow-xs">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Scanning for Event
                </label>
                <select
                  value={selectedScanEvent}
                  onChange={(e) => setSelectedScanEvent(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
                >
                  <option value="all">All Events (Global Fest Entry)</option>
                  {OFFICIAL_EVENTS.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.subtitle})
                    </option>
                  ))}
                  <option value="visitor">Visitor Pass (General Fest Entry)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Tickets for other events will be rejected with "Wrong Event" when a specific event is selected.
                </p>
              </div>

              {/* Manual Lookup Card (When camera is unavailable or QR is unscannable) */}
              <div className="w-full bg-white backdrop-blur-[40px] border border-slate-200 p-5 rounded-[24px] shadow-xs">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Manual Ticket Lookup
                </label>
                <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => {
                        setManualQuery(e.target.value);
                        if (manualError) setManualError('');
                      }}
                      placeholder="Ticket ID, App No, Phone..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:border-purple-500/50 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchingManual || !manualQuery.trim()}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
                  >
                    {searchingManual ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Find Ticket</span>
                  </button>
                </form>
                {manualError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-2.5 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{manualError}</span>
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Dossier Verification Card (Visible when ticket is scanned) */}
        {scannedData && (() => {
          const regInfo = extractRegistrationInfo(scannedData);
          const allMembers = extractAllTeamMembers(scannedData);
          const isStaff = isStaffRegistration(scannedData);
          const isTeam = isTeamEventRegistration(scannedData) || allMembers.length > 1;
          const enteredMembers = scannedData.enteredMembers || {};
          const enteredCount = Object.values(enteredMembers).filter((m: any) => m && (m.entered === true || m.entered === 'true')).length;
          const totalMembersCount = Math.max(allMembers.length, isStaff ? 4 : 1);
          const isAllEntered = isTeam 
            ? (scannedData.allEntered === true || (enteredCount >= totalMembersCount && totalMembersCount > 0))
            : (scannedData.hasEntered || scannedData.attended);
          const isPartialEntered = isTeam && enteredCount > 0 && !isAllEntered;
          const unapprovedCount = isTeam ? Math.max(0, totalMembersCount - enteredCount) : (scannedData.hasEntered ? 0 : 1);

          return (
            <div className="w-full bg-white backdrop-blur-[40px] border border-slate-200 p-6 sm:p-8 flex flex-col animate-in zoom-in-95 duration-300 rounded-[32px] shadow-2xl my-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              {/* Header with simple title & Status badge */}
              <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-200 relative z-10">
                <div>
                  <h2 className="text-xl font-light text-slate-900 font-space-grotesk tracking-wide">Verify Ticket</h2>
                  <p className="text-slate-500 font-mono text-xs mt-1">
                    ID: {scannedData.id}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {isTeam ? (
                    isAllEntered ? (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {isStaff ? 'All 4 Inside' : 'All Inside'}
                      </div>
                    ) : isPartialEntered ? (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Partial ({enteredCount}/{totalMembersCount} Inside)
                      </div>
                    ) : (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {isStaff ? 'Ready for Entry (Admit 4)' : 'Ready for Entry'}
                      </div>
                    )
                  ) : (
                    scannedData.hasEntered ? (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Inside (Checked In)
                      </div>
                    ) : (scannedData.checkedOut || scannedData.checkedOutAt) ? (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Outside (Checked Out)
                      </div>
                    ) : (
                      <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        Ready for Check-In
                      </div>
                    )
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
              <div className="space-y-4 mb-6 relative z-10">
                <div className="bg-white/80 p-5 border border-slate-100 rounded-2xl flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block mb-1">
                      {isStaff ? 'Faculty / Staff Pass Holder' : (isTeam ? 'Team Leader / Primary Contact' : 'Attendee Name')}
                    </span>
                    <span className="text-2xl font-light text-slate-900 leading-tight block font-space-grotesk">{regInfo.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">Application Number</span>
                      <span className="text-xs font-semibold text-slate-800 block font-mono">{regInfo.rollNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">Mobile</span>
                      <span className="text-xs font-semibold text-slate-800 block">{regInfo.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">Event Name</span>
                      <span className="text-xs font-semibold text-slate-800 block">{getScannedEventName(scannedData)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">Event Type</span>
                      <span className="text-xs font-semibold text-slate-800 block">{isStaff ? 'Faculty / Staff Pass (Admit 4)' : regInfo.eventType}</span>
                    </div>
                  </div>

                  {isStaff ? (
                    <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">Pass Category</span>
                        <span className="text-xs font-semibold text-indigo-700 block">Faculty / Staff Pass (Admit 4)</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">Persons Admitted</span>
                        <span className="text-xs font-semibold text-emerald-700 block">4 Persons (Pass Holder + 3 Guests)</span>
                      </div>
                    </div>
                  ) : isTeam ? (
                    <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">Team Name</span>
                        <span className="text-xs font-semibold text-slate-800 block">{regInfo.teamName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">Total Members</span>
                        <span className="text-xs font-semibold text-slate-800 block">{totalMembersCount}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Deleted User Detail Alert */}
                {(scannedData.isDeleted || scannedData.status === 'deleted') && (
                  <div className="bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-rose-800 text-xs">CRITICAL: REGISTRATION CANCELLED / DELETED</p>
                      <p className="text-xs text-rose-700/90 mt-1">
                        This registration was deleted/refunded. Pass is invalid and entry is prohibited.
                      </p>
                    </div>
                  </div>
                )}

                {/* Currently Inside Detail Banner */}
                {scannedData.hasEntered && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl flex gap-3 items-start">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed flex-1">
                      <p className="font-bold text-emerald-800 text-xs">
                        {isTeam ? 'Team Members Currently Inside' : 'Attendee Currently Inside (Checked In)'}
                      </p>
                      <p className="text-xs text-emerald-700/90 mt-1 font-mono">
                        {isTeam 
                          ? `${enteredCount} of ${totalMembersCount} members are currently inside the venue.` 
                          : `Checked in at: ${formatEntryTime(scannedData.enteredAt || scannedData.attendedAt) || 'Earlier'}`}
                      </p>
                      {scannedData.enteredBy && (
                        <p className="text-[11px] text-emerald-600/80 font-mono mt-0.5">Scanned by: {scannedData.enteredBy}</p>
                      )}
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Tap <strong>Check Out</strong> below when leaving the venue.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checked Out Notice (If currently outside after previously checking out) */}
                {!scannedData.hasEntered && (scannedData.checkedOut || scannedData.checkedOutAt) && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
                    <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed flex-1">
                      <p className="font-bold text-amber-800 text-xs">
                        Attendee Currently Outside (Checked Out)
                      </p>
                      <p className="text-xs text-amber-700/90 mt-1 font-mono">
                        Checked out at: {formatEntryTime(scannedData.checkedOutAt) || 'Earlier'}
                      </p>
                      {scannedData.checkedOutBy && (
                        <p className="text-[11px] text-amber-600/80 font-mono mt-0.5">Checked out by: {scannedData.checkedOutBy}</p>
                      )}
                      <p className="text-[11px] text-amber-700 mt-1 font-semibold">
                        Tap <strong>Re-Check In</strong> below to record entry.
                      </p>
                    </div>
                  </div>
                )}

                {/* Partial Check-In Notice for Teams */}
                {isPartialEntered && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed flex-1">
                      <p className="font-semibold text-amber-800 text-xs">
                        Partial Team Entry ({enteredCount} of {totalMembersCount} Members Inside)
                      </p>
                      <p className="text-xs text-amber-700/90 mt-1">
                        Some members are inside. You can check in or check out members individually below.
                      </p>
                    </div>
                  </div>
                )}

                  {/* TEAM MEMBERS / PASS ENTRIES SEPARATE CHECK-IN / CHECK-OUT SECTION */}
                  {isTeam && allMembers.length > 0 && (
                    <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 mt-2">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Users size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              {isStaff ? 'Pass Entries (Admit 4 Persons)' : 'Team Members Movement'}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {isStaff 
                                ? 'Check in or check out faculty/staff and accompanying guests' 
                                : 'Check in or check out each team member individually'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          isAllEntered 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isPartialEntered 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {enteredCount} / {totalMembersCount} Inside
                        </span>
                      </div>

                    <div className="space-y-2.5">
                      {allMembers.map((member, idx) => {
                        const isMemberEntered = member.entered === true || enteredMembers[member.id]?.entered === true;
                        const memberEnteredAt = member.enteredAt || enteredMembers[member.id]?.enteredAt;
                        const memberLeftAt = member.checkedOutAt || enteredMembers[member.id]?.checkedOutAt;
                        const isMemberProcessing = approvingMemberId === member.id;

                        return (
                          <div
                            key={member.id || idx}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                              isMemberEntered
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            {/* Member Details */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                member.isLeader 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {member.isLeader ? <Crown size={14} className="text-amber-600" /> : (idx + 1)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {member.name}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                    member.isLeader
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {member.role || (member.isLeader ? 'Leader' : `Member ${idx + 1}`)}
                                  </span>
                                </div>

                                {(member.phone || member.email) && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                                    {member.phone && <span>{member.phone}</span>}
                                    {member.phone && member.email && <span>•</span>}
                                    {member.email && <span className="truncate">{member.email}</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* SEPARATE CHECK IN & CHECK OUT BUTTONS FOR EACH TEAM MEMBER */}
                            <div className="shrink-0 flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              {isMemberEntered ? (
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs">
                                    <Check size={12} className="text-emerald-700 stroke-[3]" />
                                    <span>Inside</span>
                                    {memberEnteredAt && (
                                      <span className="text-[10px] text-emerald-700/80 font-mono ml-0.5">
                                        {formatEntryTime(memberEnteredAt)}
                                      </span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={Boolean(approvingMemberId) || Boolean(processingAction)}
                                    onClick={() => handleCheckOut(member)}
                                    title="Check Out this member"
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-40"
                                  >
                                    {isMemberProcessing && approvingMemberAction === 'checkout' ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <LogOut size={12} />
                                    )}
                                    <span>Check Out</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(approvingMemberId) || Boolean(processingAction)}
                                    onClick={() => handleUndoMember(member)}
                                    title="Reset status"
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded text-[10px] transition-colors"
                                  >
                                    Undo
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {memberLeftAt && (
                                    <span className="text-[10px] text-amber-700 font-mono">
                                      Left {formatEntryTime(memberLeftAt)}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={Boolean(approvingMemberId) || Boolean(processingAction) || scannedData.isDeleted || scannedData.status === 'deleted'}
                                    onClick={() => handleCheckIn(member)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {isMemberProcessing && approvingMemberAction === 'checkin' ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <LogIn size={13} strokeWidth={2.5} />
                                    )}
                                    <span>{memberLeftAt ? 'Re-Check In' : 'Check In'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Batch Actions for Team: Check In Remaining & Check Out Inside */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {!isAllEntered && unapprovedCount > 0 && (
                        <button
                          type="button"
                          disabled={Boolean(processingAction) || Boolean(approvingMemberId)}
                          onClick={handleCheckInAll}
                          className="flex-1 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                        >
                          {processingAction === 'checkin_all' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <LogIn size={14} />
                          )}
                          <span>Check In All Remaining ({unapprovedCount})</span>
                        </button>
                      )}
                      {enteredCount > 0 && (
                        <button
                          type="button"
                          disabled={Boolean(processingAction) || Boolean(approvingMemberId)}
                          onClick={handleCheckOutAll}
                          className="flex-1 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                        >
                          {processingAction === 'checkout_all' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <LogOut size={14} />
                          )}
                          <span>Check Out All Inside ({enteredCount})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons (Decline / Done / Check In / Check Out) */}
              {isTeam ? (
                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-200 shrink-0 relative z-10">
                  <button 
                    disabled={Boolean(processingAction)}
                    onClick={handleDecline}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-semibold rounded-xl py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <X size={16} /> Decline Pass
                  </button>
                  <button 
                    onClick={dismissDossier}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Done / Next Ticket</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-5 border-t border-slate-200 shrink-0 relative z-10">
                  {/* SEPARATE CHECK IN AND CHECK OUT BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* CHECK IN BUTTON */}
                    <button 
                      type="button"
                      disabled={Boolean(processingAction) || scannedData.hasEntered || scannedData.isDeleted || scannedData.status === 'deleted'}
                      onClick={() => handleCheckIn()}
                      className={`py-3.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        scannedData.hasEntered
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-500/20'
                      }`}
                    >
                      {processingAction === 'checkin' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LogIn size={16} />
                      )}
                      <span>
                        {scannedData.hasEntered 
                          ? 'Already Inside' 
                          : (scannedData.checkedOut || scannedData.checkedOutAt ? 'Re-Check In' : 'Check In')}
                      </span>
                    </button>

                    {/* CHECK OUT BUTTON */}
                    <button 
                      type="button"
                      disabled={Boolean(processingAction) || !scannedData.hasEntered || scannedData.isDeleted || scannedData.status === 'deleted'}
                      onClick={() => handleCheckOut()}
                      className={`py-3.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        !scannedData.hasEntered
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-amber-600 hover:bg-amber-700 active:scale-98 text-white shadow-amber-500/20'
                      }`}
                    >
                      {processingAction === 'checkout' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      <span>Check Out</span>
                    </button>
                  </div>

                  {/* SECONDARY ROW: DECLINE PASS & DONE / NEXT TICKET */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button 
                      type="button"
                      disabled={Boolean(processingAction)}
                      onClick={handleDecline}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <X size={15} /> Decline
                    </button>
                    <button 
                      type="button"
                      onClick={dismissDossier}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl py-2.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Done / Next Ticket</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <style jsx global>{`
        #qr-reader { border: none !important; width: 100% !important; height: 100% !important; border-radius: 16px; overflow: hidden; }
        #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 16px; }
        #qr-reader.mirrored video { transform: scaleX(-1) !important; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
}
