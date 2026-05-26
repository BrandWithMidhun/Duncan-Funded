import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'The Trade Zone',
  description:
    'The toolkit every Duncan-funded trader carries — live dashboard, economic calendar, position sizer, trade journal, strategy library, and risk console.',
  alternates: { canonical: '/trade-zone' },
};

const tools = [
  { name: 'Live Dashboard', desc: 'Real-time P&L, drawdown, and rule monitoring on the FPFX engine.' },
  { name: 'Economic Calendar', desc: 'Stay ahead of high-impact news that moves the markets you trade.' },
  { name: 'Position Sizer', desc: 'Calculate exact lot sizes against your daily and total loss limits.' },
  { name: 'Trade Journal', desc: 'Log, tag, and review every setup. The clan rewards reflection.' },
  { name: 'Strategy Library', desc: 'Curated playbooks from funded Duncan traders, refreshed weekly.' },
  { name: 'Risk Console', desc: 'Pre-trade checks, max-exposure alerts, and kill-switch automation.' },
];

export default function TradeZonePage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Trade Zone', url: '/trade-zone' },
        ])}
      />
      <Navbar />
      <PageHeader
        title="THE TRADE ZONE"
        subtitle="The arsenal every Duncan-funded trader carries into battle."
      />

      <section className="py-12 container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tools.map((t, i) => (
            <div
              key={t.name}
              className={`border border-gold/20 backdrop-blur-sm p-6 rounded-sm hover:border-gold/50 transition-all ${
                i % 3 === 0 ? 'bg-highland/40' : i % 3 === 1 ? 'bg-navy/40' : 'bg-heritage/20'
              }`}
            >
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-3 uppercase">
                {t.name}
              </h2>
              <p className="font-body text-wool-muted leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
