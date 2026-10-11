'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Plus, Trash2, ShieldAlert, Power, PowerOff, AlertCircle, QrCode } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../../../lib/firebase';

export default function ScannerAccounts() {
  const [scanners, setScanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedScanner, setSelectedScanner] = useState<any>(null);

  // Form state
  const [volunteerName, setVolunteerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'scannerAccounts')),
      (snap) => {
        setScanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerName) return;
    if (scanners.length >= 5) {
      alert('Maximum of 5 scanner accounts allowed.');
      return;
    }
    setIsSubmitting(true);
    
    let secondaryApp;
    try {
      const generateSecurePassword = (length = 8): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
      };

      const generateSecureScannerId = (): string => {
        const array = new Uint16Array(1);
        window.crypto.getRandomValues(array);
        const num = array[0] % 10000;
        return `SCAN-${String(num).padStart(4, '0')}`;
      };

      const generatedEmail = `scanner_${Date.now()}@sabrang.com`;
      const generatedPassword = generateSecurePassword(8);
      
      // Initialize a secondary app to create a user without signing out the admin
      const secondaryAppName = `secondary_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, generatedEmail, generatedPassword);
      const uid = userCredential.user.uid;
      
      const newScannerId = generateSecureScannerId();
      
      await setDoc(doc(db, 'scannerAccounts', uid), {
        scannerId: newScannerId,
        volunteerName,
        email: generatedEmail,
        createdAt: new Date(),
        lastActiveAt: null,
        status: 'Active'
      });
      
      await setDoc(doc(db, 'roles', uid), {
        role: 'scanner'
      });

      await logAdminAction('CREATE_SCANNER', `scannerAccounts/${uid}`, `Created scanner for ${volunteerName}`);
      
      setIsCreateOpen(false);
      setVolunteerName('');
      alert(`Account created!\nEmail: ${generatedEmail}\nPassword: ${generatedPassword}\nPlease copy these credentials.`);
    } catch (err: any) {
      console.error(err);
      alert(`Error creating scanner: ${err.message}`);
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (scanner: any) => {
    const newStatus = scanner.status === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'scannerAccounts', scanner.id), { status: newStatus });
    await logAdminAction('TOGGLE_SCANNER_STATUS', `scannerAccounts/${scanner.id}`, `Changed status to ${newStatus}`);
  };

  const handleDelete = async () => {
    if (!selectedScanner) return;
    try {
      await deleteDoc(doc(db, 'scannerAccounts', selectedScanner.id));
      await deleteDoc(doc(db, 'roles', selectedScanner.id));
      await logAdminAction('DELETE_SCANNER', `scannerAccounts/${selectedScanner.id}`, `Deleted scanner account`);
      setIsDeleteOpen(false);
      setSelectedScanner(null);
    } catch (err) {
      alert('Error deleting scanner');
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scanner Accounts</h1>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          disabled={scanners.length >= 5}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
            scanners.length >= 5 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-900'
          }`}
        >
          <Plus size={15} /> <span>Add Scanner Account</span>
        </button>
      </div>

      {scanners.length >= 5 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-3 text-xs font-medium">
          <AlertCircle size={18} className="text-amber-700 shrink-0" />
          <p>Scanner account quota reached (5/5 accounts). Remove an inactive account to provision a new operator pass.</p>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4">Scanner ID</th>
                  <th className="p-4">Operator Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scanners.map((scanner, idx) => (
                  <tr key={scanner.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-900">{scanner.scannerId}</td>
                    <td className="p-4 font-medium text-slate-800">{scanner.volunteerName || 'Operator'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        scanner.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {scanner.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {scanner.lastActiveAt ? scanner.lastActiveAt.toDate().toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(scanner)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={scanner.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      >
                        {scanner.status === 'Active' ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                      <button 
                        onClick={() => { setSelectedScanner(scanner); setIsDeleteOpen(true); }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {scanners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                      No scanner accounts registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Provision Scanner Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Assigned Operator Name</label>
            <input 
              type="text" 
              required
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs shadow-xs cursor-pointer disabled:opacity-40">
              {isSubmitting ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Revoke Scanner Access">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-800 bg-rose-50 p-4 rounded-xl border border-rose-200">
            <ShieldAlert size={20} className="text-rose-600 shrink-0" />
            <p className="text-xs">Are you sure you want to delete the scanner account for <strong>{selectedScanner?.volunteerName}</strong>? This operator will immediately lose scan authorization.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setIsDeleteOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs shadow-xs cursor-pointer">
              Revoke Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
