'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitContact } from '@/lib/api';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const res = await submitContact(form);
    setFeedback(res.message);
    setStatus(res.ok ? 'done' : 'error');
    if (res.ok) setForm({ name: '', email: '', message: '' });
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="space-y-5 border border-gold/20 bg-navy/40 backdrop-blur-sm p-8 rounded-sm"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block"
        >
          Name
        </label>
        <input
          id="contact-name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block"
        >
          Email
        </label>
        <input
          id="contact-email"
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full font-body text-sm tracking-wider text-gold tartan-button px-6 py-3 rounded-sm hover:text-gold-light transition-all uppercase disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
      {feedback && (
        <p
          className={`font-body text-sm ${
            status === 'error' ? 'text-heritage' : 'text-[hsl(150,60%,45%)]'
          }`}
        >
          {feedback}
        </p>
      )}
    </motion.form>
  );
}
