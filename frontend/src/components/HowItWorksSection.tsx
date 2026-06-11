'use client';

import { motion } from 'framer-motion';

/**
 * Five-step process explainer for the home page. Ported from the
 * Lovable design refresh. Static content — if it ever needs to
 * become admin-editable, swap to a server wrapper that pulls from
 * the content_blocks table the same way HeroSection does.
 */
const steps = [
  {
    number: 'I',
    title: 'Choose Your Capital',
    description: 'Select your capital size and asset class to begin your journey.',
  },
  {
    number: 'II',
    title: 'Select Your Asset Class',
    description: 'Each asset class offers its own account types, sizes, and add-ons.',
  },
  {
    number: 'III',
    title: 'Prove Your Skill',
    description:
      'Trade within defined parameters, meet profit targets, and demonstrate disciplined risk management.',
  },
  {
    number: 'IV',
    title: 'Receive Trading Capital',
    description:
      'Successful traders access real trading capital with up to a 90% profit split and payout protection.',
  },
  {
    number: 'V',
    title: 'Scale & Earn',
    description:
      "Advance through Duncan's progressive scaling framework as you demonstrate consistency.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-navy/30 relative">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              The Duncan Pathway
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">How It</span>{' '}
            <span className="text-foreground">Works</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold/40 flex items-center justify-center bg-highland/60">
                <span className="font-display text-lg text-gold">{step.number}</span>
              </div>
              <h3 className="font-display text-sm tracking-wider text-gold mb-3 uppercase">
                {step.title}
              </h3>
              <p className="font-body text-sm text-wool-muted leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
