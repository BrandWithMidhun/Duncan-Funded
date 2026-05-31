'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingCandle } from './TradingBackground';
import { getSettings, DEFAULT_SETTINGS, type SiteSettings } from '@/lib/api';

type Program = {
  name: string;
  size: string;
  price: string;
  profitSplit: string;
  popular?: boolean;
  features: string[];
  sizeOptions?: string[];
};

const programsByCategory: Record<string, Program[]> = {
  'Forex/CFDs': [
    {
      name: 'One Step Assessment',
      size: 'Up to $400,000',
      price: '$99',
      profitSplit: '80%',
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000', '250,000', '400,000'],
      features: [
        'Max Drawdown: 6%',
        'Daily Drawdown: 5%',
        'Profit Target: 10%',
        'Choose from Multiple Trading Platforms',
      ],
    },
    {
      name: 'Two Step Assessment',
      size: 'Up to $400,000',
      price: '$179',
      profitSplit: '85%',
      popular: true,
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000', '250,000', '400,000'],
      features: [
        'Max Drawdown: 7%',
        'Daily Drawdown: 5%',
        'Profit Target: 8% (Phase 1), 5% (Phase 2)',
        'Choose from Multiple Trading Platforms',
      ],
    },
    {
      name: 'Instant Funding',
      size: 'Up to $100,000',
      price: '$249',
      profitSplit: '80%',
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000'],
      features: [
        'Max Drawdown 8% (Trailing)',
        'Daily Max Loss Limit 5%',
        '80% Profit Share (90% with Add-On)',
        'No Profit Target',
        'Complete KYC and sign trader contract for withdrawal',
      ],
    },
    {
      name: 'Instant Funding Lite',
      size: 'Up to $100,000',
      price: '$149',
      profitSplit: '80%',
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000'],
      features: [
        'No Profit Target',
        'Max Drawdown 5% (Trailing)',
        'Daily Max Loss Limit 3%',
        '80% Profit Share (90% with Add-On)',
        'Weekend Hold: Available with Add-on',
        'Consistency Requirement: 25%',
        'Profit Buffer: 3%',
      ],
    },
  ],
  Crypto: [
    {
      name: 'Crypto One Step',
      size: 'Up to $200,000',
      price: '$179',
      profitSplit: '80%',
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000', '200,000'],
      features: [
        '1-Step Evaluation',
        'Profit Target: 10%',
        'Max Drawdown: 6%',
        'Daily Drawdown: 4%',
        '24/7 Crypto Markets',
      ],
    },
    {
      name: 'Crypto Two Step',
      size: 'Up to $200,000',
      price: '$499',
      profitSplit: '85%',
      popular: true,
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000', '200,000'],
      features: [
        '2-Phase Evaluation',
        '8% / 5% Profit Targets',
        '5% Max Daily Loss',
        '10% Max Total Loss',
        'Major + Altcoin Pairs',
        'Weekend Trading',
      ],
    },
  ],
  Futures: [
    {
      name: 'Futures',
      size: 'Up to $150,000',
      price: '$165',
      profitSplit: '80%',
      popular: true,
      sizeOptions: ['25,000', '50,000', '100,000', '150,000'],
      features: [
        'Single-Phase Evaluation',
        'Trailing Drawdown',
        'CME, COMEX, NYMEX',
        'Payouts Every 30 Days',
        'Reset Available',
      ],
    },
  ],
  Equities: [
    {
      name: 'One Step Equity',
      size: 'Up to $200,000',
      price: '$149',
      profitSplit: '80%',
      popular: true,
      sizeOptions: ['5,000', '10,000', '25,000', '50,000', '100,000', '200,000'],
      features: [
        'One Step Equities Assessment',
        'Profit Target: 8%',
        'Max Drawdown: 5%',
        'US Equities & ETFs',
        'Pre/Post Market',
      ],
    },
  ],
};

const platformsByCategory: Record<string, string[]> = {
  Crypto: ['DXtrade', 'GooeyPro'],
  Futures: ['DXFuture', 'Volumetrica'],
  Equities: ['GooeyPro'],
};
const DEFAULT_PLATFORMS = ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'];

const categories = Object.keys(programsByCategory);

export default function ProgramsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
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

  const programs = programsByCategory[activeCategory];
  const platforms = platformsByCategory[activeCategory] || DEFAULT_PLATFORMS;
  const ctaUrl = settings.urls.getFunded;
  const ctaIsExternal = /^https?:\/\//i.test(ctaUrl);

  return (
    <section id="programs" className="py-24 relative">
      <div className="absolute inset-0 tartan-texture opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              Choose Your Path
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">Funding</span>{' '}
            <span className="text-foreground">Programs</span>
          </h2>
          <p className="font-body text-wool-muted max-w-lg mx-auto text-sm tracking-wide">
            Select your market, then prove your mettle. Every Duncan trader begins with a challenge.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-sm border border-gold/20 bg-highland/40 backdrop-blur-sm">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-5 md:px-7 py-2.5 font-display text-xs md:text-sm tracking-[0.2em] uppercase rounded-sm transition-all duration-300 ${
                    isActive
                      ? 'text-pine bg-gradient-to-r from-gold to-gold-light shadow-md shadow-gold/30'
                      : 'text-wool-muted hover:text-gold'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-[repeat(auto-fit,minmax(280px,300px))] justify-center gap-6 max-w-7xl mx-auto items-stretch"
          >
            {programs.map((program, i) => (
              <motion.div
                key={program.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-sm overflow-hidden flex h-full w-full ${
                  program.popular
                    ? 'border-2 border-gold/60 shadow-lg shadow-gold/10'
                    : 'border border-gold/15'
                }`}
              >
                {program.popular && <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />}

                <div
                  className={`${
                    program.popular ? 'bg-highland/80' : 'bg-highland/60'
                  } backdrop-blur-sm p-8 flex flex-col flex-1 w-full`}
                >
                  <div className="min-h-[28px] mb-4">
                    {program.popular && (
                      <span className="inline-block font-body text-[10px] tracking-[0.3em] uppercase text-wool bg-heritage px-3 py-1 rounded-sm">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="font-body text-[9px] tracking-[0.2em] uppercase text-gold/80 border border-gold/30 px-2 py-0.5 rounded-sm bg-pine/40"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-display text-lg tracking-wider text-gold mb-1">
                    {program.name}
                  </h3>

                  <div className="font-display text-3xl text-wool mb-6">{program.size}</div>

                  <div className="w-full h-px bg-gold/15 mb-6" />

                  <ul className="space-y-3 mb-8 flex-1">
                    {program.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start font-body text-sm text-wool/80">
                        <TradingCandle variant={fi % 3 === 2 ? 'red' : 'green'} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {program.sizeOptions && (
                    <div className="mb-4">
                      <div className="font-body text-[10px] tracking-[0.25em] uppercase text-wool-muted mb-2">
                        Available Account Size
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {program.sizeOptions.map((opt) => (
                          <div
                            key={opt}
                            className="px-1 py-1.5 font-display text-[11px] tracking-wider rounded-sm border border-gold/25 text-wool/80 text-center"
                          >
                            ${opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.a
                    href={ctaUrl}
                    target={ctaIsExternal ? '_blank' : undefined}
                    rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mt-auto block text-center py-3 font-display text-xs tracking-[0.2em] uppercase rounded-sm tartan-button text-gold hover:text-gold-light transition-all ${
                      program.popular ? 'shadow-gold/30' : ''
                    }`}
                  >
                    Start Challenge
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
