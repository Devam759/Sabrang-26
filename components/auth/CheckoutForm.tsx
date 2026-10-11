"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, limit, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, ChevronRight, ArrowLeft, Upload, AlertTriangle, Loader2, CheckCircle2, XCircle, ShieldCheck, Download, ExternalLink, RefreshCw, Users, Sparkles, Plus, Minus, Calendar } from "lucide-react";
import {
  OFFICIAL_EVENTS,
  getEventById,
  calculateEventItemPrice,
  calculateTotalRegistrationFee,
  getGroupTeamRequirements,
  SabrangEvent,
  VAAD_VIVAAD_REPRESENTATIVES,
  FESTIVAL_DAYS,
  VisitorPassConfig,
  calculateVisitorPassFee,
} from "@/lib/eventPricing";

type StepId = "select" | "forms" | "review";

const STEPS: { id: StepId; name: string }[] = [
  { id: "select", name: "Select Events" },
  { id: "forms", name: "Your Details" },
  { id: "review", name: "Review & Pay" },
];

const EVENTS = OFFICIAL_EVENTS;

type TeamMember = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  gender: string;
  age: string;
  institutionName: string;
  address: string;
  idCard: string | null; idCardName?: string;
};

export default function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState<StepId>("select");
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Dynamic form state. Keys are like "generic_name", "bgmi_email", etc.
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Dynamic team members state. Key is the group (e.g., 'bgmi', 'generic', 'visitor')
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});

  // Visitor Pass Multi-Day and Multi-Person state
  const [visitorDays, setVisitorDays] = useState<string[]>(["day1"]);
  const [visitorCount, setVisitorCount] = useState<number>(1);
  
  // ID Cards
  const [idCards, setIdCards] = useState<Record<string, { url: string, name: string } | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleIdCardUpload = async (
    key: string,
    file: File | null,
    onSuccess: (url: string, fileName: string) => void,
    onClear: () => void
  ) => {
    if (!file) {
      onClear();
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Only image formats (PNG, JPG, JPEG, WEBP) are accepted for ID card verification.");
      onClear();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ID card image size exceeds the 5MB limit. Please upload a smaller image.");
      onClear();
      return;
    }

    setUploadProgress((prev) => ({ ...prev, [key]: 10 }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for UI UX
      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[key] || 10;
          if (current >= 90) return prev;
          return { ...prev, [key]: current + Math.floor(Math.random() * 10) };
        });
      }, 300);

      const response = await fetch('/api/upload-id', {
        method: 'POST',
        body: formData,
      });

      clearInterval(timer);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
      
      setTimeout(() => {
        onSuccess(data.url, file.name);
      }, 300);
      
    } catch (e) {
      console.error("Upload failed", e);
      alert("Failed to upload image. Please try again.");
      onClear();
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<{
    valid: boolean;
    finalPrice: number;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [copiedOffer, setCopiedOffer] = useState(false);
  const [cartLoadedFromUrl, setCartLoadedFromUrl] = useState(false);
  const [isEarlyBirdActive, setIsEarlyBirdActive] = useState(false);
  const [specialOffer, setSpecialOffer] = useState<{
    code: string;
    desc: string;
  } | null>(null);

  useEffect(() => {
    const unsubEarlyBird = onSnapshot(
      doc(db, "settings", "earlyBird"),
      (snap) => {
        if (snap.exists()) {
          setIsEarlyBirdActive(snap.data()?.active === true);
        } else {
          setIsEarlyBirdActive(false);
        }
      },
      (err) => {
        console.warn("earlyBird listener error:", err?.message);
      }
    );
    return () => unsubEarlyBird();
  }, []);

  useEffect(() => {
    async function fetchSpecialOffer() {
      try {
        const q = query(
          collection(db, "coupons"), 
          where("active", "==", true), 
          where("isSpecialOffer", "==", true),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setSpecialOffer({
            code: doc.id,
            desc: data.specialOfferDesc || "Get an exclusive discount on all event registrations - Limited time only!",
          });
        } else {
          setSpecialOffer(null);
        }
      } catch (err) {
        console.error("Failed to fetch special offer:", err);
      }
    }
    fetchSpecialOffer();
  }, []);

  // Cashfree Payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verifiedOrder, setVerifiedOrder] = useState<{ orderId: string; registrationId: string; email?: string } | null>(null);

  const verifyOrderPayment = useCallback(async (orderId: string) => {
    setVerificationStatus("verifying");
    setPaymentError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_PAYMENT",
          orderId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationStatus("success");
        setVerifiedOrder({
          orderId,
          registrationId: data.id,
          email: data.email,
        });
      } else {
        setVerificationStatus("error");
        setPaymentError(data.error || "Payment verification failed or was cancelled.");
      }
    } catch (err: any) {
      setVerificationStatus("error");
      setPaymentError(err.message || "Failed to verify payment with server.");
    }
  }, []);

  // Listen for order_id or pre-selected events in URL search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (orderId) {
      verifyOrderPayment(orderId);
      return;
    }
    const eventParam = params.get("event") || params.get("events") || params.get("cart");
    if (eventParam) {
      const ids = eventParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const validIds = ids.filter((id) => EVENTS.some((e) => e.id.toLowerCase() === id));
      if (validIds.length > 0) {
        setSelectedEvents((prev) => Array.from(new Set([...prev, ...validIds])));
        setCartLoadedFromUrl(true);
      }
    }
  }, [verifyOrderPayment]);

  const handleCashfreePayment = async () => {
    if (isProcessingPayment) return;
    setPaymentError(null);

    if (selectedEvents.length === 0) {
      setPaymentError("Please select at least one event or pass.");
      return;
    }

    if (isNextDisabled()) {
      setPaymentError("Please complete all required fields across your selected event categories.");
      setCurrentStep("forms");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const activeGroups = getActiveGroups();
      const primaryGroup = activeGroups[0] || "visitor";

      const name = getField(primaryGroup, "name");
      const email = getField(primaryGroup, "email");
      const mobile = getField(primaryGroup, "mobileNumber");
      const gender = getField(primaryGroup, "gender");
      const institutionName = getField(primaryGroup, "institutionName");
      const address = getField(primaryGroup, "address");

      const regNum = getField(primaryGroup, "registrationNumber") || getField(primaryGroup, "rollNumber") || `REG_${Date.now()}`;

      const payload = {
        action: "CREATE_ORDER",
        idCard: Object.values(idCards).find(v => v !== null)?.url || null,
        ...formData,
        name,
        email,
        mobile,
        phone: mobile,
        gender,
        institutionName,
        address,
        registrationNumber: regNum,
        rollNumber: regNum,
        coupon: promoApplied ? promoCode.trim().toUpperCase() : "",
        selectedEvents,
        teamMembers,
        amount: calculateTotal(),
        visitorConfig: selectedEvents.includes("visitor")
          ? { count: visitorCount, days: visitorDays }
          : undefined,
        vaadVivaadRepresentative: selectedEvents.includes("vaad_vivaad")
          ? getField("generic", "vaadVivaadRepresentative").trim()
          : undefined,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fall through to error handler below
      }

      if (!res.ok || !data || data.error) {
        throw new Error(data?.error || `Server error (${res.status}). Please try again.`);
      }

      // If mock mode (e.g. Free pass / 100% coupon discount)
      if (data.is_mock) {
        await verifyOrderPayment(data.order_id);
        setIsProcessingPayment(false);
        return;
      }

      if (!data.payment_session_id) {
        throw new Error("Cashfree session ID missing from order creation response.");
      }

      // Load Cashfree JS SDK v3 dynamically
      const loadCashfreeSdk = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).Cashfree) {
            resolve((window as any).Cashfree);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.async = true;
          script.onload = () => resolve((window as any).Cashfree);
          script.onerror = () => reject(new Error("Unable to load Cashfree Payment SDK. Please check your network connection."));
          document.body.appendChild(script);
        });
      };

      const CashfreeSDK = await loadCashfreeSdk();
      const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION";
      const cashfree = CashfreeSDK({
        mode: isProduction ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_blank",
      });
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(err.message || "An unexpected error occurred while initiating payment.");
      setIsProcessingPayment(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (currentStep === "review") {
      handleCashfreePayment();
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      if (currentStep === "select") {
        const activeGroups = getActiveGroups();
        const nextTeam = { ...teamMembers };
        let modified = false;
        activeGroups.forEach(group => {
          if (group === "visitor") return;
          const req = getGroupTeamRequirements(group, selectedEvents, { count: visitorCount, days: visitorDays });
          const currentMembers = nextTeam[group] || [];
          const neededExtra = req.min - 1;
          if (currentMembers.length < neededExtra) {
            const toAdd = neededExtra - currentMembers.length;
            const newItems = Array.from({ length: toAdd }, () => ({
              id: Math.random().toString(36).substr(2, 9),
              name: "", email: "", mobileNumber: "", gender: "", age: "",
              institutionName: getField(group, 'institutionName') || getField("generic", "institutionName"),
              address: getField(group, 'address') || getField("generic", "address"),
              idCard: null,
            }));
            nextTeam[group] = [...currentMembers, ...newItems];
            modified = true;
          }
        });
        if (modified) setTeamMembers(nextTeam);
      }
      setCurrentStep(STEPS[stepIndex + 1].id);
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const rawTotal = calculateTotalRegistrationFee(selectedEvents, teamMembers, {
      count: visitorCount,
      days: visitorDays,
    }, isEarlyBirdActive);
    
    if (promoApplied && couponData?.valid) {
      return Math.max(0, couponData.finalPrice);
    }
    return rawTotal;
  };

  const handleApplyCoupon = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a coupon code");
      return;
    }
    setIsCheckingPromo(true);
    setPromoError(null);
    try {
      const activeGroups = getActiveGroups();
      const primaryGroup = activeGroups[0] || "visitor";
      const regNum = getField(primaryGroup, "registrationNumber") || getField(primaryGroup, "rollNumber") || "";

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_COUPON",
          coupon: code,
          selectedEvents,
          teamMembers,
          visitorConfig: selectedEvents.includes("visitor")
            ? { count: visitorCount, days: visitorDays }
            : undefined,
          registrationNumber: regNum,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fall through to error handling below
      }

      if (res.ok && data?.valid) {
        setCouponData(data);
        setPromoApplied(true);
        setPromoError(null);
      } else {
        setCouponData(null);
        setPromoApplied(false);
        setPromoError(data?.error || (res.ok ? "Invalid or expired coupon code" : `Server error (${res.status}). Please try again.`));
      }
    } catch (err: any) {
      setCouponData(null);
      setPromoApplied(false);
      setPromoError(err.message || "Failed to verify coupon code");
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemoveCoupon = () => {
    setPromoCode("");
    setPromoApplied(false);
    setCouponData(null);
    setPromoError(null);
  };

  const handleVisitorCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, newCount));
    setVisitorCount(count);

    // Sync teamMembers['visitor'] to hold exactly (count - 1) additional attendees
    setTeamMembers((prev) => {
      const currentList = prev["visitor"] || [];
      const neededExtra = count - 1;

      if (currentList.length === neededExtra) {
        return prev;
      }

      if (currentList.length < neededExtra) {
        const toAdd = neededExtra - currentList.length;
        const newItems: TeamMember[] = Array.from({ length: toAdd }, () => ({
          id: Math.random().toString(36).substr(2, 9),
          name: "",
          email: "",
          mobileNumber: "",
          gender: "",
          age: "",
          institutionName: getField("visitor", "institutionName") || getField("generic", "institutionName"),
          address: getField("visitor", "address") || getField("generic", "address"),
          idCard: null,
        }));
        return {
          ...prev,
          visitor: [...currentList, ...newItems],
        };
      } else {
        return {
          ...prev,
          visitor: currentList.slice(0, neededExtra),
        };
      }
    });
  };

  const toggleVisitorDay = (dayId: string) => {
    setVisitorDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length <= 1) return prev; // keep at least 1 day selected
        return prev.filter((d) => d !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const toggleAllVisitorDays = () => {
    if (visitorDays.length === FESTIVAL_DAYS.length) {
      setVisitorDays(["day1"]);
    } else {
      setVisitorDays(FESTIVAL_DAYS.map((d) => d.id));
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const updateField = (group: string, field: string, value: string) => {
    const finalValue = value;
    setFormData((prev) => {
      const newData = { ...prev, [`${group}_${field}`]: finalValue };
      
      // Auto-sync personal details across groups for better UX
      const personalFields = ['name', 'email', 'mobileNumber', 'gender', 'age', 'institutionName', 'address'];
      if (personalFields.includes(field)) {
        // Sync to all other active groups
        const activeGroups = getActiveGroups();
        activeGroups.forEach(g => {
          if (g !== group) {
            newData[`${g}_${field}`] = finalValue;
          }
        });
      }
      return newData;
    });
  };

  const getField = (group: string, field: string) => {
    return formData[`${group}_${field}`] || "";
  };

  const getActiveGroups = () => {
    const groups = new Set<string>();
    selectedEvents.forEach(id => {
      const ev = EVENTS.find(e => e.id === id);
      if (ev) {
        groups.add(ev.type); // "generic", "bgmi", "valorant", "freefire", "visitor"
      }
    });
    return Array.from(groups);
  };

  // Team Member Management
  const addTeamMember = (group: string) => {
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      mobileNumber: "",
      gender: "",
      age: "",
      institutionName: getField(group, 'institutionName'), // copy from leader by default
      address: getField(group, 'address'),
      idCard: null,
    };
    
    setTeamMembers(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), newMember]
    }));
  };

  const removeTeamMember = (group: string, memberId: string) => {
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).filter(m => m.id !== memberId)
    }));
  };

  const updateTeamMember = (group: string, memberId: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).map(m => m.id === memberId ? { ...m, [field]: value } : m)
    }));
  };

  const getTeamRequirements = (group: string) => {
    return getGroupTeamRequirements(group, selectedEvents, { count: visitorCount, days: visitorDays });
  };

  // Ensure all required fields are filled for active groups
  const isNextDisabled = () => {
    if (currentStep === "select") {
      return selectedEvents.length === 0;
    }
    if (currentStep === "forms") {
      const activeGroups = getActiveGroups();
      
      for (const group of activeGroups) {
        // Basic personal details
        const name = getField(group, 'name').trim();
        const email = getField(group, 'email').trim();
        const mobile = getField(group, 'mobileNumber').trim();
        const gender = getField(group, 'gender');
        const age = getField(group, 'age').trim();
        const inst = getField(group, 'institutionName').trim();
        const address = getField(group, 'address').trim();
        const idCard = idCards[group];
        
        // ALL groups (including visitor) now require all these details
        if (!name || !isValidEmail(email) || !isValidPhone(mobile) || !gender || !age || !inst || !idCard || !address) return true;

        // Specific fields
        if (group === 'bgmi') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderIgn').trim() || !getField(group, 'leaderUid').trim()) return true;
        }
        if (group === 'valorant') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderRiotId').trim()) return true;
        }
        if (group === 'freefire') {
          if (!getField(group, 'teamName').trim() || !getField(group, 'leaderUid').trim()) return true;
        }
        // Generic team fields
        if (group === 'generic') {
          const hasTeamEvents = selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === 'generic' && e?.isTeam);
          if (hasTeamEvents && !getField(group, 'teamName').trim()) return true;

          // Vaad Vivaad representative is mandatory if Vaad Vivaad is selected
          if (selectedEvents.includes('vaad_vivaad') && !getField('generic', 'vaadVivaadRepresentative').trim()) {
            return true;
          }
        }

        // Team members / Additional attendees validation
        const hasTeamEvents =
          selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === group && e?.isTeam) ||
          (group === 'visitor' && visitorCount > 1);

        if (hasTeamEvents) {
          const members = teamMembers[group] || [];
          const req = getTeamRequirements(group);
          const totalMembers = 1 + members.length; // leader + members
          
          if (totalMembers < req.min) return true;
          
          for (const m of members) {
            if (group === 'visitor') {
              if (!m.name.trim() || !isValidPhone(m.mobileNumber) || !m.gender || !m.age.trim() || !m.institutionName.trim() || !m.idCard || !m.address.trim()) {
                return true;
              }
            } else {
              if (!m.name.trim() || !isValidEmail(m.email) || !isValidPhone(m.mobileNumber) || !m.gender || !m.age.trim() || !m.institutionName.trim() || !m.idCard || !m.address.trim()) {
                return true;
              }
            }
          }
        }
      }
      
      return false; // All active groups are valid
    }
    return false;
  };

  const renderPersonalFields = (group: string, title: string, showTeamFields: boolean, specificFields?: React.ReactNode) => {
    const members = teamMembers[group] || [];
    const req = getTeamRequirements(group);
    const totalMembers = 1 + members.length;
    const needsMore = totalMembers < req.min;

    return (
      <div key={group} className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10 mt-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="hidden"></div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white text-white/90">
            {title}
          </h3>
        </div>
        
        {/* Specific Fields Rendered at top like in old site */}
        {specificFields && (
          <div className="space-y-4 mb-8">
            {specificFields}
          </div>
        )}
        
        {showTeamFields && !specificFields && group !== 'visitor' && (
          <div className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex justify-between">
                <span>Team / Squad Name <span className="text-violet-400">*</span></span>
              </label>
              <input
                type="text"
                value={getField(group, 'teamName')}
                onBlur={() => handleBlur(`${group}_teamName`)}
                onChange={(e) => updateField(group, 'teamName', e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                  touched[`${group}_teamName`] && !getField(group, 'teamName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                }`}
                placeholder="Enter Team Name"
              />
            </div>
          </div>
        )}

        {/* Vaad Vivaad Chosen Representative */}
        {group === 'generic' && selectedEvents.includes('vaad_vivaad') && (
          <div className="space-y-3 mb-8 p-4 rounded-xl bg-violet-950/20 border border-violet-500/30">
            <label className="text-sm text-white/80 text-violet-300 uppercase tracking-widest flex justify-between">
              <span>
                Vaad Vivaad - Chosen MP / Journalist <span className="text-violet-400">*</span>
              </span>
            </label>
            <p className="text-xs text-white/70 leading-relaxed">
              Select the Member of Parliament/Journalist of your choice whom you will be representing/referencing during the competition.
            </p>
            <select
              value={getField('generic', 'vaadVivaadRepresentative')}
              onBlur={() => handleBlur('generic_vaadVivaadRepresentative')}
              onChange={(e) => updateField('generic', 'vaadVivaadRepresentative', e.target.value)}
              className={`w-full bg-black/60 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${
                touched['generic_vaadVivaadRepresentative'] && !getField('generic', 'vaadVivaadRepresentative').trim()
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-white/10 focus:border-violet-500"
              }`}
            >
              <option value="" className="bg-[#020202]">-- Select MP / Journalist (1 to 40) --</option>
              {VAAD_VIVAAD_REPRESENTATIVES.map((name, idx) => (
                <option key={name} value={name} className="bg-[#020202]">
                  {idx + 1}. {name}
                </option>
              ))}
            </select>
            {touched['generic_vaadVivaadRepresentative'] && !getField('generic', 'vaadVivaadRepresentative').trim() && (
              <p className="text-xs text-red-400 font-sans">
                Please select an MP or Journalist from the list to continue.
              </p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Name" : group === 'visitor' ? "Primary Attendee Name" : "Name"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="text"
              value={getField(group, 'name')}
              onBlur={() => handleBlur(`${group}_name`)}
              onChange={(e) => updateField(group, 'name', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_name`] && !getField(group, 'name').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Email" : group === 'visitor' ? "Primary Attendee Email" : "Email"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="email"
              value={getField(group, 'email')}
              onBlur={() => handleBlur(`${group}_email`)}
              onChange={(e) => updateField(group, 'email', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_email`] && !isValidEmail(getField(group, 'email')) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Mobile Number" : group === 'visitor' ? "Primary Attendee Mobile" : "Mobile Number"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="tel"
              value={getField(group, 'mobileNumber')}
              onBlur={() => handleBlur(`${group}_mobileNumber`)}
              onChange={(e) => updateField(group, 'mobileNumber', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_mobileNumber`] && !isValidPhone(getField(group, 'mobileNumber')) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="10-digit number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Gender" : group === 'visitor' ? "Primary Attendee Gender" : "Gender"} <span className="text-violet-400">*</span></span>
            </label>
            <select
              value={getField(group, 'gender')}
              onBlur={() => handleBlur(`${group}_gender`)}
              onChange={(e) => updateField(group, 'gender', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white focus:outline-none transition-all appearance-none ${
                touched[`${group}_gender`] && !getField(group, 'gender') ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
            >
              <option value="" className="bg-[#020202]">Select Gender</option>
              <option value="male" className="bg-[#020202]">Male</option>
              <option value="female" className="bg-[#020202]">Female</option>
              <option value="other" className="bg-[#020202]">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Age" : group === 'visitor' ? "Primary Attendee Age" : "Age"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="number"
              value={getField(group, 'age')}
              onBlur={() => handleBlur(`${group}_age`)}
              onChange={(e) => updateField(group, 'age', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_age`] && !getField(group, 'age') ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="e.g., 20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Institution Name" : group === 'visitor' ? "Primary Attendee Institution" : "Institution Name"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              type="text"
              value={getField(group, 'institutionName')}
              onBlur={() => handleBlur(`${group}_institutionName`)}
              onChange={(e) => updateField(group, 'institutionName', e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_institutionName`] && !getField(group, 'institutionName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="Your school/college/university"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Identity Card" : group === 'visitor' ? "Primary Attendee Identity Card" : "Institution Identity Card"} <span className="text-violet-400">*</span></span>
            </label>
            <div className="relative">
              <input
                type="file"
                id={`file_${group}`}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleIdCardUpload(
                    group,
                    file,
                    (url, name) => setIdCards((prev) => ({ ...prev, [group]: { url, name } })),
                    () => {
                      e.target.value = "";
                      setIdCards((prev) => ({ ...prev, [group]: null }));
                    }
                  );
                }}
                className="hidden"
              />
              <label
                htmlFor={`file_${group}`}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
              >
                {typeof uploadProgress[group] === "number" && uploadProgress[group] < 100 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    <span className="text-white/80">Uploading... {uploadProgress[group]}%</span>
                  </>
                ) : idCards[group] ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="truncate max-w-[280px] text-white font-medium">{idCards[group]?.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose image</span>
                  </>
                )}

                {/* Line progress along bottom border */}
                {typeof uploadProgress[group] === "number" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                    <div
                      className={`h-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(168,85,247,0.8)] ${
                        uploadProgress[group] === 100
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400"
                      }`}
                      style={{ width: `${uploadProgress[group]}%` }}
                    />
                  </div>
                )}
              </label>
            </div>
            <p className="text-[10px] text-white/40 font-sans">Max size: 5MB (Images only: PNG, JPG, JPEG, WEBP)</p>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <label className="text-sm font-medium text-white/80 flex justify-between">
            <span>Address <span className="text-violet-400">*</span></span>
          </label>
          <textarea
            value={getField(group, 'address')}
            onBlur={() => handleBlur(`${group}_address`)}
            onChange={(e) => updateField(group, 'address', e.target.value)}
            rows={2}
            className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all resize-none ${
              touched[`${group}_address`] && !getField(group, 'address').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
            }`}
            placeholder="Enter your full address"
          />
        </div>

        {/* Dynamic Team Members / Additional Visitors Section */}
        {showTeamFields && (
          <div className="pt-8 mt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-[#22d3ee]">
                {group === 'visitor' ? 'Additional Visitors' : 'Team Members'}
              </h4>
              {group !== 'visitor' && totalMembers < req.max && (
                <button
                  type="button"
                  onClick={() => addTeamMember(group)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-sm transition-all"
                >
                  + Add Team Member
                </button>
              )}
            </div>
            
            <div className={`p-4 rounded-lg mb-6 border ${needsMore ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <p className="text-sm text-white/90">
                {group === 'visitor' ? (
                  <>
                    Passes booked: <strong>{visitorCount}</strong> attendee(s) • <strong>{visitorDays.length}</strong> day(s)<br/>
                    Booking Lead: Attendee #1. Please fill in details for the remaining {members.length} visitor(s) below.
                  </>
                ) : (
                  <>
                    Team size requirement: {req.min} - {req.max} members<br/>
                    Current: <strong className={needsMore ? 'text-red-400' : 'text-green-400'}>{totalMembers}</strong> (including leader)
                  </>
                )}
              </p>
              {needsMore && (
                <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> You need to add {req.min - totalMembers} more team member(s)
                </p>
              )}
            </div>

            <div className="space-y-8">
              {members.map((member, index) => (
                <div key={member.id} className="relative pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-white/80">
                      {group === 'visitor' ? `Visitor / Attendee #${index + 2}` : `Team Member #${index + 2}`}
                    </h5>
                    {group !== 'visitor' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this team member?")) {
                            removeTeamMember(group, member.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Name <span className="text-violet-400">*</span></label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateTeamMember(group, member.id, 'name', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Email <span className="text-violet-400">*</span></label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(group, member.id, 'email', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Mobile Number <span className="text-violet-400">*</span></label>
                      <input
                        type="tel"
                        value={member.mobileNumber}
                        onChange={(e) => updateTeamMember(group, member.id, 'mobileNumber', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="10-digit number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Gender <span className="text-violet-400">*</span></label>
                      <select
                        value={member.gender}
                        onChange={(e) => updateTeamMember(group, member.id, 'gender', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 appearance-none"
                      >
                        <option value="" className="bg-[#020202]">Select Gender</option>
                        <option value="male" className="bg-[#020202]">Male</option>
                        <option value="female" className="bg-[#020202]">Female</option>
                        <option value="other" className="bg-[#020202]">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Age <span className="text-violet-400">*</span></label>
                      <input
                        type="number"
                        value={member.age}
                        onChange={(e) => updateTeamMember(group, member.id, 'age', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Institution Name <span className="text-violet-400">*</span></label>
                      <input
                        type="text"
                        value={member.institutionName}
                        onChange={(e) => updateTeamMember(group, member.id, 'institutionName', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        placeholder="Your school/college"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 flex justify-between">
                        <span>Institution Identity Card <span className="text-violet-400">*</span></span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id={`file_${group}_${member.id}`}
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            const memberKey = `${group}_${member.id}`;
                            handleIdCardUpload(
                              memberKey,
                              file,
                              (url, name) => { updateTeamMember(group, member.id, 'idCard', url); updateTeamMember(group, member.id, 'idCardName', name); },
                              () => {
                                e.target.value = "";
                                updateTeamMember(group, member.id, 'idCard', null);
                              }
                            );
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`file_${group}_${member.id}`}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                        >
                          {typeof uploadProgress[`${group}_${member.id}`] === "number" && uploadProgress[`${group}_${member.id}`] < 100 ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                              <span className="text-white/80">Uploading... {uploadProgress[`${group}_${member.id}`]}%</span>
                            </>
                          ) : member.idCard ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="truncate max-w-[280px] text-white font-medium">{member.idCardName}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Choose image</span>
                            </>
                          )}

                          {/* Line progress along bottom border */}
                          {typeof uploadProgress[`${group}_${member.id}`] === "number" && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                              <div
                                className={`h-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(168,85,247,0.8)] ${
                                  uploadProgress[`${group}_${member.id}`] === 100
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                    : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400"
                                }`}
                                style={{ width: `${uploadProgress[`${group}_${member.id}`]}%` }}
                              />
                            </div>
                          )}
                        </label>
                      </div>
                      <p className="text-[10px] text-white/40 font-sans">Max size: 5MB (Images only: PNG, JPG, JPEG, WEBP)</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium text-white/80">Address <span className="text-violet-400">*</span></label>
                    <textarea
                      value={member.address}
                      onChange={(e) => updateTeamMember(group, member.id, 'address', e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div ref={formContainerRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-8 md:pb-12 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Top Header Bar */}
      {verificationStatus === "idle" && (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-2 font-sans group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Sabrang &apos;26</span>
          </Link>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            CHECKOUT
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-1 font-sans">
            Complete your registration for Sabrang 2026
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
          {STEPS.map((step, idx) => {
            const isActive = idx === stepIndex;
            const isCompleted = idx < stepIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div className={`w-4 sm:w-8 h-[1px] ${isCompleted ? "bg-cyan-500" : "bg-white/10"}`} />
                )}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      : isCompleted
                        ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/5 text-white/40 border border-white/5"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-cyan-500 text-black" : isCompleted ? "bg-cyan-400/20 text-cyan-300" : "bg-white/10 text-white/40"
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span>{step.name}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      )}

      {/* 2-Column Checkout Layout */}
      {verificationStatus === "idle" ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full flex-grow">
        {/* Left Column: Form Steps & Controls */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* STEP 1: SELECT EVENTS */}
          <div style={{ display: currentStep === "select" ? "block" : "none" }}>
            <div className="space-y-6">
              {/* Cart Loaded banner */}
              {cartLoadedFromUrl && selectedEvents.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-4 py-3 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                  <span>
                    Cart Loaded: {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""} from your cart {selectedEvents.length > 1 ? "have" : "has"} been automatically selected.
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
                <h3 className="text-xl font-semibold text-white text-amber-400">
                  Choose Your Events
                </h3>
                <span className="text-sm text-white/80 text-white/40">
                  {selectedEvents.length} selected
                </span>
              </div>

                            {/* Early Bird Live Banner */}
              {isEarlyBirdActive && (
                <div className="bg-gradient-to-r from-emerald-950/60 via-[#0a1a14] to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="font-black text-xs uppercase tracking-wider text-emerald-300">
                        EARLY BIRD OFFER ACTIVE
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-black">
                        LIVE
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Limited period early bird discounts applied across flagship & competition events. Cut-rate passes active below!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold tracking-wider">
                      Auto-Applied
                    </span>
                  </div>
                </div>
              )}

              {/* Special Offer Card */}
              {specialOffer && (
                <div className="bg-[#140c21] border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      <span className="font-black text-xs uppercase tracking-wider text-fuchsia-300">
                        SPECIAL OFFER
                      </span>
                    </div>
                    <p className="text-xs text-white/70">
                      {specialOffer.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-lg bg-black/50 border border-purple-500/40 text-purple-200 font-sans text-xs font-bold tracking-wider">
                      {specialOffer.code.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCode(specialOffer.code.toUpperCase());
                        setPromoApplied(true);
                        navigator.clipboard?.writeText(specialOffer.code.toUpperCase());
                        setCopiedOffer(true);
                        setTimeout(() => setCopiedOffer(false), 2000);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedOffer ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{copiedOffer ? "Applied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {([
                  "Flagship Events - Team",
                  "Flagship Events - Solo / Duo",
                  "Non-Flagship - Esports",
                  "Non-Flagship - Other Events",
                  // "Activities - Gifts & Hampers",
                  "General Entry",
                ] as SabrangEvent["category"][]).map((category) => {
                  const categoryEvents = EVENTS.filter((e) => e.category === category);
                  if (categoryEvents.length === 0) return null;

                  const categoryLabel = 
                    category === "Flagship Events - Team" ? "Flagship" :
                    category === "Flagship Events - Solo / Duo" ? "Flagship Solo / Duo" :
                    category === "Non-Flagship - Esports" ? "E-Sports" :
                    category === "Non-Flagship - Other Events" ? "Competitions & Events" :
                    category === "Activities - Gifts & Hampers" ? "Activities & Hampers" :
                    "General Visitor Pass";

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-amber-400 font-black text-xl tracking-wide uppercase">
                          {categoryLabel}
                        </h4>
                        <span className="text-sm text-white/80 text-white/40">
                          {categoryEvents.length} event{categoryEvents.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {categoryEvents.map((event) => {
                          const isSelected = selectedEvents.includes(event.id);

                          return (
                            <div
                              key={event.id}
                              onClick={() => toggleEvent(event.id)}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-[#0b1726] border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                  : "bg-[#0d0d10] border-white/10 hover:border-white/20 hover:bg-[#131317]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-black text-base uppercase tracking-wider text-white mb-1.5">
                                    {event.title}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-3">
                                    {event.id === "visitor" ? (
                                      <span className="font-sans text-sm font-bold text-cyan-400">
                                        {isSelected
                                          ? `₹${calculateVisitorPassFee(visitorCount, visitorDays.length)} (₹99/day/person)`
                                          : "₹99 per person per day"}
                                      </span>
                                    ) : isEarlyBirdActive && event.earlyBirdPricingLabel ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-sans text-sm font-bold text-emerald-400">
                                          {event.earlyBirdPricingLabel}
                                        </span>
                                        <span className="font-sans text-xs text-white/40 line-through">
                                          {event.pricingLabel}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                          Early Bird
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="font-sans text-sm font-bold text-cyan-400">
                                        {event.pricingLabel}
                                      </span>
                                    )}
                                    {event.id === "visitor" ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm text-white/80 bg-white/10 text-white/70 border border-white/5">
                                        <Users className="w-3 h-3 text-white/40" />
                                        {visitorCount} {visitorCount === 1 ? "visitor" : "visitors"} • {visitorDays.length} {visitorDays.length === 1 ? "day" : "days"}
                                      </span>
                                    ) : event.isTeam ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm text-white/80 bg-white/10 text-white/70 border border-white/5">
                                        <Users className="w-3 h-3 text-white/40" />
                                        {event.minTeam === event.maxTeam
                                          ? `${event.minTeam} members`
                                          : `${event.minTeam} - ${event.maxTeam} members`}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm text-white/80 bg-white/10 text-white/70 border border-white/5">
                                        Solo
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ml-4 ${
                                    isSelected
                                      ? "bg-cyan-400 border-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                                      : "border-white/20 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                </div>
                              </div>

                              {/* Interactive Inline Visitor Configuration (Days & Quantity) */}
                              {event.id === "visitor" && isSelected && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-4 pt-4 border-t border-white/10 space-y-4"
                                >
                                  {/* Select Festival Days */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-semibold text-white/80 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                        Select Festival Days
                                      </span>
                                      <button
                                        type="button"
                                        onClick={toggleAllVisitorDays}
                                        className="text-[11px] font-sans text-cyan-400 hover:underline cursor-pointer"
                                      >
                                        {visitorDays.length === FESTIVAL_DAYS.length ? "Reset to Day 1" : "Select All 3 Days"}
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      {FESTIVAL_DAYS.map((day) => {
                                        const isDaySelected = visitorDays.includes(day.id);
                                        return (
                                          <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleVisitorDay(day.id)}
                                            className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer ${
                                              isDaySelected
                                                ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                                            }`}
                                          >
                                            <span className="font-bold">{day.label}</span>
                                            <span className="text-[10px] font-sans text-cyan-300">{day.date}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Quantity / Number of Visitors */}
                                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div>
                                      <div className="text-xs font-semibold text-white">Number of Visitors</div>
                                      <div className="text-[10px] text-white/50 font-sans">
                                        Passes issued for each person in your group
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                                      <button
                                        type="button"
                                        onClick={() => handleVisitorCountChange(visitorCount - 1)}
                                        disabled={visitorCount <= 1}
                                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
                                        aria-label="Decrease visitor count"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="font-sans text-sm font-black text-white w-6 text-center">
                                        {visitorCount}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVisitorCountChange(visitorCount + 1)}
                                        disabled={visitorCount >= 10}
                                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
                                        aria-label="Increase visitor count"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Calculated Subtotal pill */}
                                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex justify-between items-center text-xs">
                                    <span className="text-white/70 font-sans text-[11px]">
                                      {visitorCount} visitor{visitorCount > 1 ? "s" : ""} × {visitorDays.length} day{visitorDays.length > 1 ? "s" : ""} @ ₹99/person/day
                                    </span>
                                    <span className="font-sans font-bold text-cyan-400 text-sm">
                                      ₹{calculateVisitorPassFee(visitorCount, visitorDays.length)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* STEP 2: YOUR DETAILS */}
        <div style={{ display: currentStep === "forms" ? "block" : "none" }}>
          <div className="space-y-6">
            
            {/* Generic Events Group */}
            {getActiveGroups().includes('generic') && renderPersonalFields('generic', `Registration for: ${
              selectedEvents
                .map(id => EVENTS.find(e => e.id === id))
                .filter(e => e?.type === 'generic')
                .map(e => e?.title)
                .join(', ')
            }`, selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === 'generic' && e?.isTeam))}

            {/* BGMI Group */}
            {getActiveGroups().includes('bgmi') && renderPersonalFields('bgmi', 'BGMI TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Squad Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'teamName')}
                    onBlur={() => handleBlur(`bgmi_teamName`)}
                    onChange={(e) => updateField('bgmi', 'teamName', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`bgmi_teamName`] && !getField('bgmi', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Leader In-Game Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'leaderIgn')}
                    onBlur={() => handleBlur(`bgmi_leaderIgn`)}
                    onChange={(e) => updateField('bgmi', 'leaderIgn', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`bgmi_leaderIgn`] && !getField('bgmi', 'leaderIgn').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Leader UID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('bgmi', 'leaderUid')}
                    onBlur={() => handleBlur(`bgmi_leaderUid`)}
                    onChange={(e) => updateField('bgmi', 'leaderUid', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`bgmi_leaderUid`] && !getField('bgmi', 'leaderUid').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Valorant Group */}
            {getActiveGroups().includes('valorant') && renderPersonalFields('valorant', 'VALORANT TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Team Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('valorant', 'teamName')}
                    onBlur={() => handleBlur(`valorant_teamName`)}
                    onChange={(e) => updateField('valorant', 'teamName', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`valorant_teamName`] && !getField('valorant', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Leader Riot ID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('valorant', 'leaderRiotId')}
                    onBlur={() => handleBlur(`valorant_leaderRiotId`)}
                    onChange={(e) => updateField('valorant', 'leaderRiotId', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`valorant_leaderRiotId`] && !getField('valorant', 'leaderRiotId').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Free Fire Group */}
            {getActiveGroups().includes('freefire') && renderPersonalFields('freefire', 'FREE FIRE TOURNAMENT', true, (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Team Name <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('freefire', 'teamName')}
                    onBlur={() => handleBlur(`freefire_teamName`)}
                    onChange={(e) => updateField('freefire', 'teamName', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`freefire_teamName`] && !getField('freefire', 'teamName').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    <span>Leader UID <span className="text-violet-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={getField('freefire', 'leaderUid')}
                    onBlur={() => handleBlur(`freefire_leaderUid`)}
                    onChange={(e) => updateField('freefire', 'leaderUid', e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg focus:bg-white/10 px-4 py-2 text-white focus:outline-none ${touched[`freefire_leaderUid`] && !getField('freefire', 'leaderUid').trim() ? "border-red-500/50" : "border-white/10 focus:border-violet-500"}`}
                  />
                </div>
              </div>
            ))}

            {/* Visitor Pass Group */}
            {getActiveGroups().includes('visitor') &&
              renderPersonalFields(
                'visitor',
                visitorCount > 1
                  ? `Visitor Pass (${visitorCount} Attendees • ${visitorDays.length} ${visitorDays.length === 1 ? 'Day' : 'Days'})`
                  : `Visitor Pass (${visitorDays.length} ${visitorDays.length === 1 ? 'Day' : 'Days'})`,
                visitorCount > 1,
                (
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-white/90">Pass Validity:</span>
                      <span className="text-cyan-300 font-sans">
                        {visitorDays.map(d => `${FESTIVAL_DAYS.find(f => f.id === d)?.label} (${FESTIVAL_DAYS.find(f => f.id === d)?.date})`).join(", ")}
                      </span>
                    </div>
                    <span className="text-white/50 font-sans">
                      {visitorCount} Attendee{visitorCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )
              )}
            
          </div>
        </div>

        {/* STEP 3: REVIEW */}
        <div style={{ display: currentStep === "review" ? "block" : "none" }}>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white text-white/90 border-b border-white/10 pb-2">
              Review Your Order
            </h3>
            
            <div className="bg-white/5 border border-violet-500/30 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/50 text-sm text-white/80 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span>Selected Items</span>
                  <span>Price</span>
                </div>

                {selectedEvents.map((eventId) => {
                  const ev = getEventById(eventId);
                  if (!ev) return null;
                  const groupMembers = teamMembers[ev.type];
                  const totalMembers = 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);
                  const itemPrice = calculateEventItemPrice(ev, totalMembers, {
                    count: visitorCount,
                    days: visitorDays,
                  }, isEarlyBirdActive);

                  return (
                    <div key={eventId} className="flex justify-between items-start text-white/90 py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <div className="font-semibold text-sm">{ev.title}</div>
                        <div className="text-[11px] text-white/40 font-sans">{ev.category}</div>
                        {eventId === "visitor" && (
                          <div className="text-[11px] text-cyan-400 font-sans mt-0.5">
                            {visitorCount} attendee{visitorCount > 1 ? "s" : ""} • {visitorDays.length} day{visitorDays.length > 1 ? "s" : ""} ({visitorDays.map(d => FESTIVAL_DAYS.find(f => f.id === d)?.label).join(", ")})
                          </div>
                        )}
                        {ev.isTeam && ev.extraMemberFee > 0 && totalMembers > ev.baseIncludedMembers && (
                          <div className="text-[11px] text-violet-400 font-sans mt-0.5">
                            {totalMembers} members ({ev.baseIncludedMembers} base + {totalMembers - ev.baseIncludedMembers} extra @ ₹{isEarlyBirdActive && ev.earlyBirdExtraMemberFee !== undefined ? ev.earlyBirdExtraMemberFee : ev.extraMemberFee})
                          </div>
                        )}
                        {ev.isTeam && ev.extraMemberFee === 0 && (
                          <div className="text-[11px] text-white/50 font-sans mt-0.5">
                            Team of {totalMembers} members (flat team fee)
                          </div>
                        )}
                      </div>
                      <span className="font-sans text-sm font-bold text-violet-300">₹ {itemPrice}</span>
                    </div>
                  );
                })}
                
                {selectedEvents.length === 0 && (
                  <div className="text-gray-500 italic text-sm">No events selected.</div>
                )}

                {selectedEvents.includes('vaad_vivaad') && getField('generic', 'vaadVivaadRepresentative') && (
                  <div className="p-3 rounded-lg bg-violet-950/30 border border-violet-500/20 text-xs text-white/80 flex flex-wrap justify-between items-center gap-1">
                    <span className="font-sans text-white/50">Vaad Vivaad Representation:</span>
                    <span className="font-semibold text-violet-300">{getField('generic', 'vaadVivaadRepresentative')}</span>
                  </div>
                )}

                <div className="h-px w-full bg-white/10 my-4"></div>
                
                {/* Promo Code section */}
                <div className="space-y-2 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      disabled={promoApplied || isCheckingPromo}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !promoApplied && !isCheckingPromo) {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="ENTER PROMO CODE"
                      className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-all text-sm uppercase disabled:opacity-60 font-sans"
                    />
                    {promoApplied ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-sm font-bold transition-all border border-rose-500/30 cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isCheckingPromo || !promoCode.trim()}
                        onClick={handleApplyCoupon}
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-bold text-white transition-all border border-violet-400/30 cursor-pointer flex items-center gap-1.5"
                      >
                        {isCheckingPromo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    )}
                  </div>

                  {promoError && (
                    <p className="text-xs text-rose-400 font-medium">{promoError}</p>
                  )}

                  {promoApplied && couponData && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-emerald-400 text-sm text-white/80">
                      <span>
                        Coupon {promoCode} applied ({couponData.discountType === 'fixed' ? `Special Price ₹${couponData.finalPrice}` : `${couponData.discountValue}% Off`})
                      </span>
                      <span className="font-bold">- ₹ {couponData.discountAmount}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center font-black text-xl text-violet-400 pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span>₹ {calculateTotal()}</span>
                </div>

                {paymentError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={handleCashfreePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all cursor-pointer"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting to Cashfree Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Pay ₹{calculateTotal()}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-white/40 font-sans">
              Please review your selections before proceeding to payment
            </p>
          </div>
        </div>

        {/* Mobile Navigation Buttons */}
        {verificationStatus === "idle" && (
          <div className="flex lg:hidden justify-between items-center mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0 || isProcessingPayment}
              className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${
                stepIndex === 0
                  ? "opacity-0 pointer-events-none" 
                  : "bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 text-white cursor-pointer"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled() || isProcessingPayment}
              className="px-8 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 font-bold text-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : currentStep === "review" ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Pay ₹{calculateTotal()}</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Sticky Selected Items Sidebar */}
      <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-4">
        <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Selected Items
          </h3>

          {/* List of items */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20">
            {selectedEvents.length === 0 ? (
              <div className="text-white/40 text-xs italic py-6 text-center">
                No events selected yet. Click an event to add.
              </div>
            ) : (
              selectedEvents.map((id) => {
                const ev = getEventById(id);
                if (!ev) return null;
                const groupMembers = teamMembers[ev.type];
                const totalMembers = 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);
                const price = calculateEventItemPrice(ev, totalMembers, {
                  count: visitorCount,
                  days: visitorDays,
                }, isEarlyBirdActive);

                return (
                  <div key={id} className="flex justify-between items-start text-xs py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-bold text-white uppercase tracking-wide">{ev.title}</div>
                      <div className="text-[10px] text-white/40 font-sans">
                        {id === "visitor"
                          ? `${visitorCount} Attendee${visitorCount > 1 ? "s" : ""} • ${visitorDays.length} Day${visitorDays.length > 1 ? "s" : ""}`
                          : ev.category}
                      </div>
                    </div>
                    <span className="font-sans text-cyan-400 font-bold text-xs shrink-0">
                      {ev.isTeam ? `Team ₹${price}` : `₹${price}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {promoApplied && couponData && (
            <div className="flex justify-between items-center text-sm text-white/80 text-emerald-400 border-t border-white/5 pt-2">
              <span>Promo ({promoCode})</span>
              <span>- ₹{couponData.discountAmount}</span>
            </div>
          )}

          <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
            <span className="font-bold text-sm text-white uppercase tracking-wider">Total</span>
            <span className="font-sans text-2xl font-black text-white">
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>

          {/* Sidebar Action Button */}
          {currentStep === "select" && (
            <button
              type="button"
              onClick={handleNext}
              disabled={selectedEvents.length === 0}
              className="w-full py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {currentStep === "forms" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled()}
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
              >
                <span>Proceed to Review</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Events</span>
              </button>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCashfreePayment}
                disabled={isProcessingPayment}
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleBack}
                disabled={isProcessingPayment}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      ) : (
        /* Verification Status / Result Screen when redirected back from Cashfree */
        <div className="flex-grow flex items-center justify-center w-full py-12">
          <div className="w-full max-w-2xl bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {verificationStatus === "verifying" && (
              <div className="py-12 px-6 text-center space-y-6 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Verifying Payment
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Communicating securely with Cashfree payment gateway. Please keep this window open while we generate your registration pass.
                </p>
              </div>
            )}

            {verificationStatus === "success" && verifiedOrder && (
              <div className="py-8 px-6 text-center space-y-6 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                    Registration Successful
                  </h3>
                  <p className="text-emerald-400 font-sans text-sm uppercase tracking-widest font-semibold">
                    Payment Processed Successfully
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3 font-sans text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/50">Order ID:</span>
                    <span className="text-white font-medium">{verifiedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/50">Registration ID:</span>
                    <span className="text-violet-300 font-medium">{verifiedOrder.registrationId}</span>
                  </div>
                  {verifiedOrder.email && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Pass Delivered To:</span>
                      <span className="text-white/90">{verifiedOrder.email}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30">
                  <p className="text-violet-200 text-sm font-medium leading-relaxed">
                    Your registration will be confirmed via email in 24 hours.
                  </p>
                </div>

                <p className="text-white/60 text-sm leading-relaxed">
                  Your official festival pass with verifiable QR code has been generated. You may also download it below.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <a
                    href={`/api/receipt?id=${encodeURIComponent(verifiedOrder.registrationId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download Pass (PDF)
                  </a>
                  <button
                    type="button"
                    onClick={() => { window.location.href = "/"; }}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-sm text-white transition-all"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            )}

            {verificationStatus === "error" && (
              <div className="py-8 px-6 text-center space-y-6 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <XCircle className="w-10 h-10 text-rose-400" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                    Payment Verification Issue
                  </h3>
                  <p className="text-rose-400/90 text-base">
                    {paymentError || "The transaction could not be confirmed or was cancelled."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      const id = params.get("order_id");
                      if (id) {
                        verifyOrderPayment(id);
                      } else {
                        setVerificationStatus("idle");
                      }
                    }}
                    className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Retry Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStatus("idle");
                      setPaymentError(null);
                      setCurrentStep("review");
                    }}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-sm text-white transition-all"
                  >
                    Back to Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
