'use client';

import { motion } from 'framer-motion';
import { TradingCandle } from './TradingBackground';

const steps = [
  {
    number: 'I',
    title: 'Choose Your Challenge',
    description:
      'Select an account size and evaluation type that matches your trading style and ambitions.',
  },
  {
    number: 'II',
    title: 'Prove Your Skill',
    description:
      'Trade within the rules, hit profit targets, and demonstrate consistent risk management.',
  },
  {
    number: 'III',
    title: 'Get Funded',
    description:
      'Pass the evaluation and receive a funded account with real capital. Keep up to 90% of profits.',
  },
  {
    number: 'IV',
    title: 'Scale & Earn',
    description:
      'Grow your account through our scaling plan. Consistent traders unlock higher capital and better splits.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-navy/30 relative">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              The Process
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">How It</span>{' '}
            <span className="text-foreground">Works</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gold/20" />
              )}
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

const reasons = [
  {
    title: 'FPFX Powered Infrastructure',
    description:
      'Enterprise-grade execution, real liquidity, and institutional spreads through our FPFX integration.',
  },
  {
    title: 'Up to 90% Profit Split',
    description:
      "Keep the lion's share of your earnings. Our scaling plan rewards consistency with even higher payouts.",
  },
  {
    title: 'No Time Limits',
    description:
      'Trade at your own pace. No artificial deadlines pressuring your decisions.',
  },
  {
    title: 'Bi-Weekly Payouts',
    description:
      'Fast, reliable withdrawals every two weeks. Your profits, on your schedule.',
  },
  {
    title: 'Scaling Up to $2M',
    description:
      'Prove yourself and grow. Our progressive scaling plan takes you from challenge to capital.',
  },
  {
    title: '24/7 Elite Support',
    description:
      'Dedicated account managers and a community of funded traders to support your journey.',
  },
];

export function WhyDuncanSection() {
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
