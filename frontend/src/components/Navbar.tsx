'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings, DEFAULT_SETTINGS, type SiteSettings } from '@/lib/api';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  const navLinks = settings.menu;
  const signInUrl = settings.urls.signIn;
  const getFundedUrl = settings.urls.getFunded;
  // Internal links (start with "/") use next/link; external use a plain anchor.
  const isExternal = (href: string) => /^https?:\/\//i.test(href);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-pine/80 backdrop-blur-xl border-b border-gold/10">
      <div className="container mx-auto flex items-center justify-between h-24 px-6">
        <Link href="/" className="flex items-center">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="Duncan Funded"
              className="h-20 w-auto object-contain"
            />
          ) : (
            <Image
              src="/assets/duncan-logo.png"
              alt="Duncan Funded"
              width={160}
              height={56}
              className="h-20 w-auto object-contain"
              priority
            />
          )}
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) =>
            isExternal(link.href) ? (
              <a
                key={link.label}
                href={link.href}
                className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors duration-300 uppercase"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors duration-300 uppercase"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={signInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm hover:bg-gold/5 hover:border-gold transition-all duration-300 uppercase"
          >
            Sign In
          </a>
          {isExternal(getFundedUrl) ? (
            <a
              href={getFundedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm hover:bg-gold/5 hover:border-gold transition-all duration-300 uppercase"
            >
              Get Funded
            </a>
          ) : (
            <Link
              href={getFundedUrl}
              className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm hover:bg-gold/5 hover:border-gold transition-all duration-300 uppercase"
            >
              Get Funded
            </Link>
          )}
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
              {navLinks.map((link) =>
                isExternal(link.href) ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-body text-sm tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <a
                href={signInUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm text-center hover:bg-gold/5 hover:border-gold transition-all uppercase mt-2"
              >
                Sign In
              </a>
              {isExternal(getFundedUrl) ? (
                <a
                  href={getFundedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm text-center hover:bg-gold/5 hover:border-gold transition-all uppercase"
                >
                  Get Funded
                </a>
              ) : (
                <Link
                  href={getFundedUrl}
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-sm tracking-wider text-gold border border-gold/60 px-6 py-2.5 rounded-sm text-center hover:bg-gold/5 hover:border-gold transition-all uppercase"
                >
                  Get Funded
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
