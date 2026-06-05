'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LineChart, BarChart3, Bitcoin, Building2, type LucideIcon } from 'lucide-react';

interface AssetClass {
  name: string;
  iconKey: 'forex' | 'futures' | 'crypto' | 'equities';
  description: string;
}

interface Props {
  eyebrow: string;
  titleGold: string;
  titleWhite: string;
  paragraph: string;
  classes: AssetClass[];
}

const ICONS: Record<AssetClass['iconKey'], LucideIcon> = {
  forex: LineChart,
  futures: BarChart3,
  crypto: Bitcoin,
  equities: Building2,
};

export default function ProgramsSectionClient({
  eyebrow,
  titleGold,
  titleWhite,
  paragraph,
  classes,
}: Props) {
  return (
    <section id="programs" className="py-24 relative">
      <div className="absolute inset-0 tartan-texture opacity-10" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              {eyebrow}
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider mb-4">
            <span className="gold-text-gradient">{titleGold}</span>{' '}
            <span className="text-foreground">{titleWhite}</span>
          </h2>
          <p className="font-body text-wool-muted max-w-2xl mx-auto text-sm tracking-wide leading-relaxed">
            {paragraph}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {classes.map((a, i) => {
            const Icon = ICONS[a.iconKey];
            return (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col border border-gold/15 bg-highland/40 backdrop-blur-sm rounded-sm p-7 hover:border-gold/40 transition-all"
              >
                <Icon className="w-7 h-7 text-gold mb-4" strokeWidth={1.25} />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
