'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// External dashboard URLs
const SIGN_IN_URL = 'https://duncanfundeddashboard.propaccount.com/en/sign-in';

const navLinks = [
  { label: 'Home', href: '/' },
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

        <div className="hidden lg:flex items-center gap-7">
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

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={SIGN_IN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm tracking-wider text-gold border border-gold/40 px-6 py-2.5 rounded-sm hover:bg-gold/5 hover:border-gold transition-all duration-300 uppercase"
          >
            Sign In
          </a>
          <Link
            href="/programs"
            className="font-body text-sm tracking-wider text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all duration-300 uppercase"
          >
            Get Funded
          </Link>
        </div>

        <button
          className="lg:hidden text-wool"
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
            className="lg:hidden bg-pine/95 backdrop-blur-xl border-b border-gold/10 overflow-hidden"
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
              <a
                href={SIGN_IN_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="font-body text-sm tracking-wider text-gold border border-gold/40 px-6 py-2.5 rounded-sm text-center hover:bg-gold/5 transition-all uppercase mt-2"
              >
                Sign In
              </a>
              <Link
                href="/programs"
                onClick={() => setMobileOpen(false)}
                className="font-body text-sm tracking-wider text-gold tartan-button px-6 py-2.5 rounded-sm text-center hover:text-gold-light transition-all uppercase"
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
