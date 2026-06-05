import type { Metadata } from 'next';
import { Activity, CalendarDays, Calculator, BookOpen, Library, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { getContent } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('trade-zone', '/trade-zone');
}

const ICONS = [Activity, CalendarDays, Calculator, BookOpen, Library, ShieldAlert];
const DEFAULTS = [
  { name: 'Live Dashboard', desc: 'Real-time P&L, drawdown, and rule monitoring for your funded accounts.' },
  { name: 'Economic Calendar', desc: 'Stay ahead of high-impact news that moves the markets you trade.' },
  { name: 'Position Sizer', desc: 'Calculate precise lot sizes based on your daily and overall loss limits.' },
  { name: 'Trade Journal', desc: 'Log, tag, and review every setup. The clan rewards reflection.' },
  { name: 'Strategy Library', desc: 'Curated playbooks from funded Duncan traders, refreshed regularly.' },
  { name: 'Risk Console', desc: 'Pre-trade checks, max-exposure alerts, and kill-switch style protections.' },
];

export default async function TradeZonePage() {
  const c = await getContent();
  const pick = (key: string, fb: string) => (c[key] && c[key].trim()) || fb;

  const subtitle = pick(
    'tradezone.subtitle',
    'Tools, dashboards, and disciplined frameworks for Duncan-funded traders.',
  );
  const tools = DEFAULTS.map((d, i) => ({
    name: pick(`tradezone.t${i + 1}_name`, d.name),
    desc: pick(`tradezone.t${i + 1}_desc`, d.desc),
    Icon: ICONS[i],
  }));

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Trade Zone', url: '/trade-zone' },
        ])}
      />
      <Navbar />
      <PageHeader title="THE TRADE ZONE" subtitle={subtitle} />

      <section className="py-12 container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tools.map((t, i) => (
            <div
              key={t.name || i}
              className={`border border-gold/20 backdrop-blur-sm p-6 rounded-sm hover:border-gold/50 transition-all ${
                i % 3 === 0 ? 'bg-highland/40' : i % 3 === 1 ? 'bg-navy/40' : 'bg-heritage/20'
              }`}
            >
              <t.Icon className="w-7 h-7 text-gold mb-4" strokeWidth={1.5} />
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
