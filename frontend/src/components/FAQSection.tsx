'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { faqData } from '@/lib/faq';

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-navy/20 relative">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10 max-w-3xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              Questions
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider">
            <span className="gold-text-gradient">FAQ</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-3"
        >
          {faqData.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-sm bg-highland/30 px-6 transition-colors ${
                open === i ? 'border-gold/30' : 'border-gold/10'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left font-display text-sm tracking-wider text-wool hover:text-gold transition-colors"
                aria-expanded={open === i}
              >
                {faq.q}
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="font-body text-sm text-wool-muted leading-relaxed pb-5"
                >
                  {faq.a}
                </motion.p>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
