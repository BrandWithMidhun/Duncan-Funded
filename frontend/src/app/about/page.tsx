import type { Metadata } from 'next';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Our Heritage',
  description:
    'Duncan Funded bridges centuries of Scottish discipline with the velocity of modern markets. Learn about our heritage, values, and FPFX partnership.',
  alternates: { canonical: '/about' },
};

const values = [
  {
    title: 'Heritage',
    text: 'Rooted in Scottish tradition — discipline, honor, and the relentless pursuit of mastery.',
  },
  {
    title: 'Integrity',
    text: 'Transparent rules, fair payouts, and a code of conduct worthy of the Duncan name.',
  },
  {
    title: 'Excellence',
    text: 'We fund only the sharpest tacticians — those who treat trading as a craft, not a gamble.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ])}
      />
      <Navbar />

      <PageHeader
        title="OUR HERITAGE"
        subtitle={'"Disce ferenda pati" — Learn to endure what must be borne.'}
      >
        <Image
          src="/assets/duncan-crest.png"
          alt="Duncan Crest"
          width={112}
          height={112}
          className="h-28 w-28 mx-auto mb-8 object-contain"
        />
      </PageHeader>

      <section className="py-20 container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8 text-wool-muted font-body text-lg leading-relaxed">
          <p>
            Duncan Funded was forged from a single conviction: that the next generation of elite
            traders deserves capital backing without the gatekeeping of legacy institutions. Born
            in the highlands of modern finance, our firm bridges centuries of Scottish discipline
            with the velocity of today&apos;s global markets.
          </p>
          <p>
            We partner with FPFX Technologies — the industry-standard infrastructure trusted by
            the world&apos;s leading prop firms — to deliver an evaluation experience that is
            fast, fair, and uncompromisingly transparent.
          </p>
          <p>
            Whether you&apos;re a Highland Scout taking your first measured steps or a seasoned
            Chieftain commanding six-figure capital, the Duncan crest stands behind your every
            trade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {values.map((v, i) => (
            <div
              key={v.title}
              className={`border border-gold/20 backdrop-blur-sm p-8 rounded-sm tartan-texture ${
                i === 1 ? 'bg-navy/50' : i === 2 ? 'bg-heritage/30' : 'bg-highland/50'
              }`}
            >
              <h2 className="font-display text-2xl gold-text-gradient font-bold tracking-wider mb-4 uppercase">
                {v.title}
              </h2>
              <p className="font-body text-wool-muted leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
