import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import TradingBackground from '@/components/TradingBackground';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { getContent, getTradeZoneTools } from '@/lib/api';
import { pickToolIcon } from '@/lib/tradeZoneIcons';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('trade-zone', '/trade-zone');
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/**
 * Every card's LAUNCH button points to /programs by default. Admin
 * can override per-tool in /admin/trade-zone — set Launch URL to any
 * internal path (/something) or external URL (https://...). This is
 * the override-only model: the default destination is always /programs.
 */
function buildLaunchTarget(launchUrl: string): {
  href: string;
  external: boolean;
} {
  const explicit = launchUrl?.trim();
  if (explicit) {
    return { href: explicit, external: isExternal(explicit) };
  }
  return { href: '/programs', external: false };
}

export default async function TraderArsenalPage() {
  const [content, tools] = await Promise.all([getContent(), getTradeZoneTools()]);

  const pick = (key: string, fb: string) =>
    (content[key] && content[key].trim()) || fb;

  const eyebrow = pick('tradezone.eyebrow', 'Duncan Trader Arsenal');
  const heading = pick('tradezone.heading', 'TRADER ARSENAL');
  const tagline = pick(
    'tradezone.tagline',
    'Your complete toolkit for funded trading success.',
  );
  const subtitle = pick(
    'tradezone.subtitle',
    'The Trader Arsenal brings your essential tools into one place — live performance tracking, risk controls, planning, and review — so you can focus on executing your edge.',
  );

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Trader Arsenal', url: '/trade-zone' },
        ])}
      />
      <Navbar />

      {/* Hero — matches the Lovable design refresh: crest + eyebrow +
          big heading + italic tagline + descriptive body line. */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <TradingBackground />
          <div className="absolute inset-0 tartan-texture opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <Image
            src="/assets/duncan-crest.png"
            alt="Duncan Crest"
            width={192}
            height={192}
            className="h-20 w-20 mx-auto mb-6 object-contain"
            priority
          />
          <p className="font-body text-xs md:text-sm tracking-[0.4em] text-gold/80 uppercase mb-4">
            {eyebrow}
          </p>
          <h1 className="font-display text-5xl md:text-7xl gold-text-gradient font-bold tracking-wider mb-6">
            {heading}
          </h1>
          <p className="font-accent text-xl md:text-2xl text-wool-muted italic max-w-3xl mx-auto mb-4">
            {tagline}
          </p>
          <p className="font-body text-base text-wool-muted/90 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Tool grid. Every card has a LAUNCH button -> /programs by
          default, overridable per-tool in admin via launchUrl. */}
      <section className="py-12 container mx-auto px-6">
        {tools.length === 0 ? (
          <p className="font-body text-wool-muted text-center max-w-xl mx-auto">
            The Trader Arsenal is being prepared. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tools.map((tool, i) => {
              const Icon = pickToolIcon(tool.iconKey);
              const target = buildLaunchTarget(tool.launchUrl);
              // Cycle background tints across cards in 3s, matching
              // the Lovable design's pattern (highland / navy / heritage).
              const tint =
                i % 3 === 0
                  ? 'bg-highland/40'
                  : i % 3 === 1
                    ? 'bg-navy/40'
                    : 'bg-heritage/20';
              return (
                <div
                  key={tool.id}
                  className={`flex flex-col border border-gold/20 backdrop-blur-sm p-6 rounded-sm tartan-texture hover:border-gold/50 transition-all ${tint}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      className="w-6 h-6 text-gold"
                      strokeWidth={1.25}
                    />
                    <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider uppercase">
                      {tool.name}
                    </h2>
                  </div>
                  <p className="font-body text-wool-muted leading-relaxed flex-1 mb-6">
                    {tool.description}
                  </p>
                  {target.external ? (
                    <a
                      href={target.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-stretch text-center font-body text-xs tracking-[0.25em] text-gold tartan-button px-5 py-3 rounded-sm hover:text-gold-light transition-all duration-300 uppercase"
                    >
                      {tool.launchLabel || 'Launch'}
                    </a>
                  ) : (
                    <Link
                      href={target.href}
                      className="self-stretch text-center font-body text-xs tracking-[0.25em] text-gold tartan-button px-5 py-3 rounded-sm hover:text-gold-light transition-all duration-300 uppercase"
                    >
                      {tool.launchLabel || 'Launch'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
