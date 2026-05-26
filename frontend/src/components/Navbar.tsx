'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const tickers = [
  { pair: 'EUR/USD', price: '1.0847', change: '+0.32%', up: true },
  { pair: 'GBP/JPY', price: '191.245', change: '-0.18%', up: false },
  { pair: 'USD/CHF', price: '0.8812', change: '+0.14%', up: true },
  { pair: 'AUD/USD', price: '0.6523', change: '+0.45%', up: true },
  { pair: 'USD/CAD', price: '1.3621', change: '-0.09%', up: false },
  { pair: 'EUR/GBP', price: '0.8567', change: '+0.21%', up: true },
  { pair: 'NZD/USD', price: '0.6012', change: '-0.33%', up: false },
  { pair: 'XAU/USD', price: '2,341.50', change: '+1.12%', up: true },
];

export function TickerBar() {
  const items = [...tickers, ...tickers];
  return (
    <div className="fixed top-20 left-0 right-0 z-40 overflow-hidden bg-pine/60 backdrop-blur-md border-b border-gold/10">
      <motion.div
        className="flex items-center gap-8 py-2 whitespace-nowrap"
        animate={{ x: [0, -50 * tickers.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-body text-[11px] tracking-wider">
            <span className="text-gold/60">{t.pair}</span>
            <span className="text-foreground/70">{t.price}</span>
            <span className={t.up ? 'text-[hsl(150,60%,40%)]' : 'text-[hsl(3,52%,46%)]'}>
              {t.up ? '▲' : '▼'} {t.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const navLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'Trade Zone', href: '/trade-zone' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-pine/80 backdrop-blur-xl border-b border-gold/10">
      <div className="container mx-auto flex items-center justify-between h-20 px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/duncan-crest.png"
            alt="Duncan Funded Crest"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="font-display text-lg tracking-[0.2em] gold-text-gradient font-bold leading-tight">
              DUNCAN
            </span>
            <span className="font-display text-[10px] tracking-[0.35em] text-wool-muted uppercase">
              Funded
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors duration-300 uppercase"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/programs"
            className="font-body text-sm tracking-wider text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all duration-300 uppercase"
          >
            Get Funded
          </Link>
        </div>

        <button
          className="md:hidden text-wool"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-pine/95 backdrop-blur-xl border-b border-gold/10 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/programs"
                onClick={() => setMobileOpen(false)}
                className="font-body text-sm tracking-wider text-gold tartan-button px-6 py-2.5 rounded-sm text-center hover:text-gold-light transition-all uppercase mt-2"
              >
                Get Funded
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
