'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitContact } from '@/lib/api';
import { trackEvent } from './AnalyticsTracker';

type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: { name: string; email: string; message: string }): Errors {
  const errs: Errors = {};
  if (form.name.trim().length < 2) errs.name = 'Please enter your full name.';
  else if (form.name.trim().length > 120) errs.name = 'Name is too long.';

  if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
  else if (form.email.length > 200) errs.email = 'Email is too long.';

  if (form.message.trim().length < 10)
    errs.message = 'Tell us a bit more — at least 10 characters.';
  else if (form.message.length > 4000) errs.message = 'Message is too long (max 4000 characters).';

  return errs;
}

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const fieldClass = (key: keyof Errors) =>
    `w-full bg-pine/60 border px-4 py-3 rounded-sm font-body text-wool outline-none transition ${
      touched[key] && errors[key]
        ? 'border-heritage focus:border-heritage'
        : 'border-gold/20 focus:border-gold'
    }`;

  const ErrorText = ({ k }: { k: keyof Errors }) =>
    touched[k] && errors[k] ? (
      <p className="mt-1.5 font-body text-xs text-heritage">{errors[k]}</p>
    ) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (hasErrors) return;

    setStatus('loading');
    const res = await submitContact(form);
    setFeedback(res.message);
    setStatus(res.ok ? 'done' : 'error');
    if (res.ok) {
      setForm({ name: '', email: '', message: '' });
      setTouched({});
      trackEvent('contact_submitted');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      noValidate
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
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          aria-invalid={!!(touched.name && errors.name)}
          aria-describedby={touched.name && errors.name ? 'contact-name-error' : undefined}
          className={fieldClass('name')}
        />
        <ErrorText k="name" />
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
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={!!(touched.email && errors.email)}
          className={fieldClass('email')}
        />
        <ErrorText k="email" />
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
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, message: true }))}
          aria-invalid={!!(touched.message && errors.message)}
          className={`${fieldClass('message')} resize-none`}
        />
        <div className="flex justify-between items-start mt-1">
          <ErrorText k="message" />
          <span className="font-body text-[10px] text-wool-muted/60 ml-auto">
            {form.message.length}/4000
          </span>
        </div>
      </div>
      <button
        type="submit"
        disabled={status === 'loading' || hasErrors}
        className="w-full font-body text-sm tracking-wider text-gold tartan-button px-6 py-3 rounded-sm hover:text-gold-light transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'done' && (
        <p className="font-body text-sm text-[hsl(150,60%,55%)] text-center">{feedback}</p>
      )}
      {status === 'error' && (
        <p className="font-body text-sm text-heritage text-center">{feedback}</p>
      )}
    </motion.form>
  );
}
