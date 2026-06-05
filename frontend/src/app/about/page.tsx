import type { Metadata } from 'next';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { getContent } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('about', '/about');
}

const DEFAULT_SUBTITLE = '"Disce ferenda pati" — Learn to endure what must be borne.';
const DEFAULT_P1 =
  'Duncan Funded was built on discipline and legacy. Founded by Tommy Duncan, a U.S. Army Colonel (Ret.), aerospace graduate, and lifelong trader, the firm reflects a lifetime of service, mastery, and uncompromising standards.';
const DEFAULT_P2 =
  "Tommy's journey began in the rigor of military life and the precision of aerospace engineering. That same rigor now defines how Duncan Funded operates: every program, every account, every payout — measured against the standard of a clan that does not yield.";
const DEFAULT_P3 =
  'We exist to fund the disciplined trader. The one who studies the chart, controls the risk, and earns the right to scale. Our programs reward consistency, not luck.';
const DEFAULT_VALUES = [
  { title: 'Heritage', text: 'Rooted in Scottish tradition — discipline, honor, and the relentless pursuit of mastery.' },
  { title: 'Integrity', text: 'Transparent rules, fair payouts, and no hidden conditions. The Duncan word is the Duncan bond.' },
  { title: 'Excellence', text: 'We fund traders who refuse to settle. Mastery is the only currency that compounds.' },
];

export default async function AboutPage() {
  const c = await getContent();
  const pick = (key: string, fb: string) => (c[key] && c[key].trim()) || fb;

  const subtitle = pick('about.subtitle', DEFAULT_SUBTITLE);
  const p1 = pick('about.paragraph1', DEFAULT_P1);
  const p2 = pick('about.paragraph2', DEFAULT_P2);
  const p3 = pick('about.paragraph3', DEFAULT_P3);
  const values = [
    { title: pick('about.value1_title', DEFAULT_VALUES[0].title), text: pick('about.value1_desc', DEFAULT_VALUES[0].text) },
    { title: pick('about.value2_title', DEFAULT_VALUES[1].title), text: pick('about.value2_desc', DEFAULT_VALUES[1].text) },
    { title: pick('about.value3_title', DEFAULT_VALUES[2].title), text: pick('about.value3_desc', DEFAULT_VALUES[2].text) },
  ];

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ])}
      />
      <Navbar />

      <PageHeader title="OUR HERITAGE" subtitle={subtitle}>
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
          <p>{p1}</p>
          <p>{p2}</p>
          <p>{p3}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {values.map((v, i) => (
            <div
              key={v.title || i}
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
