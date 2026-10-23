"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, limit, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, ChevronRight, ArrowLeft, Upload, AlertTriangle, Info, Loader2, CheckCircle2, XCircle, ShieldCheck, Download, ExternalLink, RefreshCw, Users, Sparkles, Plus, Minus, Calendar } from "lucide-react";
import {
  OFFICIAL_EVENTS,
  getEventById,
  calculateEventItemPrice,
  calculateTotalRegistrationFee,
  calculateTotalBandFee,
  getEventBandFee,
  getGroupTeamRequirements,
  isFlagshipEvent,
  calculateFlagshipBankFee,
  SabrangEvent,
  VAAD_VIVAAD_REPRESENTATIVES,
  FESTIVAL_DAYS,
  VisitorPassConfig,
  calculateVisitorPassFee,
} from "@/lib/eventPricing";
import RegistrationCoordinatorsDropdown from "@/components/auth/RegistrationCoordinatorsDropdown";

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
  institutionSelect?: string;
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
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verifiedOrder, setVerifiedOrder] = useState<{ orderId: string; registrationId: string; email?: string; token?: string } | null>(null);

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
          token: data.token,
        });

        // Safely strip ?order_id=... from the browser address bar so page refreshes do not re-request verification
        if (typeof window !== "undefined" && window.history?.replaceState) {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("order_id");
            const newSearch = url.searchParams.toString();
            const newUrl = url.pathname + (newSearch ? `?${newSearch}` : "") + url.hash;
            window.history.replaceState({}, document.title, newUrl);
          } catch {
            // Non-critical fallback
          }
        }
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

  // Preload Cashfree SDK so checkout launches instantaneously
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Cashfree) {
      const existing = document.getElementById("cashfree-sdk-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "cashfree-sdk-script";
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  // Irreplaceable prefilled institution for PRO-NITE JKLU Pass
  useEffect(() => {
    if (selectedEvents.includes("pronite_jklu")) {
      setFormData((prev) => {
        let changed = false;
        const next = { ...prev };
        if (next["generic_institutionSelect"] !== "JK Lakshmipat University") {
          next["generic_institutionSelect"] = "JK Lakshmipat University";
          changed = true;
        }
        if (next["generic_institutionName"] !== "JK Lakshmipat University") {
          next["generic_institutionName"] = "JK Lakshmipat University";
          changed = true;
        }
        const currentEmail = next["generic_email"] || "";
        if (!currentEmail) {
          next["generic_email"] = "@jklu.edu.in";
          changed = true;
        } else if (!currentEmail.endsWith("@jklu.edu.in") && !currentEmail.endsWith("@hsb.edu.in")) {
          const pfx = currentEmail.includes("@") ? currentEmail.split("@")[0] : currentEmail;
          next["generic_email"] = pfx ? `${pfx.replace(/\s+/g, "")}@jklu.edu.in` : "@jklu.edu.in";
          changed = true;
        }
        return changed ? next : prev;
      });
    }
  }, [selectedEvents]);

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
      const primaryGroup = activeGroups.find(g => g !== "visitor") || activeGroups[0] || "visitor";

      const name = getField(primaryGroup, "name").trim();
      const email = getField(primaryGroup, "email").trim();
      const mobile = sanitizePhone(getField(primaryGroup, "mobileNumber"));
      const gender = getField(primaryGroup, "gender");
      const institutionName = getField(primaryGroup, "institutionName").trim();
      const address = getField(primaryGroup, "address").trim();

      const regNum = getField(primaryGroup, "registrationNumber") || getField(primaryGroup, "rollNumber") || `REG_${Date.now()}`;

      const primaryIdCard = idCards[primaryGroup]?.url || Object.values(idCards).find(v => v !== null)?.url || null;

      const cleanedTeamMembers: Record<string, TeamMember[]> = {};
      Object.entries(teamMembers).forEach(([grp, mList]) => {
        cleanedTeamMembers[grp] = (mList || []).map((m) => ({
          ...m,
          name: m.name.trim(),
          email: m.email.trim(),
          mobileNumber: sanitizePhone(m.mobileNumber),
          age: m.age.trim(),
          institutionName: m.institutionName.trim(),
          address: m.address.trim(),
        }));
      });

      const payload = {
        action: "CREATE_ORDER",
        ...formData,
        idCard: primaryIdCard,
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
        teamMembers: cleanedTeamMembers,
        amount: calculateTotal(),
        visitorConfig: selectedEvents.includes("visitor")
          ? { count: visitorCount, days: visitorDays }
          : undefined,
        vaadVivaadRepresentative: selectedEvents.includes("vaad_vivaad")
          ? getField("generic", "vaadVivaadRepresentative").trim()
          : undefined,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let res: Response;
      try {
        res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fall through to error handler below
      }

      if (!res.ok || !data || data.error) {
        throw new Error(data?.error || `Server error (${res.status}). Please try again.`);
      }

      // If zero-amount order (e.g. Free pass / 100% coupon discount) or mock mode
      if (data.is_zero_amount || data.is_mock) {
        await verifyOrderPayment(data.order_id);
        setIsProcessingPayment(false);
        return;
      }

      if (!data.payment_session_id) {
        throw new Error("Cashfree session ID missing from order creation response.");
      }

      // Load Cashfree JS SDK v3 dynamically with timeout
      const loadCashfreeSdk = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (typeof window !== "undefined" && (window as any).Cashfree) {
            resolve((window as any).Cashfree);
            return;
          }
          const timeout = setTimeout(() => {
            reject(new Error("Cashfree SDK loading timed out. Please check your network or ad-blocker."));
          }, 12000);

          let script = document.getElementById("cashfree-sdk-script") as HTMLScriptElement | null;
          if (script) {
            script.addEventListener("load", () => {
              clearTimeout(timeout);
              resolve((window as any).Cashfree);
            });
            script.addEventListener("error", () => {
              clearTimeout(timeout);
              reject(new Error("Failed to load Cashfree Payment SDK."));
            });
            return;
          }

          script = document.createElement("script");
          script.id = "cashfree-sdk-script";
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.async = true;
          script.onload = () => {
            clearTimeout(timeout);
            resolve((window as any).Cashfree);
          };
          script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Unable to load Cashfree Payment SDK. Please check your network connection."));
          };
          document.head.appendChild(script);
        });
      };

      const CashfreeSDK = await loadCashfreeSdk();
      const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION";
      const cashfree = CashfreeSDK({
        mode: isProduction ? "production" : "sandbox",
      });

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });

      if (checkoutResult?.error) {
        setPaymentError(checkoutResult.error.message || "Failed to initialize payment gateway.");
        setIsProcessingPayment(false);
      } else {
        // Redirection should take over window.location to Cashfree.
        // Fallback safety timeout in case the user remains on screen:
        setTimeout(() => {
          setIsProcessingPayment(false);
        }, 8000);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      if (err.name === "AbortError") {
        setPaymentError("Payment initiation timed out. Please check your internet connection and try again.");
      } else {
        setPaymentError(err.message || "An unexpected error occurred while initiating payment.");
      }
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
        if (selectedEvents.length === 0) {
          setFormErrorMessage("Please select at least one event or pass to continue.");
          return;
        }
        setFormErrorMessage(null);
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
            const newItems: TeamMember[] = Array.from({ length: toAdd }, () => ({
              id: Math.random().toString(36).substr(2, 9),
              name: "",
              email: "",
              mobileNumber: "",
              gender: "",
              age: "",
              institutionName: "",
              institutionSelect: "",
              address: "",
              idCard: null,
            }));
            nextTeam[group] = [...currentMembers, ...newItems];
            modified = true;
          }
        });
        if (modified) setTeamMembers(nextTeam);
      }

      if (currentStep === "forms") {
        const issues = getFormValidationIssues();
        if (issues.length > 0) {
          const newTouched: Record<string, boolean> = { ...touched };
          issues.forEach((iss) => {
            if (iss.fieldKey) {
              newTouched[iss.fieldKey] = true;
            }
          });
          setTouched(newTouched);
          setFormErrorMessage(issues[0].message);

          if (issues[0].elementId) {
            const el = document.getElementById(issues[0].elementId);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              if ("focus" in el && typeof (el as any).focus === "function") {
                (el as any).focus();
              }
            }
          }
          return;
        }
        setFormErrorMessage(null);
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
      setFormErrorMessage(null);
      setCurrentStep(STEPS[stepIndex - 1].id);
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      let next = prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id];
      if (id === "pronite_jklu" && next.includes("pronite_jklu")) {
        next = next.filter((e) => e !== "pronite_outsider");
      } else if (id === "pronite_outsider" && next.includes("pronite_outsider")) {
        next = next.filter((e) => e !== "pronite_jklu");
      }
      return next;
    });

    if (id === "pronite_jklu") {
      setFormData((prev) => {
        const currentEmail = prev["generic_email"] || "";
        const domain = currentEmail.endsWith("@hsb.edu.in") ? "@hsb.edu.in" : "@jklu.edu.in";
        const pfx = currentEmail.includes("@") ? currentEmail.split("@")[0] : currentEmail;
        return {
          ...prev,
          generic_institutionSelect: "JK Lakshmipat University",
          generic_institutionName: "JK Lakshmipat University",
          generic_email: pfx ? `${pfx.replace(/\s+/g, "")}${domain}` : domain,
        };
      });
    }
  };

  const calculateTotal = () => {
    const isStep1 = currentStep === "select";
    const rawTotal = calculateTotalRegistrationFee(
      selectedEvents,
      isStep1 ? undefined : teamMembers,
      {
        count: visitorCount,
        days: visitorDays,
      },
      isEarlyBirdActive
    );
    
    if (promoApplied && couponData?.valid) {
      const totalBandFee = calculateTotalBandFee(
        selectedEvents,
        isStep1 ? undefined : teamMembers,
        {
          count: visitorCount,
          days: visitorDays,
        }
      );
      const discount = Math.max(0, Number(couponData.discountAmount) || 0);
      return Math.max(totalBandFee, rawTotal - discount);
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
      const primaryGroup = activeGroups.find(g => g !== "visitor") || activeGroups[0] || "visitor";
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

  // Re-verify applied coupon whenever event selection or team composition changes
  useEffect(() => {
    if (!promoApplied || !promoCode.trim()) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const activeGroups = getActiveGroups();
        const primaryGroup = activeGroups.find(g => g !== "visitor") || activeGroups[0] || "visitor";
        const regNum = getField(primaryGroup, "registrationNumber") || getField(primaryGroup, "rollNumber") || "";

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "VERIFY_COUPON",
            coupon: promoCode.trim().toUpperCase(),
            selectedEvents,
            teamMembers,
            visitorConfig: selectedEvents.includes("visitor")
              ? { count: visitorCount, days: visitorDays }
              : undefined,
            registrationNumber: regNum,
          }),
        });

        if (!isMounted) return;
        const data = await res.json();
        if (res.ok && data?.valid) {
          setCouponData(data);
          setPromoError(null);
        } else {
          setPromoApplied(false);
          setCouponData(null);
          setPromoError(data?.error || "Coupon removed: no longer valid for updated event selection.");
        }
      } catch {
        if (!isMounted) return;
        setPromoApplied(false);
        setCouponData(null);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedEvents, teamMembers, visitorCount, visitorDays, promoApplied, promoCode]);

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
          institutionName: "",
          institutionSelect: "",
          address: "",
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

  const sanitizePhone = (phone: string) => {
    if (!phone) return "";
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    return digits;
  };

  const isValidEmail = (email: string) => {
    if (!email) return false;
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const isValidPhone = (phone: string) => {
    const clean = sanitizePhone(phone);
    return clean.length === 10;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const updateField = (group: string, field: string, value: string) => {
    if (formErrorMessage) setFormErrorMessage(null);
    if (
      group === "generic" &&
      selectedEvents.includes("pronite_jklu") &&
      (field === "institutionName" || field === "institutionSelect") &&
      value !== "JK Lakshmipat University"
    ) {
      return; // Locked and irreplaceable
    }
    setFormData((prev) => ({
      ...prev,
      [`${group}_${field}`]: value,
    }));
  };

  const getField = (group: string, field: string) => {
    if (
      group === "generic" &&
      selectedEvents.includes("pronite_jklu") &&
      (field === "institutionName" || field === "institutionSelect")
    ) {
      return "JK Lakshmipat University";
    }
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
    if (formErrorMessage) setFormErrorMessage(null);
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      email: "",
      mobileNumber: "",
      gender: "",
      age: "",
      institutionName: "",
      institutionSelect: "",
      address: "",
      idCard: null,
    };
    
    setTeamMembers(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), newMember]
    }));
  };

  const removeTeamMember = (group: string, memberId: string) => {
    if (formErrorMessage) setFormErrorMessage(null);
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).filter(m => m.id !== memberId)
    }));
  };

  const updateTeamMember = (group: string, memberId: string, field: keyof TeamMember, value: any) => {
    if (formErrorMessage) setFormErrorMessage(null);
    setTeamMembers(prev => ({
      ...prev,
      [group]: (prev[group] || []).map(m => m.id === memberId ? { ...m, [field]: value } : m)
    }));
  };

  const getTeamRequirements = (group: string) => {
    return getGroupTeamRequirements(group, selectedEvents, { count: visitorCount, days: visitorDays });
  };

  type ValidationIssue = {
    elementId?: string;
    fieldKey?: string;
    message: string;
  };

  const getFormValidationIssues = (): ValidationIssue[] => {
    if (currentStep === "select") {
      if (selectedEvents.length === 0) {
        return [{ message: "Please select at least one event or pass to continue." }];
      }
      return [];
    }

    if (currentStep === "forms") {
      const issues: ValidationIssue[] = [];
      const activeGroups = getActiveGroups();

      for (const group of activeGroups) {
        // Specific fields
        if (group === 'bgmi') {
          if (!getField(group, 'teamName').trim()) {
            issues.push({ elementId: 'bgmi_teamName', fieldKey: 'bgmi_teamName', message: 'BGMI Squad Name is required.' });
          }
          if (!getField(group, 'leaderIgn').trim()) {
            issues.push({ elementId: 'bgmi_leaderIgn', fieldKey: 'bgmi_leaderIgn', message: 'BGMI Leader In-Game Name (IGN) is required.' });
          }
          if (!getField(group, 'leaderUid').trim()) {
            issues.push({ elementId: 'bgmi_leaderUid', fieldKey: 'bgmi_leaderUid', message: 'BGMI Leader Character UID is required.' });
          }
        }
        if (group === 'valorant') {
          if (!getField(group, 'teamName').trim()) {
            issues.push({ elementId: 'valorant_teamName', fieldKey: 'valorant_teamName', message: 'VALORANT Team Name is required.' });
          }
          if (!getField(group, 'leaderRiotId').trim()) {
            issues.push({ elementId: 'valorant_leaderRiotId', fieldKey: 'valorant_leaderRiotId', message: 'VALORANT Leader Riot ID (Name#TAG) is required.' });
          }
        }
        if (group === 'freefire') {
          if (!getField(group, 'teamName').trim()) {
            issues.push({ elementId: 'freefire_teamName', fieldKey: 'freefire_teamName', message: 'Free Fire Team Name is required.' });
          }
          if (!getField(group, 'leaderUid').trim()) {
            issues.push({ elementId: 'freefire_leaderUid', fieldKey: 'freefire_leaderUid', message: 'Free Fire Leader UID is required.' });
          }
        }

        // Generic team fields
        if (group === 'generic') {
          const hasTeamEvents = selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === 'generic' && e?.isTeam);
          if (hasTeamEvents && !getField(group, 'teamName').trim()) {
            issues.push({ elementId: `input_${group}_teamName`, fieldKey: `${group}_teamName`, message: 'Team / Squad Name is required.' });
          }

          if (selectedEvents.includes('vaad_vivaad') && !getField('generic', 'vaadVivaadRepresentative').trim()) {
            issues.push({ elementId: 'generic_vaadVivaadRepresentative', fieldKey: 'generic_vaadVivaadRepresentative', message: 'Please select an MP or Journalist for Vaad Vivaad.' });
          }
        }

        // Leader details
        const name = getField(group, 'name').trim();
        const inst = getField(group, 'institutionName').trim();
        const mobile = getField(group, 'mobileNumber').trim();
        const gender = getField(group, 'gender');
        const age = getField(group, 'age').trim();
        const email = getField(group, 'email').trim();
        const idCard = idCards[group];
        const address = getField(group, 'address').trim();

        const rolePrefix = group === 'visitor' ? 'Primary Attendee' : 'Team Leader';

        if (!name) {
          issues.push({ elementId: `input_${group}_name`, fieldKey: `${group}_name`, message: `${rolePrefix} Name is required.` });
        }
        if (!inst) {
          issues.push({ elementId: `select_${group}_institutionName`, fieldKey: `${group}_institutionName`, message: `${rolePrefix} Institution Name is required.` });
        }
        if (!isValidPhone(mobile)) {
          issues.push({ elementId: `input_${group}_mobileNumber`, fieldKey: `${group}_mobileNumber`, message: `Please enter a valid 10-digit mobile number for ${rolePrefix}.` });
        }
        if (!gender) {
          issues.push({ elementId: `select_${group}_gender`, fieldKey: `${group}_gender`, message: `Please select Gender for ${rolePrefix}.` });
        }
        if (!age) {
          issues.push({ elementId: `input_${group}_age`, fieldKey: `${group}_age`, message: `Please enter Age for ${rolePrefix}.` });
        }
        if (!isValidEmail(email)) {
          issues.push({ elementId: `input_${group}_email`, fieldKey: `${group}_email`, message: `Please enter a valid Email address for ${rolePrefix}.` });
        }
        if (!idCard) {
          issues.push({ elementId: `file_${group}_label`, fieldKey: `${group}_idCard`, message: `Please upload an Institution Identity Card image for ${rolePrefix}.` });
        }
        if (!address) {
          issues.push({ elementId: `textarea_${group}_address`, fieldKey: `${group}_address`, message: `Please enter Address for ${rolePrefix}.` });
        }

        // Team members / Additional attendees validation
        const hasTeamEvents =
          selectedEvents.map(id => EVENTS.find(e => e.id === id)).some(e => e?.type === group && e?.isTeam) ||
          (group === 'visitor' && visitorCount > 1);

        if (hasTeamEvents) {
          const members = teamMembers[group] || [];
          const req = getTeamRequirements(group);
          const totalMembers = 1 + members.length; // leader + members

          if (totalMembers < req.min) {
            issues.push({
              elementId: `section_members_${group}`,
              fieldKey: `team_count_${group}`,
              message: `Minimum team size is ${req.min}. Please add at least ${req.min - totalMembers} more member(s).`,
            });
          }

          members.forEach((m, idx) => {
            const memberNum = idx + 2;
            const label = group === 'visitor' ? `Visitor #${memberNum}` : `Team Member #${memberNum}`;

            if (!m.name.trim()) {
              issues.push({ elementId: `input_member_${m.id}_name`, fieldKey: `member_${m.id}_name`, message: `Name is required for ${label}.` });
            }
            if (!m.institutionName.trim()) {
              issues.push({ elementId: `select_member_${m.id}_institutionName`, fieldKey: `member_${m.id}_institutionName`, message: `Institution is required for ${label}.` });
            }
            if (!isValidPhone(m.mobileNumber)) {
              issues.push({ elementId: `input_member_${m.id}_mobileNumber`, fieldKey: `member_${m.id}_mobileNumber`, message: `Please enter a valid 10-digit mobile number for ${label}.` });
            }
            if (!m.gender) {
              issues.push({ elementId: `select_member_${m.id}_gender`, fieldKey: `member_${m.id}_gender`, message: `Please select Gender for ${label}.` });
            }
            if (!m.age.trim()) {
              issues.push({ elementId: `input_member_${m.id}_age`, fieldKey: `member_${m.id}_age`, message: `Age is required for ${label}.` });
            }
            if (group !== 'visitor' && !isValidEmail(m.email)) {
              issues.push({ elementId: `input_member_${m.id}_email`, fieldKey: `member_${m.id}_email`, message: `Please enter a valid Email address for ${label}.` });
            }
            if (!m.idCard) {
              issues.push({ elementId: `file_${group}_${m.id}_label`, fieldKey: `member_${m.id}_idCard`, message: `Identity Card image is required for ${label}.` });
            }
            if (!m.address.trim()) {
              issues.push({ elementId: `textarea_member_${m.id}_address`, fieldKey: `member_${m.id}_address`, message: `Address is required for ${label}.` });
            }
          });
        }
      }

      return issues;
    }

    return [];
  };

  // Ensure all required fields are filled for active groups
  const isNextDisabled = () => {
    return getFormValidationIssues().length > 0;
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
                id={`input_${group}_teamName`}
                type="text"
                value={getField(group, 'teamName')}
                onBlur={() => handleBlur(`${group}_teamName`)}
                onChange={(e) => updateField(group, 'teamName', e.target.value)}
                className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                  touched[`${group}_teamName`] && !getField(group, 'teamName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                }`}
                placeholder="Enter Team Name"
              />
              {touched[`${group}_teamName`] && !getField(group, 'teamName').trim() && (
                <p className="text-xs text-red-400 font-sans">Team name is required.</p>
              )}
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
              id="generic_vaadVivaadRepresentative"
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
              id={`input_${group}_name`}
              type="text"
              value={getField(group, 'name')}
              onBlur={() => handleBlur(`${group}_name`)}
              onChange={(e) => updateField(group, 'name', e.target.value)}
              className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_name`] && !getField(group, 'name').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="Enter your full name"
            />
            {touched[`${group}_name`] && !getField(group, 'name').trim() && (
              <p className="text-xs text-red-400 font-sans">Name is required.</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex justify-between">
                <span>{showTeamFields ? "Team Leader Institution Name" : group === 'visitor' ? "Primary Attendee Institution" : "Institution Name"} <span className="text-violet-400">*</span></span>
                {group === "generic" && selectedEvents.includes("pronite_jklu") && (
                  <span className="text-[10px] text-violet-300 font-mono font-semibold uppercase tracking-wider bg-violet-500/15 px-2 py-0.5 rounded border border-violet-500/30">
                    JKLU Exclusive
                  </span>
                )}
              </label>

              {group === "generic" && selectedEvents.includes("pronite_jklu") ? (
                <input
                  id={`select_${group}_institutionName`}
                  type="text"
                  value="JK Lakshmipat University"
                  readOnly
                  disabled
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white/90 cursor-not-allowed select-none focus:outline-none"
                />
              ) : (
                <select
                  id={`select_${group}_institutionName`}
                  value={
                    getField(group, 'institutionSelect') ||
                    (getField(group, 'institutionName') === "JK Lakshmipat University"
                      ? "JK Lakshmipat University"
                      : getField(group, 'institutionName')
                      ? "other"
                      : "")
                  }
                  onBlur={() => handleBlur(`${group}_institutionName`)}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField(group, 'institutionSelect', val);
                    if (val === "JK Lakshmipat University") {
                      updateField(group, 'institutionName', "JK Lakshmipat University");
                      const currentEmail = getField(group, 'email');
                      const pfx = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
                      updateField(group, 'email', pfx ? `${pfx.replace(/\s+/g, '')}@jklu.edu.in` : "@jklu.edu.in");
                    } else if (val === "other") {
                      if (getField(group, 'institutionName') === "JK Lakshmipat University") {
                        updateField(group, 'institutionName', "");
                      }
                      const currentEmail = getField(group, 'email');
                      if (currentEmail === "@jklu.edu.in") {
                        updateField(group, 'email', "");
                      } else if (currentEmail.endsWith("@jklu.edu.in")) {
                        updateField(group, 'email', currentEmail.replace("@jklu.edu.in", ""));
                      }
                    } else {
                      updateField(group, 'institutionName', "");
                      const currentEmail = getField(group, 'email');
                      if (currentEmail === "@jklu.edu.in") {
                        updateField(group, 'email', "");
                      } else if (currentEmail.endsWith("@jklu.edu.in")) {
                        updateField(group, 'email', currentEmail.replace("@jklu.edu.in", ""));
                      }
                    }
                  }}
                  className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white focus:outline-none transition-all cursor-pointer ${
                    touched[`${group}_institutionName`] && !getField(group, 'institutionName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                  }`}
                >
                  <option value="" className="bg-[#020202]">Select Institution</option>
                  <option value="JK Lakshmipat University" className="bg-[#020202]">JK Lakshmipat University</option>
                  <option value="other" className="bg-[#020202]">Others</option>
                </select>
              )}
            </div>

            {!(group === "generic" && selectedEvents.includes("pronite_jklu")) &&
              (getField(group, 'institutionSelect') === "other" ||
                (!getField(group, 'institutionSelect') &&
                  getField(group, 'institutionName') &&
                  getField(group, 'institutionName') !== "JK Lakshmipat University")) && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-medium text-white/80 flex justify-between">
                  <span>Enter Institution Name <span className="text-violet-400">*</span></span>
                </label>
                <input
                  id={`input_${group}_institutionName`}
                  type="text"
                  value={getField(group, 'institutionName')}
                  onBlur={() => handleBlur(`${group}_institutionName`)}
                  onChange={(e) => updateField(group, 'institutionName', e.target.value)}
                  className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                    touched[`${group}_institutionName`] && !getField(group, 'institutionName').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                  }`}
                  placeholder="Your school/college/university"
                  autoFocus
                />
              </div>
            )}
            {!(group === "generic" && selectedEvents.includes("pronite_jklu")) && touched[`${group}_institutionName`] && !getField(group, 'institutionName').trim() && (
              <p className="text-xs text-red-400 font-sans">Institution name is required.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Mobile Number" : group === 'visitor' ? "Primary Attendee Mobile" : "Mobile Number"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              id={`input_${group}_mobileNumber`}
              type="tel"
              value={getField(group, 'mobileNumber')}
              onBlur={() => {
                handleBlur(`${group}_mobileNumber`);
                const cl = sanitizePhone(getField(group, 'mobileNumber'));
                if (cl.length === 10) updateField(group, 'mobileNumber', cl);
              }}
              onChange={(e) => {
                const val = e.target.value;
                const cl = sanitizePhone(val);
                updateField(group, 'mobileNumber', cl.length === 10 ? cl : val.replace(/[^\d\s+\-]/g, ''));
              }}
              className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_mobileNumber`] && !isValidPhone(getField(group, 'mobileNumber')) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="10-digit number"
            />
            {touched[`${group}_mobileNumber`] && !isValidPhone(getField(group, 'mobileNumber')) && (
              <p className="text-xs text-red-400 font-sans">Please enter a valid 10-digit mobile number.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Gender" : group === 'visitor' ? "Primary Attendee Gender" : "Gender"} <span className="text-violet-400">*</span></span>
            </label>
            <select
              id={`select_${group}_gender`}
              value={getField(group, 'gender')}
              onBlur={() => handleBlur(`${group}_gender`)}
              onChange={(e) => updateField(group, 'gender', e.target.value)}
              className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white focus:outline-none transition-all appearance-none ${
                touched[`${group}_gender`] && !getField(group, 'gender') ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
            >
              <option value="" className="bg-[#020202]">Select Gender</option>
              <option value="male" className="bg-[#020202]">Male</option>
              <option value="female" className="bg-[#020202]">Female</option>
              <option value="other" className="bg-[#020202]">Other</option>
            </select>
            {touched[`${group}_gender`] && !getField(group, 'gender') && (
              <p className="text-xs text-red-400 font-sans">Gender is required.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 flex justify-between">
              <span>{showTeamFields ? "Team Leader Age" : group === 'visitor' ? "Primary Attendee Age" : "Age"} <span className="text-violet-400">*</span></span>
            </label>
            <input
              id={`input_${group}_age`}
              type="number"
              value={getField(group, 'age')}
              onBlur={() => handleBlur(`${group}_age`)}
              onChange={(e) => updateField(group, 'age', e.target.value)}
              className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                touched[`${group}_age`] && !getField(group, 'age').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
              }`}
              placeholder="e.g., 20"
            />
            {touched[`${group}_age`] && !getField(group, 'age').trim() && (
              <p className="text-xs text-red-400 font-sans">Age is required.</p>
            )}
          </div>

          {(() => {
            const isProniteJklu = group === "generic" && selectedEvents.includes("pronite_jklu");
            const isJklu =
              getField(group, 'institutionName') === "JK Lakshmipat University" ||
              getField(group, 'institutionSelect') === "JK Lakshmipat University";
            const emailValue = getField(group, 'email');
            const selectedDomain = isProniteJklu && emailValue.endsWith("@hsb.edu.in")
              ? "@hsb.edu.in"
              : "@jklu.edu.in";
            const prefix = isProniteJklu && emailValue.endsWith("@hsb.edu.in")
              ? emailValue.slice(0, -"@hsb.edu.in".length)
              : emailValue.endsWith("@jklu.edu.in")
              ? emailValue.slice(0, -"@jklu.edu.in".length)
              : emailValue.includes("@")
              ? emailValue.split("@")[0]
              : emailValue;

            return (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex justify-between">
                  <span>{showTeamFields ? "Team Leader Email" : group === 'visitor' ? "Primary Attendee Email" : "Email"} <span className="text-violet-400">*</span></span>
                </label>
                {isJklu ? (
                  <div
                    className={`flex items-center w-full bg-white/5 border rounded-lg overflow-hidden transition-all focus-within:bg-white/10 ${
                      touched[`${group}_email`] && !isValidEmail(emailValue)
                        ? "border-red-500/50 focus-within:border-red-500"
                        : "border-white/10 focus-within:border-violet-500"
                    }`}
                  >
                    <input
                      id={`input_${group}_email`}
                      type="text"
                      value={prefix}
                      onBlur={() => {
                        handleBlur(`${group}_email`);
                        const cleanPrefix = prefix.replace(/@.*$/, '').replace(/\s+/g, '');
                        updateField(group, 'email', cleanPrefix ? `${cleanPrefix}${selectedDomain}` : selectedDomain);
                      }}
                      onChange={(e) => {
                        const cleanPrefix = e.target.value.replace(/@.*$/, '').replace(/\s+/g, '');
                        updateField(group, 'email', cleanPrefix ? `${cleanPrefix}${selectedDomain}` : selectedDomain);
                      }}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:outline-none min-w-0"
                      placeholder="username / roll number"
                    />
                    {isProniteJklu ? (
                      <select
                        id={`select_${group}_email_domain`}
                        value={selectedDomain}
                        onChange={(e) => {
                          const newDomain = e.target.value;
                          const cleanPrefix = prefix.replace(/@.*$/, '').replace(/\s+/g, '');
                          updateField(group, 'email', cleanPrefix ? `${cleanPrefix}${newDomain}` : newDomain);
                        }}
                        className="bg-white/10 text-violet-300 font-medium text-sm border-l border-white/10 px-3 py-3 focus:outline-none cursor-pointer hover:bg-white/15 transition-colors [&>option]:bg-[#0d0d12] [&>option]:text-white"
                      >
                        <option value="@jklu.edu.in">@jklu.edu.in</option>
                        <option value="@hsb.edu.in">@hsb.edu.in</option>
                      </select>
                    ) : (
                      <span className="px-3.5 py-3 bg-white/10 text-violet-300 font-medium text-sm border-l border-white/10 select-none whitespace-nowrap pointer-events-none flex items-center">
                        @jklu.edu.in
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    id={`input_${group}_email`}
                    type="email"
                    value={emailValue}
                    onBlur={() => {
                      handleBlur(`${group}_email`);
                      const cur = getField(group, 'email');
                      if (cur) updateField(group, 'email', cur.trim());
                    }}
                    onChange={(e) => updateField(group, 'email', e.target.value)}
                    className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all ${
                      touched[`${group}_email`] && !isValidEmail(emailValue) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
                    }`}
                    placeholder="you@example.com"
                  />
                )}
                {touched[`${group}_email`] && !isValidEmail(emailValue) && (
                  <p className="text-xs text-red-400 font-sans">Please enter a valid email address.</p>
                )}
              </div>
            );
          })()}

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
                    (url, name) => {
                      setIdCards((prev) => ({ ...prev, [group]: { url, name } }));
                      setTouched((prev) => ({ ...prev, [`${group}_idCard`]: true }));
                    },
                    () => {
                      e.target.value = "";
                      setIdCards((prev) => ({ ...prev, [group]: null }));
                      setTouched((prev) => ({ ...prev, [`${group}_idCard`]: true }));
                    }
                  );
                }}
                className="hidden"
              />
              <label
                id={`file_${group}_label`}
                htmlFor={`file_${group}`}
                className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden ${
                  touched[`${group}_idCard`] && !idCards[group]
                    ? "border-red-500/50"
                    : "border-white/10"
                }`}
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
            {touched[`${group}_idCard`] && !idCards[group] && (
              <p className="text-xs text-red-400 font-sans">Identity card image is required.</p>
            )}
            <p className="text-[10px] text-white/40 font-sans">Max size: 5MB (Images only: PNG, JPG, JPEG, WEBP)</p>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <label className="text-sm font-medium text-white/80 flex justify-between">
            <span>Address <span className="text-violet-400">*</span></span>
          </label>
          <textarea
            id={`textarea_${group}_address`}
            value={getField(group, 'address')}
            onBlur={() => handleBlur(`${group}_address`)}
            onChange={(e) => updateField(group, 'address', e.target.value)}
            rows={2}
            className={`w-full bg-white/5 border rounded-lg focus:bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-all resize-none ${
              touched[`${group}_address`] && !getField(group, 'address').trim() ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500"
            }`}
            placeholder="Enter your full address"
          />
          {touched[`${group}_address`] && !getField(group, 'address').trim() && (
            <p className="text-xs text-red-400 font-sans">Address is required.</p>
          )}
        </div>

        {/* Dynamic Team Members / Additional Visitors Section */}
        {showTeamFields && (
          <div className="pt-8 mt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-[#22d3ee]">
                {group === 'visitor' ? 'Additional Visitors' : `Team Members (${totalMembers} Total • Leader + ${members.length} Teammates)`}
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
            
            <div
              id={`section_members_${group}`}
              className={`p-4 rounded-lg mb-6 border ${needsMore ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}
            >
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
                        className="text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Name <span className="text-violet-400">*</span></label>
                      <input
                        id={`input_member_${member.id}_name`}
                        type="text"
                        value={member.name}
                        onBlur={() => handleBlur(`member_${member.id}_name`)}
                        onChange={(e) => updateTeamMember(group, member.id, 'name', e.target.value)}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${
                          touched[`member_${member.id}_name`] && !member.name.trim()
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-violet-500"
                        }`}
                        placeholder="Enter full name"
                      />
                      {touched[`member_${member.id}_name`] && !member.name.trim() && (
                        <p className="text-xs text-red-400 font-sans">Name is required.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Institution Name <span className="text-violet-400">*</span></label>
                        <select
                          id={`select_member_${member.id}_institutionName`}
                          value={
                            member.institutionSelect ||
                            (member.institutionName === "JK Lakshmipat University"
                              ? "JK Lakshmipat University"
                              : member.institutionName
                              ? "other"
                              : "")
                          }
                          onBlur={() => handleBlur(`member_${member.id}_institutionName`)}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateTeamMember(group, member.id, 'institutionSelect', val);
                            if (val === "JK Lakshmipat University") {
                              updateTeamMember(group, member.id, 'institutionName', "JK Lakshmipat University");
                              const currentEmail = member.email || "";
                              const pfx = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
                              updateTeamMember(group, member.id, 'email', pfx ? `${pfx.replace(/\s+/g, '')}@jklu.edu.in` : "@jklu.edu.in");
                            } else if (val === "other") {
                              if (member.institutionName === "JK Lakshmipat University") {
                                updateTeamMember(group, member.id, 'institutionName', "");
                              }
                              const currentEmail = member.email || "";
                              if (currentEmail === "@jklu.edu.in") {
                                updateTeamMember(group, member.id, 'email', "");
                              } else if (currentEmail.endsWith("@jklu.edu.in")) {
                                updateTeamMember(group, member.id, 'email', currentEmail.replace("@jklu.edu.in", ""));
                              }
                            } else {
                              updateTeamMember(group, member.id, 'institutionName', "");
                              const currentEmail = member.email || "";
                              if (currentEmail === "@jklu.edu.in") {
                                updateTeamMember(group, member.id, 'email', "");
                              } else if (currentEmail.endsWith("@jklu.edu.in")) {
                                updateTeamMember(group, member.id, 'email', currentEmail.replace("@jklu.edu.in", ""));
                              }
                            }
                          }}
                          className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none cursor-pointer transition-all ${
                            touched[`member_${member.id}_institutionName`] && !member.institutionName.trim()
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-white/10 focus:border-violet-500"
                          }`}
                        >
                          <option value="" className="bg-[#020202]">Select Institution</option>
                          <option value="JK Lakshmipat University" className="bg-[#020202]">JK Lakshmipat University</option>
                          <option value="other" className="bg-[#020202]">Others</option>
                        </select>
                      </div>

                      {(member.institutionSelect === "other" ||
                        (!member.institutionSelect &&
                          member.institutionName &&
                          member.institutionName !== "JK Lakshmipat University")) && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="text-sm font-medium text-white/80">Enter Institution Name <span className="text-violet-400">*</span></label>
                          <input
                            id={`input_member_${member.id}_institutionName`}
                            type="text"
                            value={member.institutionName}
                            onBlur={() => handleBlur(`member_${member.id}_institutionName`)}
                            onChange={(e) => updateTeamMember(group, member.id, 'institutionName', e.target.value)}
                            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none placeholder-white/40 transition-all ${
                              touched[`member_${member.id}_institutionName`] && !member.institutionName.trim()
                                ? "border-red-500/50 focus:border-red-500"
                                : "border-white/10 focus:border-violet-500"
                            }`}
                            placeholder="Your school/college"
                            autoFocus
                          />
                        </div>
                      )}
                      {touched[`member_${member.id}_institutionName`] && !member.institutionName.trim() && (
                        <p className="text-xs text-red-400 font-sans">Institution name is required.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Mobile Number <span className="text-violet-400">*</span></label>
                      <input
                        id={`input_member_${member.id}_mobileNumber`}
                        type="tel"
                        value={member.mobileNumber}
                        onBlur={() => {
                          handleBlur(`member_${member.id}_mobileNumber`);
                          const cleaned = sanitizePhone(member.mobileNumber);
                          if (cleaned !== member.mobileNumber) {
                            updateTeamMember(group, member.id, 'mobileNumber', cleaned);
                          }
                        }}
                        onChange={(e) => updateTeamMember(group, member.id, 'mobileNumber', e.target.value)}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${
                          touched[`member_${member.id}_mobileNumber`] && !isValidPhone(member.mobileNumber)
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-violet-500"
                        }`}
                        placeholder="10-digit number"
                      />
                      {touched[`member_${member.id}_mobileNumber`] && !isValidPhone(member.mobileNumber) && (
                        <p className="text-xs text-red-400 font-sans">
                          {!member.mobileNumber.trim() ? "Mobile number is required." : "Please enter a valid 10-digit mobile number."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Gender <span className="text-violet-400">*</span></label>
                      <select
                        id={`select_member_${member.id}_gender`}
                        value={member.gender}
                        onBlur={() => handleBlur(`member_${member.id}_gender`)}
                        onChange={(e) => updateTeamMember(group, member.id, 'gender', e.target.value)}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none appearance-none transition-all cursor-pointer ${
                          touched[`member_${member.id}_gender`] && !member.gender
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-violet-500"
                        }`}
                      >
                        <option value="" className="bg-[#020202]">Select Gender</option>
                        <option value="male" className="bg-[#020202]">Male</option>
                        <option value="female" className="bg-[#020202]">Female</option>
                        <option value="other" className="bg-[#020202]">Other</option>
                      </select>
                      {touched[`member_${member.id}_gender`] && !member.gender && (
                        <p className="text-xs text-red-400 font-sans">Gender is required.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80">Age <span className="text-violet-400">*</span></label>
                      <input
                        id={`input_member_${member.id}_age`}
                        type="number"
                        value={member.age}
                        onBlur={() => handleBlur(`member_${member.id}_age`)}
                        onChange={(e) => updateTeamMember(group, member.id, 'age', e.target.value)}
                        className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${
                          touched[`member_${member.id}_age`] && !member.age.trim()
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-violet-500"
                        }`}
                        placeholder="e.g., 20"
                      />
                      {touched[`member_${member.id}_age`] && !member.age.trim() && (
                        <p className="text-xs text-red-400 font-sans">Age is required.</p>
                      )}
                    </div>

                    {(() => {
                      const isMemberJklu =
                        member.institutionName === "JK Lakshmipat University" ||
                        member.institutionSelect === "JK Lakshmipat University";
                      const memberEmail = member.email || "";
                      const prefix = memberEmail.endsWith("@jklu.edu.in")
                        ? memberEmail.slice(0, -"@jklu.edu.in".length)
                        : memberEmail.includes("@")
                        ? memberEmail.split("@")[0]
                        : memberEmail;

                      return (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">
                            Email {group !== 'visitor' && <span className="text-violet-400">*</span>}
                          </label>
                          {isMemberJklu ? (
                            <div className={`flex items-center w-full bg-black/40 border rounded-lg overflow-hidden transition-all ${
                              touched[`member_${member.id}_email`] && group !== 'visitor' && !isValidEmail(member.email)
                                ? "border-red-500/50 focus-within:border-red-500"
                                : "border-white/10 focus-within:border-violet-500"
                            }`}>
                              <input
                                id={`input_member_${member.id}_email`}
                                type="text"
                                value={prefix}
                                onBlur={() => handleBlur(`member_${member.id}_email`)}
                                onChange={(e) => {
                                  const cleanPrefix = e.target.value.replace(/@.*$/, '').replace(/\s+/g, '');
                                  updateTeamMember(group, member.id, 'email', cleanPrefix ? `${cleanPrefix}@jklu.edu.in` : "@jklu.edu.in");
                                }}
                                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:outline-none min-w-0"
                                placeholder="username / roll number"
                              />
                              <span className="px-3.5 py-3 bg-white/10 text-violet-300 font-medium text-sm border-l border-white/10 select-none whitespace-nowrap pointer-events-none flex items-center">
                                @jklu.edu.in
                              </span>
                            </div>
                          ) : (
                            <input
                              id={`input_member_${member.id}_email`}
                              type="email"
                              value={member.email}
                              onBlur={() => handleBlur(`member_${member.id}_email`)}
                              onChange={(e) => updateTeamMember(group, member.id, 'email', e.target.value.trim())}
                              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${
                                touched[`member_${member.id}_email`] && group !== 'visitor' && !isValidEmail(member.email)
                                  ? "border-red-500/50 focus:border-red-500"
                                  : "border-white/10 focus:border-violet-500"
                              }`}
                              placeholder="you@example.com"
                            />
                          )}
                          {touched[`member_${member.id}_email`] && group !== 'visitor' && !isValidEmail(member.email) && (
                            <p className="text-xs text-red-400 font-sans">
                              {!member.email.trim() ? "Email is required." : "Please enter a valid email address."}
                            </p>
                          )}
                        </div>
                      );
                    })()}

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
                            handleBlur(`member_${member.id}_idCard`);
                            handleIdCardUpload(
                              memberKey,
                              file,
                              (url, name) => {
                                updateTeamMember(group, member.id, 'idCard', url);
                                updateTeamMember(group, member.id, 'idCardName', name);
                              },
                              () => {
                                e.target.value = "";
                                updateTeamMember(group, member.id, 'idCard', null);
                              }
                            );
                          }}
                          className="hidden"
                        />
                        <label
                          id={`file_${group}_${member.id}_label`}
                          htmlFor={`file_${group}_${member.id}`}
                          className={`w-full bg-black/40 border rounded-lg px-4 py-3 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden ${
                            touched[`member_${member.id}_idCard`] && !member.idCard
                              ? "border-red-500/50 text-red-300"
                              : "border-white/10 text-white/60"
                          }`}
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
                      {touched[`member_${member.id}_idCard`] && !member.idCard && (
                        <p className="text-xs text-red-400 font-sans">Identity card image is required.</p>
                      )}
                      <p className="text-[10px] text-white/40 font-sans">Max size: 5MB (Images only: PNG, JPG, JPEG, WEBP)</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium text-white/80">Address <span className="text-violet-400">*</span></label>
                    <textarea
                      id={`textarea_member_${member.id}_address`}
                      value={member.address}
                      onBlur={() => handleBlur(`member_${member.id}_address`)}
                      onChange={(e) => updateTeamMember(group, member.id, 'address', e.target.value)}
                      rows={2}
                      className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none resize-none transition-all ${
                        touched[`member_${member.id}_address`] && !member.address.trim()
                          ? "border-red-500/50 focus:border-red-500"
                          : "border-white/10 focus:border-violet-500"
                      }`}
                      placeholder="Enter full address"
                    />
                    {touched[`member_${member.id}_address`] && !member.address.trim() && (
                      <p className="text-xs text-red-400 font-sans">Address is required.</p>
                    )}
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
                  "Activities - Gifts & Hampers",
                  "General Entry",
                ] as SabrangEvent["category"][]).map((category) => {
                  const categoryEvents = EVENTS.filter((e) => e.category === category);
                  if (categoryEvents.length === 0) return null;

                  const categoryLabel = 
                    category === "Flagship Events - Team" ? "Flagship Team" :
                    category === "Flagship Events - Solo / Duo" ? "Flagship Solo" :
                    category === "Non-Flagship - Esports" ? "E-Sports" :
                    category === "Non-Flagship - Other Events" ? "Competitions & Events" :
                    category === "Activities - Gifts & Hampers" ? "Activities (Per Head)" :
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
                                  {event.subtitle && (
                                    <p className="text-xs text-white/60 mb-2 font-sans">
                                      {event.subtitle}
                                    </p>
                                  )}
                                  {event.id === "visitor" && (
                                    <div className="mb-2.5">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                        <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        Does not include access to Pro-Nite and Concert
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3">
                                    {event.id === "visitor" ? (
                                      <span className="font-sans text-sm font-bold text-cyan-400">
                                        {isSelected
                                          ? `₹${calculateVisitorPassFee(visitorCount, visitorDays.length)} (₹69/day/person)`
                                          : "₹69 per person per day"}
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

                                    {/* View Details Button */}
                                    <Link
                                      href={`/events?event=${event.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 transition-all active:scale-95 group shadow-sm"
                                      title={`View ${event.title} details and rulebook`}
                                    >
                                      <span>View Details</span>
                                      <ExternalLink className="w-3 h-3 text-cyan-400 group-hover:text-cyan-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Link>
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
                                  {/* Important Notice */}
                                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-200 flex items-start gap-2">
                                    <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                    <div className="leading-relaxed">
                                      <span className="font-bold text-rose-300">Important Access Notice:</span> Visitor Pass grants daytime festival &amp; campus access only. It <strong className="text-rose-200 underline">does not include access to Pro-Nite and Concert</strong>.
                                    </div>
                                  </div>
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
                                      {visitorCount} visitor{visitorCount > 1 ? "s" : ""} × {visitorDays.length} day{visitorDays.length > 1 ? "s" : ""} @ ₹69/person/day
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
                    <div className="w-full text-[11px] text-rose-300/90 pt-1.5 border-t border-white/5 flex items-center gap-1.5 font-medium">
                      <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      Does not include access to Pro-Nite and Concert.
                    </div>
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

                  const membersCount = ev.isTeam ? totalMembers : 1;
                  const bankFee = getEventBandFee(ev, totalMembers, {
                    count: visitorCount,
                    days: visitorDays,
                  }, true);
                  const showBankFee = bankFee > 0;

                  return (
                    <div key={eventId} className="py-2 border-b border-white/5 last:border-0 space-y-2">
                      <div className="flex justify-between items-start text-white/90">
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            <span>{ev.title}</span>
                            <Link
                              href={`/events?event=${ev.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans group"
                              title={`View ${ev.title} details`}
                            >
                              <span>details</span>
                              <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                          <div className="text-[11px] text-white/40 font-sans">{ev.category}</div>
                          {eventId === "visitor" && (
                            <>
                              <div className="text-[11px] text-cyan-400 font-sans mt-0.5">
                                {visitorCount} attendee{visitorCount > 1 ? "s" : ""} • {visitorDays.length} day{visitorDays.length > 1 ? "s" : ""} ({visitorDays.map(d => FESTIVAL_DAYS.find(f => f.id === d)?.label).join(", ")})
                              </div>
                              <div className="text-[11px] text-rose-300 font-sans mt-0.5 font-medium">
                                Does not include access to Pro-Nite and Concert
                              </div>
                            </>
                          )}
                          {(eventId === "pronite_jklu" || eventId === "pronite_outsider") && (
                            <div className="text-[11px] text-amber-400 font-sans mt-0.5 font-medium">
                              Full-day access for all 3 days (Days 1, 2 & 3)
                            </div>
                          )}
                          {ev.isTeam && ev.extraMemberFee > 0 && totalMembers > ev.baseIncludedMembers && (
                            <div className="text-[11px] text-violet-400 font-sans mt-0.5">
                              Total Team: {totalMembers} members (incl. leader) • ({ev.baseIncludedMembers} base + {totalMembers - ev.baseIncludedMembers} extra @ ₹{isEarlyBirdActive && ev.earlyBirdExtraMemberFee !== undefined ? ev.earlyBirdExtraMemberFee : ev.extraMemberFee})
                            </div>
                          )}
                          {ev.isTeam && (ev.extraMemberFee === 0 || totalMembers <= ev.baseIncludedMembers) && (
                            <div className="text-[11px] text-white/50 font-sans mt-0.5">
                              Total Team: {totalMembers} members (incl. leader)
                            </div>
                          )}
                        </div>
                        <span className="font-sans text-sm font-bold text-violet-300">
                          {itemPrice === 0 ? "Free" : `₹ ${itemPrice}`}
                        </span>
                      </div>

                      {showBankFee && (
                        <div className="flex justify-between items-center text-xs font-sans pl-2.5 py-1.5 border-l-2 border-amber-400/50 bg-amber-400/10 rounded-r">
                          <span className="text-amber-300 font-medium">
                            Band Fee (Mandatory): 7 * {ev.id === "visitor" ? `${visitorCount} (person) * ${visitorDays.length} (day)` : `${membersCount} (no of person)`} =
                          </span>
                          <span className="font-bold font-sans text-amber-300">₹ {bankFee}</span>
                        </div>
                      )}
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
                        Coupon {promoCode} applied ({
                          couponData.discountType === 'fixed' 
                            ? `Special Price ₹${couponData.discountValue}` 
                            : couponData.discountType === 'per_head_cap'
                            ? `Cap ₹${couponData.discountValue}/head`
                            : `${couponData.discountValue}% Off`
                        })
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
                        <span>{calculateTotal() === 0 ? "Confirming Free Registration..." : "Connecting to Cashfree Gateway..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{calculateTotal() === 0 ? "Complete Free Registration" : `Proceed to Pay ₹${calculateTotal()}`}</span>
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
          <div className="flex flex-col gap-3 lg:hidden mt-6 border-t border-white/10 pt-4">
            {formErrorMessage && currentStep === "forms" && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{formErrorMessage}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
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
                disabled={currentStep === "select" ? selectedEvents.length === 0 : isProcessingPayment}
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
                    <span>{calculateTotal() === 0 ? "Complete Registration" : `Pay ₹${calculateTotal()}`}</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Sticky Selected Items Sidebar */}
      <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
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

                const membersCount = ev.isTeam ? totalMembers : 1;
                const bankFee = currentStep !== "select"
                  ? getEventBandFee(ev, totalMembers, { count: visitorCount, days: visitorDays }, true)
                  : 0;
                const showBankFee = bankFee > 0;

                return (
                  <div key={id} className="py-2 border-b border-white/5 last:border-0 space-y-1.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <div className="font-bold text-white uppercase tracking-wide">{ev.title}</div>
                        <div className="text-[10px] text-white/40 font-sans">
                          {id === "visitor"
                            ? `${visitorCount} Attendee${visitorCount > 1 ? "s" : ""} • ${visitorDays.length} Day${visitorDays.length > 1 ? "s" : ""}`
                            : ev.category}
                        </div>
                      </div>
                      <span className="font-sans text-cyan-400 font-bold text-xs shrink-0">
                        {price === 0 ? "Free" : ev.isTeam ? `Team ₹${price}` : `₹${price}`}
                      </span>
                    </div>

                    {showBankFee && (
                      <div className="flex justify-between items-center text-[11px] font-sans pl-2 border-l-2 border-amber-400/50 py-0.5 bg-amber-400/10 rounded-r">
                        <span className="text-amber-300 font-medium">
                          Band Fee (Mandatory): 7 * {ev.id === "visitor" ? `${visitorCount} (person) * ${visitorDays.length} (day)` : `${membersCount} (no of person)`} =
                        </span>
                        <span className="font-bold font-sans text-amber-300 shrink-0">
                          ₹{bankFee}
                        </span>
                      </div>
                    )}
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
              {formErrorMessage && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{formErrorMessage}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
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

        {/* Event Coordinators Dropdown Menu */}
        <RegistrationCoordinatorsDropdown />
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
                    href={`/api/receipt?id=${encodeURIComponent(verifiedOrder.registrationId)}&order_id=${encodeURIComponent(verifiedOrder.orderId)}${verifiedOrder.token ? `&token=${encodeURIComponent(verifiedOrder.token)}` : ''}`}
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
