'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setSubmitted(true);
    setLoading(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  if (submitted) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Message Sent Successfully!</h3>
        <p className="text-sm text-white/70">
          Thank you for reaching out to Sabrang 2026. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wider">
          Your Name *
        </label>
        <input
          type="text"
          required
          placeholder="Enter your full name"
          className="w-full bg-neutral-950 border border-white/15 text-white placeholder-white/30 rounded-xl p-3.5 focus:border-indigo-500 focus:outline-none transition-all text-sm"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wider">
          Email Address *
        </label>
        <input
          type="email"
          required
          placeholder="your.email@example.com"
          className="w-full bg-neutral-950 border border-white/15 text-white placeholder-white/30 rounded-xl p-3.5 focus:border-indigo-500 focus:outline-none transition-all text-sm"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wider">
          Subject *
        </label>
        <select
          required
          className="w-full bg-neutral-950 border border-white/15 text-white rounded-xl p-3.5 focus:border-indigo-500 focus:outline-none transition-all text-sm"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        >
          <option value="" disabled className="bg-neutral-900 text-white/40">Select a topic</option>
          <option value="general" className="bg-neutral-900 text-white">General Inquiry</option>
          <option value="registration" className="bg-neutral-900 text-white">Event Registration Help</option>
          <option value="sponsorship" className="bg-neutral-900 text-white">Sponsorship & Partnership</option>
          <option value="technical" className="bg-neutral-900 text-white">Technical Support</option>
          <option value="other" className="bg-neutral-900 text-white">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wider">
          Message *
        </label>
        <textarea
          required
          rows={4}
          placeholder="Write your message here..."
          className="w-full bg-neutral-950 border border-white/15 text-white placeholder-white/30 rounded-xl p-3.5 focus:border-indigo-500 focus:outline-none transition-all text-sm resize-none"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-xl hover:bg-neutral-200 transition-all uppercase tracking-wider text-xs shadow-xl disabled:opacity-50"
      >
        {loading ? 'Sending Message...' : 'Send Message'}
      </button>
    </form>
  );
}
