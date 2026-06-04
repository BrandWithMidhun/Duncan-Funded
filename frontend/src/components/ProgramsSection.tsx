'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LineChart, BarChart3, Bitcoin, Building2 } from 'lucide-react';

const assetClasses = [
  {
    name: 'Forex',
    Icon: LineChart,
    description:
      'Trade global currencies with flexible evaluation models and capital scaling opportunities.',
  },
  {
    name: 'Futures',
    Icon: BarChart3,
    description:
      'Access exchange-connected futures markets across CME, CBOT, NYMEX, and COMEX.',
  },
  {
    name: 'Crypto',
    Icon: Bitcoin,
    description:
      'Trade digital assets with instant funding options and payout protection.',
  },
  {
    name: 'Equities',
    Icon: Building2,
    description:
      'Trade S&P 100 equities in a structured, session-based environment on GooeyPro.',
  },
];

export default function ProgramsSection() {
  return (
    <section id="programs" className="py-24 relative">
      <div className="absolute inset-0 tartan-texture opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              Asset Class Overview
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">Choose Your</span>{' '}
            <span className="text-foreground">Trading Domain</span>
          </h2>
          <p className="font-body text-wool-muted max-w-2xl mx-auto text-sm tracking-wide leading-relaxed">
            Duncan Funded provides capital access across four major asset classes. Each class
            offers unique account types, evaluation paths, and add-ons designed for disciplined
            traders.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {assetClasses.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col border border-gold/15 bg-highland/40 backdrop-blur-sm rounded-sm p-7 hover:border-gold/40 transition-all"
            >
              <a.Icon className="w-7 h-7 text-gold mb-4" strokeWidth={1.25} />
              <h3 className="font-display text-xl tracking-wider text-gold uppercase mb-3">
                {a.name}
              </h3>
              <p className="font-body text-sm text-wool-muted leading-relaxed flex-1">
                {a.description}
              </p>
              <Link
                href="/programs"
                className="mt-6 self-start font-body text-xs tracking-[0.2em] text-gold tartan-button px-5 py-2 rounded-sm hover:text-gold-light transition-all uppercase"
              >
                Explore
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
