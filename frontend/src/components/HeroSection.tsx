'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import TradingBackground from './TradingBackground';

const stats = [
  { value: '$400K', label: 'Maximum Capital Allocation' },
  { value: '90%', label: 'Profit Split' },
  { value: '4', label: 'Asset Classes' },
  { value: 'Available', label: 'Payout Protection' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-8">
      <div className="absolute inset-0">
        <Image
          src="/assets/hero-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        <TradingBackground />
        <div className="absolute inset-0 tartan-texture opacity-10" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-px gold-gradient opacity-40" />

      <div className="relative z-10 container mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="mt-8 md:mt-12"
          >
            <Image
              src="/assets/duncan-crest.png"
              alt="Duncan Clan Crest"
              width={400}
              height={400}
              quality={100}
              className="w-36 md:w-48 h-auto mb-8 animate-float mx-auto drop-shadow-[0_4px_24px_rgba(212,175,55,0.15)]"
              priority
            />
          </motion.div>

          <h1 className="font-brand font-bold text-4xl md:text-6xl lg:text-7xl tracking-[0.05em] mb-6 max-w-5xl mx-auto">
            <span className="gold-text-gradient">Capital Funding</span>{' '}
            <span className="text-foreground font-light">for Disciplined Traders</span>
          </h1>

          <p className="font-accent text-xl md:text-2xl text-wool-muted italic max-w-xl mx-auto mb-4">
            <span className="italic">discere pati</span> — learn to endure.
          </p>

          <p className="font-body text-sm text-muted-foreground max-w-2xl mx-auto mb-10 tracking-wide leading-relaxed">
            A premium capital allocation firm built on discipline, transparency, and trader
            excellence.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/programs"
                className="block px-10 py-4 gold-gradient text-background font-display text-sm tracking-[0.2em] uppercase rounded-sm shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow"
              >
                Start Your Journey
              </Link>
            </motion.div>
            <Link
              href="/programs"
              className="px-10 py-4 border border-gold/30 text-gold font-body text-sm tracking-[0.15em] uppercase rounded-sm hover:bg-gold/5 transition-all"
            >
              Explore Capital Funding
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl gold-text-gradient mb-1">
                {stat.value}
              </div>
              <div className="font-body text-xs tracking-[0.15em] text-muted-foreground uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
