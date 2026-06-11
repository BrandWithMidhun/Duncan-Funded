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
 * Build the destination for each tool's Launch button.
 *
 * Behaviour:
 *   1. If admin set an explicit launchUrl on the tool, use that (it
 *      wins — internal path or external URL both supported).
 *   2. Otherwise, link to the internal detail page /trade-zone/<slug>.
 *   3. If the tool has no slug at all (shouldn't happen after the
 *      backfill migration, but defensive), return empty and hide
 *      the button rather than render a broken link.
 */
function buildLaunchTarget(tool: {
  slug: string;
  launchUrl: string;
}): { href: string; external: boolean } | null {
  const explicit = tool.launchUrl?.trim();
  if (explicit) {
    return { href: explicit, external: isExternal(explicit) };
  }
  if (tool.slug) {
    return { href: `/trade-zone/${tool.slug}`, external: false };
  }
  return null;
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

      {/* Hero — ported from the Lovable design refresh */}
      <section className="relative pt-40 pb-20 overflow-hidden">
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
            className="h-24 w-24 mx-auto mb-6 object-contain"
            priority
          />
          <p className="font-body text-xs md:text-sm tracking-[0.4em] text-gold/80 uppercase mb-4">
            {eyebrow}
          </p>
          <h1 className="font-display text-5xl md:text-7xl gold-text-gradient font-bold tracking-wider mb-6">
            {heading}
          </h1>
          <p className="font-accent text-xl md:text-2xl text-wool-muted italic max-w-3xl mx-auto mb-6">
            {tagline}
          </p>
          <p className="font-body text-base md:text-lg text-wool-muted/90 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Tool grid — dynamic from /api/trade-zone/tools (admin-managed) */}
      <section className="py-16 container mx-auto px-6">
        {tools.length === 0 ? (
          <p className="font-body text-wool-muted text-center max-w-xl mx-auto">
            The Trader Arsenal is being prepared. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tools.map((tool) => {
              const Icon = pickToolIcon(tool.iconKey);
              const target = buildLaunchTarget(tool);
              return (
                <div
                  key={tool.id}
                  className="border border-gold/20 bg-highland/40 backdrop-blur-sm p-8 rounded-sm tartan-texture flex flex-col"
                >
                  <Icon
                    className="h-8 w-8 text-gold mb-5"
                    strokeWidth={1.25}
                  />
                  <h2 className="font-display text-xl md:text-2xl gold-text-gradient font-bold tracking-wider mb-3 uppercase">
                    {tool.name}
                  </h2>
                  <p className="font-body text-wool-muted leading-relaxed mb-6 flex-1">
                    {tool.description}
                  </p>
                  {target &&
                    (target.external ? (
                      <a
                        href={target.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-xs tracking-[0.25em] text-gold tartan-button px-5 py-2.5 rounded-sm hover:text-gold-light transition-all duration-300 uppercase text-center"
                      >
                        {tool.launchLabel}
                      </a>
                    ) : (
                      <Link
                        href={target.href}
                        className="font-body text-xs tracking-[0.25em] text-gold tartan-button px-5 py-2.5 rounded-sm hover:text-gold-light transition-all duration-300 uppercase text-center"
                      >
                        {tool.launchLabel}
                      </Link>
                    ))}
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
