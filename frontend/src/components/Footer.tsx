'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { subscribeNewsletter } from '@/lib/api';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const res = await subscribeNewsletter(email, 'footer');
    setMessage(res.message);
    setStatus(res.ok ? 'done' : 'error');
    if (res.ok) setEmail('');
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-sm tracking-[0.2em] text-gold mb-2 uppercase">
        Join the Duncan Roll
      </h3>
      <p className="font-body text-xs text-wool-muted/70 mb-4">
        Trading insight, evaluation tips, and clan updates — straight to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
          className="flex-1 bg-pine/60 border border-gold/20 px-4 py-2.5 rounded-sm font-body text-sm text-wool focus:border-gold outline-none transition"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="font-body text-xs tracking-wider text-gold tartan-button px-5 py-2.5 rounded-sm hover:text-gold-light transition-all uppercase disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </form>
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

const footerLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms & Conditions', href: '/terms' },
];

export default function Footer() {
  return (
    <footer className="py-16 border-t border-gold/10 relative bg-pine">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Image
              src="/assets/duncan-crest.png"
              alt="Duncan Funded"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mb-6 opacity-60"
            />
            <div className="font-display text-lg tracking-[0.2em] gold-text-gradient mb-2">
              DUNCAN FUNDED
            </div>
            <p className="font-accent text-sm text-wool-muted italic mb-6">
              Trade with Honour. Profit with Legacy.
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center md:justify-start">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-xs tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex justify-center md:justify-end">
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-col items-center text-center border-t border-gold/10 pt-8">
          <p className="font-body text-xs text-wool-muted/60 tracking-wide">
            © 2026 Duncan Funded. Built on institutional-grade trading technology. All rights
            reserved.
          </p>
          <p className="font-body text-[10px] text-wool-muted/40 mt-3 max-w-2xl tracking-wide leading-relaxed">
            Disclaimer: Duncan Funded is an affiliate of Prop Account, LLC. All live assessments
            are provided by Prop Account, LC and all assessment fees are paid to Prop Account,
            LLC. If you qualify for a Live Account, you will be required to enter into a Trader
            Agreement with Prop Account LC. Neither Prop Account, LLC nor Prop Account LC provides
            any trading education or other services. All such services are provided by Duncan
            Funded.
          </p>
        </div>
      </div>
    </footer>
  );
}
