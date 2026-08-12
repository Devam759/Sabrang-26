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
import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminEvents() {
  const { role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Flagship",
    "Cultural",
    "Technical",
    "E-Sports",
    "Other",
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Cultural" as
      "Flagship" | "Cultural" | "Technical" | "E-Sports" | "Other",
    dateTime: "",
    venue: "",
    rules: "",
    prizePool: "",
    coord1Name: "",
    coord1Phone: "",
    coord2Name: "",
    coord2Phone: "",
  });

  useEffect(() => {
    if (!authLoading && role === "admin") {
      fetchEvents();
    }
  }, [authLoading, role]);

  const fetchEvents = async () => {
    const q = query(collection(db, "events"), orderBy("dateTime", "asc"));
    const querySnapshot = await getDocs(q);
    setEvents(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Event),
    );
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const coordinators = [
        { name: formData.coord1Name, phone: formData.coord1Phone },
        { name: formData.coord2Name, phone: formData.coord2Phone },
      ].filter((c) => c.name);

      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        dateTime: new Date(formData.dateTime),
        venue: formData.venue,
        rules: formData.rules,
        prizePool: formData.prizePool.startsWith("₹")
          ? formData.prizePool
          : `₹${formData.prizePool}`,
        coordinators,
        createdAt: serverTimestamp(),
      };

      if (editingEvent) {
        // Prevent title change in data update for extra safety
        const { title, ...rest } = data;
        await updateDoc(doc(db, "events", editingEvent.id!), rest);
        alert("Event updated!");
      } else {
        await addDoc(collection(db, "events"), data);
        alert("Event created!");
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Error saving event.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Cultural",
      dateTime: "",
      venue: "",
      rules: "",
      prizePool: "",
      coord1Name: "",
      coord1Phone: "",
      coord2Name: "",
      coord2Phone: "",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      dateTime: new Date((event.dateTime as any).seconds * 1000)
        .toISOString()
        .slice(0, 16),
      venue: event.venue,
      rules: event.rules,
      prizePool: event.prizePool?.replace("₹", "") || "",
      coord1Name: event.coordinators?.[0]?.name || "",
      coord1Phone: event.coordinators?.[0]?.phone || "",
      coord2Name: event.coordinators?.[1]?.name || "",
      coord2Phone: event.coordinators?.[1]?.phone || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading || loading)
    return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Sabrang Events Manager
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Add New Event
          </button>
        )}
      </div>

      {!showForm && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Search by title..."
              className="w-full p-3 pl-10 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-12">
          {/* ... existing form content ... */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {editingEvent ? "Modify Event" : "Create Event"}
              </h2>
              <p className="text-slate-500 text-sm">
                {editingEvent
                  ? "Update the details for this existing event."
                  : "Define a new competition for the festival."}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Event Title {editingEvent && "(Fixed)"}
              </label>
              <input
                type="text"
                required
                disabled={!!editingEvent}
                className={`w-full p-4 border rounded-xl text-lg font-bold ${editingEvent ? "bg-slate-50 text-slate-500 border-slate-100" : "border-slate-200 focus:border-indigo-500 outline-none"}`}
                placeholder="e.g. PANACHE - RAMPWALK"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Detailed Description
              </label>
              <textarea
                required
                className="w-full p-4 border border-slate-200 rounded-xl h-32 focus:border-indigo-500 outline-none transition-all"
                placeholder="Describe the event, its significance and what participants can expect..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Category
              </label>
              <select
                className="w-full p-4 border border-slate-200 rounded-xl bg-white focus:border-indigo-500 outline-none"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
              >
                <option value="Flagship">Flagship Event</option>
                <option value="Cultural">Cultural</option>
                <option value="Technical">Technical</option>
                <option value="E-Sports">E-Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Prize Pool (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="text"
                  required
                  className="w-full p-4 pl-8 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  placeholder="50,000"
                  value={formData.prizePool}
                  onChange={(e) =>
                    setFormData({ ...formData, prizePool: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                className="w-full p-4 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                value={formData.dateTime}
                onChange={(e) =>
                  setFormData({ ...formData, dateTime: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Venue
              </label>
              <input
                type="text"
                required
                className="w-full p-4 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                placeholder="e.g. Main Stage / Auditorium"
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="md:col-span-2 flex justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Coordinators
                  </label>
                  <span className="text-[10px] text-slate-400 uppercase font-bold italic">
                    Max 2 allowed
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700 underline decoration-indigo-200">
                    Coordinator 1
                  </p>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white"
                    value={formData.coord1Name}
                    onChange={(e) =>
                      setFormData({ ...formData, coord1Name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white"
                    value={formData.coord1Phone}
                    onChange={(e) =>
                      setFormData({ ...formData, coord1Phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700 underline decoration-indigo-200">
                    Coordinator 2
                  </p>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white"
                    value={formData.coord2Name}
                    onChange={(e) =>
                      setFormData({ ...formData, coord2Name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white"
                    value={formData.coord2Phone}
                    onChange={(e) =>
                      setFormData({ ...formData, coord2Phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Event Rules & Guidelines
              </label>
              <textarea
                required
                className="w-full p-4 border border-slate-200 rounded-xl h-48 focus:border-indigo-500 outline-none"
                placeholder="1. Team size: 8-12 members..."
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-xs text-indigo-700 font-medium">
                Posters for events are managed directly in the codebase and
                cannot be edited here.
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-12 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {editingEvent ? "Save Event" : "Publish Event"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Venue
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Prize
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-6 py-4 font-bold text-slate-900">
                  {event.title}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {event.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  {formatDate(event.dateTime)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {event.venue}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-amber-600">
                  {event.prizePool || "-"}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id!)}
                    className="text-red-600 hover:text-red-800 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredEvents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500 italic"
                >
                  No events found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
