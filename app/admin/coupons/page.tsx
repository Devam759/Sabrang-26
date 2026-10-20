'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, query, getDocs, where, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Coupon, CouponDiscountType } from '../../../lib/types';
import { Plus, Tag, Check, X, Edit3, Trash2, Power, AlertCircle, Percent, Calendar, Layers, Sparkles } from 'lucide-react';

import { OFFICIAL_EVENTS } from '@/lib/eventPricing';

const DEFAULT_SABRANG_EVENTS = OFFICIAL_EVENTS.map(e => ({
  id: e.id,
  title: `${e.title} (${e.category})`,
}));

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [availableEvents, setAvailableEvents] = useState<{ id: string; title: string }[]>(DEFAULT_SABRANG_EVENTS);
  const [loading, setLoading] = useState(true);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState<string | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [applyToAllEvents, setApplyToAllEvents] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [specialOfferDesc, setSpecialOfferDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [isEarlyBirdActive, setIsEarlyBirdActive] = useState(false);

  
  // Fetch Early Bird Settings
  useEffect(() => {
    const unsubEarlyBird = onSnapshot(doc(db, 'settings', 'earlyBird'), (snap) => {
      if (snap.exists()) {
        setIsEarlyBirdActive(snap.data()?.active || false);
      }
    }, (err) => {
      console.warn('earlyBird listener err:', err?.message);
    });
    return () => unsubEarlyBird();
  }, []);

  const handleToggleEarlyBird = async () => {
    if (!confirm(`Are you sure you want to ${isEarlyBirdActive ? 'close' : 'activate'} the Early Bird offer globally?`)) return;
    try {
      await setDoc(doc(db, 'settings', 'earlyBird'), { active: !isEarlyBirdActive }, { merge: true });
      await logAdminAction('UPDATE_SETTINGS', 'settings', `${!isEarlyBirdActive ? 'Activated' : 'Closed'} Early Bird Offer`);
    } catch (err) {
      console.error(err);
      alert('Failed to update Early Bird status.');
    }
  };

  // 1. Fetch live coupons from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      const fetched: Coupon[] = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code || docSnap.id,
          discountType: data.discountType || (data.discountPercentage !== undefined ? 'percentage' : 'fixed'),
          discountValue: data.discountValue ?? (
            data.discountType === 'percentage' 
              ? (data.discountPercentage ?? 0) 
              : data.discountType === 'per_head_cap'
              ? (data.perHeadCap ?? 0)
              : (data.amount ?? 0)
          ),
          perHeadCap: data.perHeadCap,
          amount: data.amount,
          discountPercentage: data.discountPercentage,
          applicableEvents: data.applicableEvents || ['ALL'],
          expiryDate: data.expiryDate,
          maxUses: data.maxUses,
          usedCount: data.usedCount || 0,
          active: data.active !== false,
          isSpecialOffer: data.isSpecialOffer,
          specialOfferDesc: data.specialOfferDesc,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Coupon;
      });

      // Sort by newest first
      fetched.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
        const timeB = (b.createdAt as any)?.toMillis?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
        return timeB - timeA;
      });

      setCoupons(fetched);
      setLoading(false);
    }, (err) => { console.warn("coupons listener err:", err?.message); setLoading(false); });

    return () => unsub();
  }, []);

  // 2. Fetch live events list, deduplicating against the official catalog
  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      // Start with official catalog as the primary, clean list
      const list = [...DEFAULT_SABRANG_EVENTS];

      if (!snap.empty) {
        snap.docs.forEach(d => {
          const rawTitle = (d.data().title || d.id).trim();
          const cleanKey = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Check if this db event already corresponds to an official catalog event
          const isDuplicate = list.some(def => {
            const defKey = def.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const defId = def.id.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              defKey === cleanKey ||
              cleanKey === defId ||
              defKey.includes(cleanKey) ||
              cleanKey.includes(defId) ||
              (cleanKey.includes('panache') && defKey.includes('panache')) ||
              (cleanKey.includes('bandjam') && defKey.includes('bandjam')) ||
              (cleanKey.includes('stepup') && defKey.includes('stepup')) ||
              (cleanKey.includes('valorant') && defKey.includes('valorant')) ||
              (cleanKey.includes('gunj') && defKey.includes('echoes'))
            );
          });

          // Only append if it's truly a new non-catalog event
          if (!isDuplicate) {
            list.push({ id: d.id, title: rawTitle });
          }
        });
      }

      setAvailableEvents(list);
    }, (err) => {
      console.warn("Coupons events listener notice:", err?.message);
      setAvailableEvents(DEFAULT_SABRANG_EVENTS);
    });

    return () => unsubEvents();
  }, []);

  // Filtered events for multi-select search
  const filteredEventOptions = useMemo(() => {
    if (!eventSearch.trim()) return availableEvents;
    const q = eventSearch.toLowerCase();
    return availableEvents.filter(e => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
  }, [availableEvents, eventSearch]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentCouponId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setApplyToAllEvents(true);
    setSelectedEvents([]);
    setExpiryDate('');
    setMaxUses('');
    setIsActive(true);
    setIsSpecialOffer(false);
    setSpecialOfferDesc('');
    setEventSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setIsEditing(true);
    setCurrentCouponId(coupon.id || coupon.code);
    setCode(coupon.code);
    const type: CouponDiscountType = coupon.discountType || (coupon.discountPercentage !== undefined ? 'percentage' : 'fixed');
    setDiscountType(type);
    const rawVal = coupon.discountValue ?? (
      type === 'percentage' 
        ? coupon.discountPercentage 
        : type === 'per_head_cap'
        ? coupon.perHeadCap 
        : coupon.amount
    );
    setDiscountValue(rawVal !== undefined && rawVal !== null ? String(rawVal) : '');
    
    const isAll = !coupon.applicableEvents || coupon.applicableEvents.length === 0 || coupon.applicableEvents.includes('ALL') || coupon.applicableEvents.includes('*');
    setApplyToAllEvents(isAll);
    setSelectedEvents(isAll ? [] : (coupon.applicableEvents || []));
    
    if (coupon.expiryDate) {
      try {
        const d = coupon.expiryDate instanceof Date 
          ? coupon.expiryDate 
          : (typeof (coupon.expiryDate as any)?.toDate === 'function' ? (coupon.expiryDate as any).toDate() : new Date(coupon.expiryDate as any));
        setExpiryDate(d.toISOString().split('T')[0]);
      } catch {
        setExpiryDate('');
      }
    } else {
      setExpiryDate('');
    }
    
    setMaxUses(coupon.maxUses !== undefined && coupon.maxUses !== null ? String(coupon.maxUses) : '');
    setIsActive(coupon.active);
    setIsSpecialOffer(coupon.isSpecialOffer || false);
    setSpecialOfferDesc(coupon.specialOfferDesc || '');
    setEventSearch('');
    setIsModalOpen(true);
  };

  const toggleEventSelection = (eventTitleOrId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventTitleOrId)) {
        return prev.filter(e => e !== eventTitleOrId);
      } else {
        return [...prev, eventTitleOrId];
      }
    });
  };

  const selectAllEvents = () => {
    setSelectedEvents(availableEvents.map(e => e.title));
  };

  const clearEventSelection = () => {
    setSelectedEvents([]);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toLowerCase();

    if (!cleanCode) return alert('Please enter a coupon code.');
    if (discountValue === '' || Number(discountValue) < 0) return alert('Please enter a valid non-negative value.');

    if (discountType === 'percentage' && (Number(discountValue) < 0 || Number(discountValue) > 100)) {
      return alert('Percentage discount must be between 0% and 100%.');
    }

    if (discountType === 'per_head_cap' && Number(discountValue) <= 0) {
      return alert('Per head cap must be greater than 0.');
    }

    if (!applyToAllEvents && selectedEvents.length === 0) {
      return alert('Please select at least one applicable event or choose "Apply to All Events".');
    }

    const applicableEventsList = applyToAllEvents ? ['ALL'] : selectedEvents;

    setIsSubmitting(true);
    try {
      const couponPayload: any = {
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        applicableEvents: applicableEventsList,
        active: isActive,
        isSpecialOffer,
        specialOfferDesc: isSpecialOffer ? specialOfferDesc.trim() : null,
        updatedAt: serverTimestamp(),
      };

      if (discountType === 'fixed') {
        couponPayload.amount = Number(discountValue);
      }
      if (discountType === 'percentage') {
        couponPayload.discountPercentage = Number(discountValue);
      }
      if (discountType === 'per_head_cap') {
        couponPayload.perHeadCap = Number(discountValue);
      }

      if (expiryDate) {
        couponPayload.expiryDate = new Date(expiryDate);
      } else {
        couponPayload.expiryDate = null;
      }

      if (maxUses !== '') {
        couponPayload.maxUses = Number(maxUses);
      }

      if (isSpecialOffer) {
        // Query other coupons and set isSpecialOffer to false
        const snapshot = await getDocs(query(collection(db, 'coupons'), where('isSpecialOffer', '==', true)));
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
          if (docSnap.id !== (isEditing ? (currentCouponId || cleanCode).trim().toLowerCase() : cleanCode)) {
            batch.update(docSnap.ref, { isSpecialOffer: false });
          }
        });
        await batch.commit();
      }

      const discountLabel = discountType === 'percentage' 
        ? `${discountValue}% OFF` 
        : discountType === 'per_head_cap'
        ? `Cap ₹${discountValue}/head`
        : `Fixed ₹${discountValue}`;

      if (!isEditing) {
        couponPayload.createdAt = serverTimestamp();
        couponPayload.usedCount = 0;
        await setDoc(doc(db, 'coupons', cleanCode), couponPayload);
        await logAdminAction(
          'CREATE_COUPON',
          'coupons',
          `Created coupon ${cleanCode}: ${discountLabel} for [${applicableEventsList.join(', ')}]`
        );
      } else {
        const targetId = (currentCouponId || cleanCode).trim().toLowerCase();
        await updateDoc(doc(db, 'coupons', targetId), couponPayload);
        await logAdminAction(
          'UPDATE_COUPON',
          'coupons',
          `Updated coupon ${targetId}: ${discountLabel} for [${applicableEventsList.join(', ')}]`
        );
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      alert(`Failed to save coupon: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this coupon?`)) return;

    try {
      await updateDoc(doc(db, 'coupons', id), {
        active: !currentStatus,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('UPDATE_COUPON', 'coupons', `${!currentStatus ? 'Enabled' : 'Disabled'} coupon: ${id}`);
    } catch (error) {
      console.error("Error toggling coupon:", error);
      alert('Failed to update coupon status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${id}"?`)) return;

    try {
      await deleteDoc(doc(db, 'coupons', id));
      await logAdminAction('DELETE_COUPON', 'coupons', `Deleted coupon: ${id}`);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert('Failed to delete coupon.');
    }
  };


  return (
    <div className="space-y-8 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 font-space-grotesk">Coupons</h1>
        </div>
        <button 
          onClick={openAddModal}
          className="group inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
        >
          <Plus size={15} className="text-white" /> Create Coupon
        </button>
      </div>

      
      <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group hover:bg-white/[0.07] transition-all duration-500">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-white rounded-full blur-[60px] -translate-y-1/2 -translate-x-1/2 pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />
        
        <div className="relative z-10 flex-1">
          <h2 className="text-2xl font-light tracking-wide text-slate-900 flex items-center gap-3 font-space-grotesk">
             Global Early Bird
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed max-w-2xl">
            Enable or disable Early Bird pricing across all events. When enabled, original prices will be shown cut out next to the early bird prices.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/80 px-5 py-3 rounded-[16px] border border-slate-200 shadow-sm relative z-10">
          <span className={`text-xs font-semibold ${isEarlyBirdActive ? 'text-emerald-700' : 'text-slate-500'}`}>
            {isEarlyBirdActive ? 'Active' : 'Closed'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEarlyBirdActive}
              onChange={handleToggleEarlyBird}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 border border-slate-200"></div>
          </label>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4 whitespace-nowrap">Discount Type & Value</th>
                  <th className="p-4">Applicable Events</th>
                  <th className="p-4 whitespace-nowrap">Use Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {coupons.map((coupon, idx) => {
                  const isPercentage = coupon.discountType === 'percentage';
                  const isAllEvents = !coupon.applicableEvents || coupon.applicableEvents.length === 0 || coupon.applicableEvents.includes('ALL') || coupon.applicableEvents.includes('*');

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors font-medium group">
                      <td className="p-4 text-center text-slate-400 font-medium font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                          <span className="font-bold text-slate-900 text-sm font-mono tracking-wide">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                          coupon.discountType === 'percentage' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : coupon.discountType === 'per_head_cap'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {coupon.discountType === 'percentage' && <Percent size={11} className="stroke-[2.5]" />}
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% off` 
                            : coupon.discountType === 'per_head_cap'
                            ? `Cap ₹${coupon.discountValue} / head`
                            : `Pay ₹${coupon.discountValue} (Fixed)`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {isAllEvents ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                              All Events
                            </span>
                          ) : (
                            (() => {
                              const uniqueBadges = Array.from(new Set(
                                (coupon.applicableEvents || []).map((evt: string) => {
                                  const cleanEvt = evt.trim();
                                  const matched = OFFICIAL_EVENTS.find(e => 
                                    e.id.toLowerCase() === cleanEvt.toLowerCase() ||
                                    e.title.toLowerCase() === cleanEvt.toLowerCase() ||
                                    (cleanEvt.toLowerCase().includes('gunj') && e.id === 'echoes_of_noor')
                                  );
                                  return matched ? `${matched.title} (${matched.category})` : cleanEvt;
                                })
                              ));

                              return uniqueBadges.map((displayTitle) => (
                                <span 
                                  key={displayTitle} 
                                  title={displayTitle}
                                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-medium whitespace-normal break-words leading-tight"
                                >
                                  {displayTitle}
                                </span>
                              ));
                            })()
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                            coupon.maxUses && (coupon.usedCount || 0) >= Number(coupon.maxUses)
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : (coupon.usedCount || 0) > 0
                              ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <span>{coupon.usedCount || 0}</span>
                            {coupon.maxUses ? <span className="text-slate-400 font-normal">/ {coupon.maxUses}</span> : null}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {coupon.maxUses 
                              ? ((coupon.usedCount || 0) >= Number(coupon.maxUses) ? 'maxed' : 'used')
                              : ((coupon.usedCount || 0) === 1 ? 'time' : 'times')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          coupon.active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${coupon.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {coupon.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(coupon)}
                            title="Edit Coupon"
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleToggleActive(coupon.id || coupon.code, coupon.active)}
                            title={coupon.active ? 'Disable Coupon' : 'Enable Coupon'}
                            className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                              coupon.active 
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' 
                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                            }`}
                          >
                            <Power size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon.id || coupon.code)}
                            title="Delete Coupon"
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <Tag className="mx-auto h-8 w-8 mb-3 opacity-50" />
                      <p className="font-semibold text-sm text-slate-700">No coupons found.</p>
                      <p className="text-xs text-slate-500 mt-1">Create one to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? 'Edit Promotional Coupon' : 'Create New Coupon'}
      >
        <div className="space-y-5">
          {/* Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Coupon Code</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EARLYBIRD20, DEV100"
              disabled={isEditing}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Discount Type</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="fixed">Fixed Final Price (Pay exact ₹)</option>
                <option value="percentage">Percentage Discount (%)</option>
                <option value="per_head_cap">Cap on Per Head Fee (₹)</option>
              </select>
            </div>
            
            {/* Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {discountType === 'per_head_cap' 
                  ? 'Per Head Cap (₹)' 
                  : discountType === 'fixed' 
                  ? 'Final Price to Pay (₹)' 
                  : 'Discount Percentage (%)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-semibold text-sm">{discountType === 'percentage' ? '%' : '₹'}</span>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={discountValue} 
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                    setDiscountValue(clean);
                  }}
                  placeholder={discountType === 'per_head_cap' ? 'e.g. 350' : discountType === 'percentage' ? 'e.g. 20' : 'e.g. 80 (user pays ₹80)'}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-8 pr-3.5 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Contextual Helper Note for Fixed Price */}
          {discountType === 'fixed' && (
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 -mt-2">
              <span className="font-semibold text-slate-700">Fixed Final Price:</span> The customer will pay <strong>₹{discountValue || 'X'}</strong> as their total ticket price, regardless of the original price.
            </p>
          )}

          {/* Usage Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Usage Limit (optional)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={maxUses} 
              onChange={(e) => {
                const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                setMaxUses(clean);
              }}
              placeholder="Leave empty for unlimited"
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Applicable Events Multi-Select */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Applicable Events</label>
              <button 
                type="button"
                onClick={() => {
                  if (selectedEvents.length === availableEvents.length || applyToAllEvents) {
                    setApplyToAllEvents(false);
                    clearEventSelection();
                  } else {
                    setApplyToAllEvents(false);
                    selectAllEvents();
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                {selectedEvents.includes('ALL') ? 'Clear all' : 'Select all'}
              </button>
            </div>
            
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3">
              
              {/* Event Search inside Modal */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search events to apply coupon..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>

              {selectedEvents.includes('ALL') ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 gap-2 mb-2">
                  <span className="text-xs font-semibold">Valid for all events</span>
                </div>
              ) : (
                /* Event Checkboxes */
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 custom-scrollbar">
                  {filteredEventOptions.map((evt) => {
                    const isChecked = selectedEvents.includes(evt.title) || selectedEvents.includes(evt.id) ||
                      selectedEvents.some(s => {
                        const sKey = s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const eKey = evt.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const eId = evt.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return sKey && (sKey === eKey || sKey === eId || (sKey.includes('gunj') && eKey.includes('echoes')));
                      });

                    return (
                      <label
                        key={evt.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200' : 'hover:bg-white text-slate-700 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setApplyToAllEvents(false);
                            toggleEventSelection(evt.title);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300"
                        />
                        <span className="truncate">{evt.title}</span>
                      </label>
                    );
                  })}
                  {filteredEventOptions.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-xs font-medium">
                      No events match search.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSaveCoupon}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            {isEditing ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </Modal>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
}
