'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TradingCandle } from './TradingBackground';

const programs = [
  {
    name: 'Highland Scout',
    size: '$10,000',
    price: '$99',
    profitSplit: '80%',
    features: [
      '1-Phase Evaluation',
      '8% Profit Target',
      '5% Max Daily Loss',
      '10% Max Total Loss',
      'No Time Limit',
      'Free Retry on Profits',
    ],
  },
  {
    name: 'Clan Warrior',
    size: '$50,000',
    price: '$299',
    profitSplit: '85%',
    popular: true,
    features: [
      '2-Phase Evaluation',
      '8% / 5% Profit Targets',
      '5% Max Daily Loss',
      '10% Max Total Loss',
      'Unlimited Trading Days',
      'Scaling Plan Available',
    ],
  },
  {
    name: 'Chieftain',
    size: '$200,000',
    price: '$999',
    profitSplit: '90%',
    features: [
      '2-Phase Evaluation',
      '8% / 5% Profit Targets',
      '5% Max Daily Loss',
      '10% Max Total Loss',
      'Priority Support',
      'Accelerated Scaling',
    ],
  },
];

export default function ProgramsSection() {
  return (
    <section id="programs" className="py-24 relative">
      <div className="absolute inset-0 tartan-texture opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
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
            Select your account size and prove your mettle. Every Duncan trader begins with a
            challenge.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {programs.map((program, i) => (
            <motion.div
              key={program.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              className={`relative rounded-sm overflow-hidden ${
                program.popular
                  ? 'border-2 border-gold/60 shadow-lg shadow-gold/10'
                  : 'border border-gold/15'
              }`}
            >
              {program.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
              )}

              <div
                className={`${
                  program.popular ? 'bg-highland/80' : 'bg-highland/60'
                } backdrop-blur-sm p-8`}
              >
                {program.popular && (
                  <span className="inline-block font-body text-[10px] tracking-[0.3em] uppercase text-wool bg-heritage px-3 py-1 rounded-sm mb-4">
                    Most Popular
                  </span>
                )}

                <h3 className="font-display text-lg tracking-wider text-gold mb-1">
                  {program.name}
                </h3>
                <div className="font-display text-3xl text-wool mb-1">{program.size}</div>
                <div className="font-accent text-wool-muted text-sm italic mb-6">
                  Starting at {program.price} · {program.profitSplit} split
                </div>

                <div className="w-full h-px bg-gold/15 mb-6" />

                <ul className="space-y-3 mb-8">
                  {program.features.map((feature, fi) => (
                    <li
                      key={fi}
                      className="flex items-center font-body text-sm text-wool/80"
                    >
                      <TradingCandle variant={fi % 3 === 2 ? 'red' : 'green'} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="block text-center py-3 font-display text-xs tracking-[0.2em] uppercase rounded-sm tartan-button text-gold hover:text-gold-light transition-all"
                >
                  Start Challenge
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
