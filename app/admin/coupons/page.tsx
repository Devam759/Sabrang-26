"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Coupon } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminCoupons() {
  const { role, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: 10,
    expiryDate: "",
    active: true,
  });

  useEffect(() => {
    if (!authLoading && role === "admin") {
      fetchCoupons();
    }
  }, [authLoading, role]);

  const fetchCoupons = async () => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setCoupons(
      querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Coupon,
      ),
    );
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        expiryDate: new Date(formData.expiryDate),
        createdAt: serverTimestamp(),
      };

      if (editingCoupon) {
        await updateDoc(doc(db, "coupons", editingCoupon.id!), data);
        alert("Coupon updated!");
      } else {
        await addDoc(collection(db, "coupons"), data);
        alert("Coupon created!");
      }

      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert("Error saving coupon.");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercentage: 10,
      expiryDate: "",
      active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      expiryDate: new Date((coupon.expiryDate as any).seconds * 1000)
        .toISOString()
        .slice(0, 16),
      active: coupon.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteDoc(doc(db, "coupons", id));
      fetchCoupons();
    }
  };

  if (authLoading || loading) return <div>Loading...</div>;
  if (role !== "admin") return <div>Unauthorized</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discount Coupons</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700"
          >
            Create Coupon
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-12">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-md font-mono uppercase"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount %
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                className="w-full p-2 border rounded-md"
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercentage: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Expiry Date
              </label>
              <input
                type="datetime-local"
                required
                className="w-full p-2 border rounded-md"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active & Redeemable
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-8 py-2 rounded-lg font-bold"
              >
                {editingCoupon ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase">
                Code
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase">
                Discount
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase">
                Expiry
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 font-mono font-bold text-purple-600">
                  {coupon.code}
                </td>
                <td className="px-6 py-4 font-bold">
                  {coupon.discountPercentage}% OFF
                </td>
                <td className="px-6 py-4">{formatDate(coupon.expiryDate)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${coupon.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {coupon.active ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="text-indigo-600 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id!)}
                    className="text-red-600 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
