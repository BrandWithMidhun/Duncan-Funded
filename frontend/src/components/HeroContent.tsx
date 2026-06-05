'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import TradingBackground from './TradingBackground';

interface Stat {
  value: string;
  label: string;
}

interface Props {
  titleGold: string;
  titleWhite: string;
  tagline: string;
  paragraph: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  stats: Stat[];
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

function MaybeExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroContent({
  titleGold,
  titleWhite,
  tagline,
  paragraph,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  stats,
}: Props) {
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
              width={200}
              height={200}
              quality={85}
              sizes="(min-width: 768px) 96px, 72px"
              className="w-[72px] md:w-24 h-auto mb-6 animate-float mx-auto drop-shadow-[0_4px_14px_rgba(212,175,55,0.12)]"
              priority
            />
          </motion.div>

          <h1 className="font-brand font-bold text-4xl md:text-6xl lg:text-7xl tracking-[0.05em] mb-6 max-w-5xl mx-auto">
            <span className="gold-text-gradient">{titleGold}</span>{' '}
            <span className="text-foreground font-light">{titleWhite}</span>
          </h1>

          <p className="font-accent text-xl md:text-2xl text-wool-muted italic max-w-xl mx-auto mb-4">
            {tagline}
          </p>

          <p className="font-body text-sm text-muted-foreground max-w-2xl mx-auto mb-10 tracking-wide leading-relaxed">
            {paragraph}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <MaybeExternalLink
                href={ctaPrimaryHref}
                className="block px-10 py-4 gold-gradient text-background font-display text-sm tracking-[0.2em] uppercase rounded-sm shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow"
              >
                {ctaPrimaryLabel}
              </MaybeExternalLink>
            </motion.div>
            <MaybeExternalLink
              href={ctaSecondaryHref}
              className="px-10 py-4 border border-gold/30 text-gold font-body text-sm tracking-[0.15em] uppercase rounded-sm hover:bg-gold/5 transition-all"
            >
              {ctaSecondaryLabel}
            </MaybeExternalLink>
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
