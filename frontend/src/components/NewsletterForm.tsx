'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/lib/api';
import { trackEvent } from './AnalyticsTracker';

interface Props {
  heading?: string;
  paragraph?: string;
}

export default function NewsletterForm({
  heading = 'Join the Duncan Roll',
  paragraph = 'Trading insight, evaluation tips, and clan updates — straight to your inbox.',
}: Props) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    email.length === 0
      ? 'Email is required.'
      : !EMAIL_RE.test(email.trim())
        ? 'Please enter a valid email address.'
        : email.length > 200
          ? 'Email is too long.'
          : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailError) return;
    setStatus('loading');
    const res = await subscribeNewsletter(email, 'footer');
    setMessage(res.message);
    setStatus(res.ok ? 'done' : 'error');
    if (res.ok) {
      setEmail('');
      setTouched(false);
      trackEvent('newsletter_signup', { source: 'footer' });
    }
  };

  const showError = touched && !!emailError && status !== 'done';

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-sm tracking-[0.2em] text-gold mb-2 uppercase">{heading}</h3>
      <p className="font-body text-xs text-wool-muted/70 mb-4">{paragraph}</p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="your@email.com"
          aria-label="Email address"
          aria-invalid={showError}
          className={`flex-1 bg-pine/60 border px-4 py-2.5 rounded-sm font-body text-sm text-wool outline-none transition ${
            showError ? 'border-heritage focus:border-heritage' : 'border-gold/20 focus:border-gold'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !!emailError}
          className="font-body text-xs tracking-wider text-gold tartan-button px-5 py-2.5 rounded-sm hover:text-gold-light transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </form>
      {showError && <p className="mt-2 font-body text-xs text-heritage">{emailError}</p>}
      {message && (
        <p
          className={`mt-3 font-body text-xs ${
            status === 'error' ? 'text-heritage' : 'text-[hsl(150,60%,45%)]'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
