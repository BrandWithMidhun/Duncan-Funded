import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import TradingBackground from '@/components/TradingBackground';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';
import { getTradeZoneToolBySlug } from '@/lib/api';
import { pickToolIcon } from '@/lib/tradeZoneIcons';

interface PageParams {
  params: Promise<{ slug: string }>;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/**
 * SEO-aware metadata generation. Falls back to a generic title if the
 * tool can't be loaded — Next.js won't call this if the route is
 * generated statically and missing, but it's defensive for ISR.
 */
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTradeZoneToolBySlug(slug);
  if (!tool) {
    return {
      title: 'Trader Arsenal | Duncan Funded',
      description: 'Tools and resources for Duncan-funded traders.',
    };
  }
  return {
    title: `${tool.name} | Trader Arsenal | Duncan Funded`,
    description: tool.description,
    alternates: {
      canonical: `/trade-zone/${tool.slug}`,
    },
  };
}

export default async function TradeZoneToolDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const tool = await getTradeZoneToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const Icon = pickToolIcon(tool.iconKey);
  const hasExternalLaunch = !!tool.launchUrl && isExternal(tool.launchUrl);
  const hasInternalLaunch = !!tool.launchUrl && !hasExternalLaunch;

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Trader Arsenal', url: '/trade-zone' },
          { name: tool.name, url: `/trade-zone/${tool.slug}` },
        ])}
      />
      <Navbar />

      {/* Hero — tool-specific, same family as the index page hero */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <TradingBackground />
          <div className="absolute inset-0 tartan-texture opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
          {/* Back link */}
          <div className="mb-8">
            <Link
              href="/trade-zone"
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] text-wool-muted hover:text-gold transition-colors uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Trader Arsenal
            </Link>
          </div>

          {/* Crest + icon stack */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <Image
              src="/assets/duncan-crest.png"
              alt="Duncan Crest"
              width={144}
              height={144}
              className="h-16 w-16 object-contain opacity-70"
              priority
            />
            <div className="w-px h-12 bg-gold/30" />
            <div className="w-16 h-16 border border-gold/30 rounded-sm flex items-center justify-center bg-highland/40">
              <Icon className="w-7 h-7 text-gold" strokeWidth={1.25} />
            </div>
          </div>

          <p className="font-body text-xs md:text-sm tracking-[0.4em] text-gold/80 uppercase mb-4">
            Duncan Trader Arsenal
          </p>
          <h1 className="font-display text-4xl md:text-6xl gold-text-gradient font-bold tracking-wider mb-6">
            {tool.name.toUpperCase()}
          </h1>
          <p className="font-accent text-lg md:text-xl text-wool-muted italic max-w-2xl mx-auto">
            {tool.description}
          </p>

          {/* Top-of-page CTA — only when admin has set an explicit
              external launch URL. Internal slug links don't get
              echoed back at the same page. */}
          {hasExternalLaunch && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={tool.launchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] text-gold tartan-button px-7 py-3 rounded-sm hover:text-gold-light transition-all uppercase"
              >
                {tool.launchLabel}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          {hasInternalLaunch && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={tool.launchUrl}
                className="font-body text-xs tracking-[0.25em] text-gold tartan-button px-7 py-3 rounded-sm hover:text-gold-light transition-all uppercase"
              >
                {tool.launchLabel}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Markdown body */}
      <section className="container mx-auto px-6 pb-24">
        <article className="max-w-3xl mx-auto border border-gold/15 bg-highland/30 rounded-sm p-8 md:p-12">
          {tool.detailContent ? (
            <div className="prose prose-invert prose-gold font-body text-wool max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {tool.detailContent}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="font-accent italic text-wool-muted text-center">
              Detailed information about this tool is coming soon. In the
              meantime, return to the{' '}
              <Link href="/trade-zone" className="text-gold underline">
                Trader Arsenal
              </Link>{' '}
              for the full toolkit overview.
            </p>
          )}
        </article>

        {/* Bottom CTA — repeats the launch button for engaged readers */}
        {hasExternalLaunch && (
          <div className="max-w-3xl mx-auto mt-8 text-center">
            <a
              href={tool.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] text-gold tartan-button px-7 py-3 rounded-sm hover:text-gold-light transition-all uppercase"
            >
              {tool.launchLabel}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Always-on back link at the bottom */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Link
            href="/trade-zone"
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] text-wool-muted hover:text-gold transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Trader Arsenal
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
