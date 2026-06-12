import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import TradingBackground from '@/components/TradingBackground';
import CapitalFundingOverview from '@/components/CapitalFundingOverview';
import ProgramsConfigurator from '@/components/ProgramsConfigurator';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('programs', '/programs');
}

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Programs', url: '/programs' },
        ])}
      />
      <Navbar />

      {/*
        Hero — ported from the Lovable v5 design.
        Differences from the generic PageHeader:
          - Tighter top/bottom padding (pt-32 pb-10)
          - Two-tone heading: "Capital" gold-gradient + " Funding" white
          - Extra body line referencing the discere pati motto
        Inlined here instead of extending PageHeader so the rest of the
        site keeps the standard hero proportions.
      */}
      <section className="relative pt-32 pb-10 overflow-hidden">
        <div className="absolute inset-0">
          <TradingBackground />
          <div className="absolute inset-0 tartan-texture opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              Duncan Capital Funding
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-wider mb-4">
            <span className="gold-text-gradient">Capital</span>{' '}
            <span className="text-foreground">Funding</span>
          </h1>
          <p className="font-accent text-lg md:text-xl italic text-wool-muted max-w-2xl mx-auto mb-3">
            Select your capital asset class and prove your mettle.
          </p>
          <p className="font-body text-wool-muted max-w-2xl mx-auto text-sm tracking-wide">
            Every Duncan trader begins the{' '}
            <span className="italic">discere pati</span> — &ldquo;learn to
            endure&rdquo; — journey toward mastery.
          </p>
        </div>
      </section>

      {/* Capital Funding Overview — asset class cards, add-ons grid,
          evaluation + scaling explainer, supported platforms. */}
      <CapitalFundingOverview />

      <ProgramsConfigurator />
      <Footer />
    </div>
  );
}