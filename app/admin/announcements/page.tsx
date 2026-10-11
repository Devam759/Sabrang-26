'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Plus, Trash2, Pin, Eye, EyeOff, ShieldAlert, Megaphone } from 'lucide-react';

// Basic Markdown parser for preview (HTML escaped to prevent XSS)
function parseMarkdown(text: string) {
  if (!text) return '';
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  let html = safeText
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-3 mb-1 text-slate-900">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2 text-slate-900">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-5 mb-2 text-slate-900">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');
  return html;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const [formData, setFormData] = useState({ title: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'announcements')),
      (snap) => {
        let anns: any[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        anns.sort((a, b) => {
          const timeA = a.postedAt?.toMillis() || 0;
          const timeB = b.postedAt?.toMillis() || 0;
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return timeB - timeA; // Descending
        });
        setAnnouncements(anns);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const docRef = doc(collection(db, 'announcements'));
      await setDoc(docRef, {
        title: formData.title,
        body: formData.body,
        postedAt: serverTimestamp(),
        postedBy: auth.currentUser?.uid,
        isPinned: false,
        isVisible: true
      });
      await logAdminAction('CREATE_ANNOUNCEMENT', `announcements/${docRef.id}`, `Announcement: ${formData.title}`);
      
      setIsModalOpen(false);
      setFormData({ title: '', body: '' });
    } catch (err) {
      alert('Error saving announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, field: 'isPinned' | 'isVisible', currentValue: boolean) => {
    await updateDoc(doc(db, 'announcements', id), { [field]: !currentValue });
    await logAdminAction(`TOGGLE_ANNOUNCEMENT_${field.toUpperCase()}`, `announcements/${id}`, `Changed to ${!currentValue}`);
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      await deleteDoc(doc(db, 'announcements', selectedAnnouncement.id));
      await logAdminAction('DELETE_ANNOUNCEMENT', `announcements/${selectedAnnouncement.id}`, `Deleted announcement: ${selectedAnnouncement.title}`);
      setIsDeleteOpen(false);
      setSelectedAnnouncement(null);
    } catch (err) {
      alert('Error deleting announcement');
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Broadcasts & Announcements</h1>
        </div>
        <button 
          onClick={() => { setFormData({ title: '', body: '' }); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-900 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={15} /> <span>Compose Announcement</span>
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-4 w-14 text-center">#</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Posted At</th>
                  <th className="p-4">Pinned</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {announcements.map((ann, idx) => (
                  <tr key={ann.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {ann.isPinned && <Pin size={13} className="inline mr-1.5 text-amber-600 fill-amber-600" />}
                      {ann.title}
                    </td>
                    <td className="p-4 text-slate-500">
                      {ann.postedAt ? ann.postedAt.toDate().toLocaleString('en-IN') : 'Just now'}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggle(ann.id, 'isPinned', ann.isPinned)} 
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          ann.isPinned 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ann.isPinned ? 'Pinned' : 'Unpinned'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggle(ann.id, 'isVisible', ann.isVisible)} 
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          ann.isVisible 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {ann.isVisible ? <><Eye size={12} /> Live</> : <><EyeOff size={12} /> Hidden</>}
                      </button>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedAnnouncement(ann); setIsDeleteOpen(true); }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                      No broadcast announcements published yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Compose Broadcast Announcement">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1.5 text-slate-700">Announcement Title</label>
            <input 
              type="text" 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              placeholder="e.g. Day 1 Main Stage Schedule Updated"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1.5 text-slate-700">Message Content (Markdown)</label>
              <textarea 
                rows={7} 
                required 
                value={formData.body} 
                onChange={e => setFormData({...formData, body: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none font-mono text-xs"
                placeholder="Type markdown here...&#10;# Heading&#10;**Bold text**"
              />
            </div>
            <div>
              <label className="block font-medium mb-1.5 text-slate-700">Live Preview</label>
              <div 
                className="w-full h-[142px] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-y-auto text-slate-700 text-xs"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(formData.body) || '<span class="text-slate-400">Preview will render here...</span>' }}
              />
            </div>
          </div>
          
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs shadow-xs cursor-pointer disabled:opacity-40">
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Announcement">
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 text-rose-800 bg-rose-50 p-4 rounded-xl border border-rose-200">
            <ShieldAlert size={20} className="text-rose-600 shrink-0" />
            <p>Are you sure you want to delete <strong>{selectedAnnouncement?.title}</strong>? This message will be permanently removed from attendee portals.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setIsDeleteOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs shadow-xs cursor-pointer">
              Delete Announcement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
