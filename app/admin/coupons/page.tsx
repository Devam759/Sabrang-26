'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, query, getDocs, where, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Coupon, CouponDiscountType } from '../../../lib/types';
import { Plus, Tag, Check, X, Edit3, Trash2, Power, AlertCircle, Percent, DollarSign, Calendar, Layers, Sparkles } from 'lucide-react';

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
  const [discountValue, setDiscountValue] = useState<number | ''>(20);
  const [applyToAllEvents, setApplyToAllEvents] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
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
          discountValue: data.discountValue ?? (data.discountType === 'percentage' ? (data.discountPercentage ?? 0) : (data.amount ?? 0)),
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

  // 2. Fetch live events list from Firestore
  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      if (!snap.empty) {
        const dbEvents = snap.docs.map(d => ({
          id: d.id,
          title: d.data().title || d.id,
        }));
        
        // Merge with defaults to ensure all flagship events are selectable
        const merged = [...dbEvents];
        DEFAULT_SABRANG_EVENTS.forEach(defEvt => {
          if (!merged.some(e => e.title.toLowerCase() === defEvt.title.toLowerCase())) {
            merged.push(defEvt);
          }
        });
        setAvailableEvents(merged);
      }
    }, (err) => {
      console.warn("Coupons events listener notice:", err?.message);
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
    setDiscountValue(20);
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
    setDiscountValue(coupon.discountValue ?? (type === 'percentage' ? (coupon.discountPercentage ?? 0) : (coupon.amount ?? 0)));
    
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
    
    setMaxUses(coupon.maxUses !== undefined ? coupon.maxUses : '');
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

      if (!isEditing) {
        couponPayload.createdAt = serverTimestamp();
        couponPayload.usedCount = 0;
        await setDoc(doc(db, 'coupons', cleanCode), couponPayload);
        await logAdminAction(
          'CREATE_COUPON',
          'coupons',
          `Created coupon ${cleanCode}: ${discountType === 'percentage' ? `${discountValue}% OFF` : `Fixed ₹${discountValue}`} for [${applicableEventsList.join(', ')}]`
        );
      } else {
        const targetId = (currentCouponId || cleanCode).trim().toLowerCase();
        await updateDoc(doc(db, 'coupons', targetId), couponPayload);
        await logAdminAction(
          'UPDATE_COUPON',
          'coupons',
          `Updated coupon ${targetId}: ${discountType === 'percentage' ? `${discountValue}% OFF` : `Fixed ₹${discountValue}`} for [${applicableEventsList.join(', ')}]`
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
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] mt-2 font-semibold">Promotional Discounts</p>
        </div>
        <button 
          onClick={openAddModal}
          className="group inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
        >
          <Plus size={15} className="text-slate-700 group-hover:text-slate-900 transition-colors" /> Create Coupon
        </button>
      </div>

      
      <div className="bg-white backdrop-blur-[40px] border border-slate-200 rounded-[24px] p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group hover:bg-white/[0.07] transition-all duration-500">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-white rounded-full blur-[60px] -translate-y-1/2 -translate-x-1/2 pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-light tracking-wide text-slate-900 flex items-center gap-3 font-space-grotesk">
             Global Early Bird
          </h2>
          <p className="text-[11px] text-slate-500 mt-2 font-medium tracking-wide max-w-lg leading-relaxed">
            Enable or disable Early Bird pricing across all events. When enabled, original prices will be shown cut out next to the early bird prices.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/80 px-5 py-3 rounded-[16px] border border-slate-200 shadow-sm relative z-10">
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isEarlyBirdActive ? 'text-slate-600' : 'text-slate-500'}`}>
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
                <tr className="bg-white/80 border-b border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                  <th className="p-5 w-16 text-center">S.No</th>
                  <th className="p-5">Coupon Code</th>
                  <th className="p-5">Discount Type & Value</th>
                  <th className="p-5">Applicable Events</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {coupons.map((coupon, idx) => {
                  const isPercentage = coupon.discountType === 'percentage';
                  const isAllEvents = !coupon.applicableEvents || coupon.applicableEvents.length === 0 || coupon.applicableEvents.includes('ALL') || coupon.applicableEvents.includes('*');

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition-colors font-medium group">
                      <td className="p-5 text-center text-slate-400 font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-600" />
                          <span className="font-bold text-slate-900 text-sm font-mono tracking-widest">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          isPercentage ? 'bg-white text-slate-600 border border-slate-200' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {isPercentage ? <Percent size={12} /> : <DollarSign size={12} />}
                          {isPercentage ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {isAllEvents ? (
                            <span className="inline-flex items-center gap-1 bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wider font-bold">
                              All Events
                            </span>
                          ) : (
                            coupon.applicableEvents?.map((evt: string) => (
                              <span key={evt} className="inline-flex items-center gap-1 bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wider font-bold truncate max-w-[120px]">
                                {evt}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] ${
                          coupon.active 
                            ? 'bg-white text-slate-600 border border-slate-200' 
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${coupon.active ? 'bg-white0' : 'bg-slate-100'}`}></span>
                          {coupon.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button 
                          onClick={() => openEditModal(coupon)}
                          title="Edit Coupon"
                          className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(coupon.id || coupon.code, coupon.active)}
                          title={coupon.active ? 'Disable Coupon' : 'Enable Coupon'}
                          className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                            coupon.active 
                              ? 'border-slate-200 text-slate-500 hover:text-slate-600 hover:bg-white hover:border-slate-200' 
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-green-500/20'
                          }`}
                        >
                          <Power size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id || coupon.code)}
                          title="Delete Coupon"
                          className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-white hover:border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <Tag className="mx-auto h-8 w-8 mb-3 opacity-50" />
                      <p className="font-bold text-sm">No coupons found.</p>
                      <p className="text-[10px] mt-1 uppercase tracking-widest">Create one to get started.</p>
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
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">Coupon Code (Uppercase)</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EARLYBIRD20, DEV100"
              disabled={isEditing}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono font-bold text-slate-900 placeholder-white/20 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">Discount Type</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500/50 appearance-none"
              >
                <option value="fixed" className="bg-[#1a1525]">Fixed Amount (₹)</option>
                <option value="percentage" className="bg-[#1a1525]">Percentage (%)</option>
              </select>
            </div>
            
            {/* Value */}
            <div>
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">Discount Value</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold text-xs">{discountType === 'fixed' ? '₹' : '%'}</span>
                </div>
                <input 
                  type="number" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min="0"
                  className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em] mb-2">Usage Limit (0 for unlimited)</label>
            <input 
              type="number" 
              value={maxUses} 
              onChange={(e) => setMaxUses(Number(e.target.value))}
              min="0"
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Applicable Events Multi-Select */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-[0.25em]">Applicable Events</label>
              <button 
                onClick={() => {
                  if (selectedEvents.length === availableEvents.length || applyToAllEvents) {
                    setApplyToAllEvents(false);
                    clearEventSelection();
                  } else {
                    setApplyToAllEvents(false);
                    selectAllEvents();
                  }
                }}
                className="text-[10px] text-slate-600 hover:text-slate-600 font-bold uppercase tracking-widest cursor-pointer"
              >
                {selectedEvents.includes('ALL') ? 'Clear All' : 'Select All'}
              </button>
            </div>
            
            <div className="bg-white/80 border border-slate-200 rounded-xl p-3 shadow-inner">
              
              {/* Event Search inside Modal */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search events to apply coupon..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-900 placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {selectedEvents.includes('ALL') ? (
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 gap-2 mb-2">
                  
                  <span className="text-xs font-bold uppercase tracking-widest">Valid for all global events</span>
                </div>
              ) : (
                /* Event Checkboxes */
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 custom-scrollbar">
                  {filteredEventOptions.map((evt) => {
                    const isChecked = selectedEvents.includes(evt.title) || selectedEvents.includes(evt.id);

                    return (
                      <label
                        key={evt.id}
                        className={`flex items-center gap-3 p-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-500/20 text-slate-600 font-bold border border-purple-500/30' : 'hover:bg-white text-slate-700 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setApplyToAllEvents(false);
                            toggleEventSelection(evt.title);
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-white/90 border-slate-300"
                        />
                        <span className="truncate">{evt.title}</span>
                      </label>
                    );
                  })}
                  {filteredEventOptions.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                      No events match search.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSaveCoupon}
            className="w-full bg-white hover:bg-white/90 text-black py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {isEditing ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </Modal>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
}
