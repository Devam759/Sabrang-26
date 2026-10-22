"use client";

import React, { useEffect, useState } from "react";
import { ShaderBackground } from "@/components/ui/neuro-noise";
import CheckoutForm from "@/components/auth/CheckoutForm";
import UnlockExperience from "@/components/register/UnlockExperience";

export default function RegisterClient() {
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    // If redirected back from Cashfree with order_id, or coming with pre-selected events, show form immediately
    const params = new URLSearchParams(window.location.search);
    if (params.get('order_id') || params.get('event') || params.get('events') || params.get('cart')) {
      setShowForm(true);
    }
  }, []);

  if (!showForm) {
    return <UnlockExperience onBagIt={() => setShowForm(true)} />;
  }

  return (
    <div className="relative z-[35] min-h-screen bg-[#020202] text-white font-sans selection:bg-cyan-500/30">
      {/* Background ambient layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <ShaderBackground className="absolute inset-0" />
      </div>

      {/* Main Full-Width Checkout Container */}
      <div className="relative z-10 w-full min-h-screen">
        <CheckoutForm />
      </div>
    </div>
  );
}
