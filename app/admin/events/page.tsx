'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SkeletonTable } from '../../../components/admin/SkeletonLoader';
import { Modal } from '../../../components/admin/Modal';
import { logAdminAction } from '../../../lib/audit';
import { Plus, Trash2, Edit2, ShieldAlert, Power, PowerOff } from 'lucide-react';

export default function EventManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '', venue: '', category: 'cultural', isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'events')),
      (snap) => {
        let evts: any[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        evts.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
          const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
          return dateA - dateB;
        });
        setEvents(evts);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleOpenModal = (evt: any = null) => {
    if (evt) {
      setSelectedEvent(evt);
      const d = evt.date instanceof Timestamp ? evt.date.toDate() : new Date(evt.date);
      setFormData({
        title: evt.title,
        description: evt.description,
        date: d.toISOString().split('T')[0],
        time: evt.time,
        venue: evt.venue,
        category: evt.category,
        isActive: evt.isActive
      });
    } else {
      setSelectedEvent(null);
      setFormData({ title: '', description: '', date: '', time: '', venue: '', category: 'cultural', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const docRef = selectedEvent ? doc(db, 'events', selectedEvent.id) : doc(collection(db, 'events'));
      const payload = {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date))
      };
      
      await setDoc(docRef, payload, { merge: true });
      await logAdminAction(selectedEvent ? 'EDIT_EVENT' : 'CREATE_EVENT', `events/${docRef.id}`, `Event: ${formData.title}`);
      
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (evt: any) => {
    await updateDoc(doc(db, 'events', evt.id), { isActive: !evt.isActive });
    await logAdminAction('TOGGLE_EVENT_STATUS', `events/${evt.id}`, `Changed active status to ${!evt.isActive}`);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await deleteDoc(doc(db, 'events', selectedEvent.id));
      await logAdminAction('DELETE_EVENT', `events/${selectedEvent.id}`, `Deleted event: ${selectedEvent.title}`);
      setIsDeleteOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      alert('Error deleting event');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-adminHeading text-3xl font-bold mb-2">Event Management</h1>
          <p className="text-admin-muted">Manage scheduling and event details</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-admin-accent hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add Event
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-admin-bg/50 border-b border-admin-border text-admin-muted text-sm uppercase tracking-wider">
                  <th className="p-4 w-16 text-center border-r border-admin-border">S.No</th>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Date & Time</th>
                  <th className="p-4 font-medium">Venue</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {events.map((evt, idx) => (
                  <tr key={evt.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-center border-r border-admin-border text-admin-muted font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-medium">{evt.title}</td>
                    <td className="p-4 capitalize">{evt.category}</td>
                    <td className="p-4 text-sm">
                      {evt.date instanceof Timestamp ? evt.date.toDate().toLocaleDateString() : new Date(evt.date).toLocaleDateString()} at {evt.time}
                    </td>
                    <td className="p-4 text-sm">{evt.venue}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        evt.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {evt.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleToggleStatus(evt)}
                        className="text-admin-muted hover:text-white transition-colors"
                        title={evt.isActive ? 'Deactivate' : 'Reactivate'}
                      >
                        {evt.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button 
                        onClick={() => handleOpenModal(evt)}
                        className="text-admin-muted hover:text-white transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedEvent(evt); setIsDeleteOpen(true); }}
                        className="text-red-500/70 hover:text-red-500 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-admin-muted">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedEvent ? "Edit Event" : "Create Event"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-admin-muted">Event Title</label>
            <input 
              type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-admin-muted">Description</label>
            <textarea 
              rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-admin-muted">Date</label>
              <input 
                type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-admin-muted">Time</label>
              <input 
                type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-admin-muted">Venue</label>
              <input 
                type="text" required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})}
                className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-admin-muted">Category</label>
              <select 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-admin-bg border border-admin-border rounded-lg py-2 px-4 focus:outline-none focus:border-admin-accent"
              >
                <option value="cultural">Cultural</option>
                <option value="fine-arts">Fine Arts</option>
                <option value="sports">Sports</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-admin-muted hover:text-white">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-admin-accent text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500">
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Event">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <ShieldAlert size={24} />
            <p className="text-sm">Are you sure you want to delete <strong>{selectedEvent?.title}</strong>? This cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 rounded-lg text-admin-muted hover:text-white">Cancel</button>
            <button onClick={handleDelete} className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600">
              Delete Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
