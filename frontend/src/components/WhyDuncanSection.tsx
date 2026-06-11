'use client';

import { motion } from 'framer-motion';
import TradingCandle from './TradingCandle';

/**
 * "Why Duncan" value proposition grid. Six cards with a candle marker
 * + heading + body. Static content for now — same migration path as
 * HowItWorksSection if it needs to become admin-editable later.
 */
const reasons = [
  {
    title: 'Institutional-Grade Trading Infrastructure',
    description:
      'Built on proven, exchange-connected technology with stable execution, transparent pricing, and multi-asset support.',
  },
  {
    title: 'Performance-Based Profit Split',
    description:
      'Earn up to 90% of profits with payout protection and scaling incentives.',
  },
  {
    title: 'Trade Without Deadlines',
    description: 'No artificial time limits. Focus on performance, not pressure.',
  },
  {
    title: 'Flexible Payouts',
    description: 'Withdraw profits on a bi-weekly schedule or under payout protection terms.',
  },
  {
    title: 'Progressive Scaling',
    description:
      'Consistent traders qualify for increased capital allocation across supported asset classes.',
  },
  {
    title: 'Trader-Focused Assistance',
    description:
      'Support designed around real trader needs — clear answers, fast resolutions, and a commitment to transparency.',
  },
];

export default function WhyDuncanSection() {
  return (
    <section id="why-duncan" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              Our Edge
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">Why</span>{' '}
            <span className="text-foreground">Duncan</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="border border-gold/10 rounded-sm p-6 bg-highland/40 hover:border-gold/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <TradingCandle variant="green" />
                </div>
                <div>
                  <h3 className="font-display text-sm tracking-wider text-gold mb-2 group-hover:gold-text-gradient transition-all">
                    {reason.title}
                  </h3>
                  <p className="font-body text-sm text-wool-muted leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
