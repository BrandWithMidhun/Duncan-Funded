import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';
import { getContent } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('contact', '/contact');
}

export default async function ContactPage() {
  const c = await getContent();
  const pick = (key: string, fb: string) => (c[key] && c[key].trim()) || fb;

  const subtitle = pick(
    'contact.subtitle',
    'Speak with the clan. Send a message or visit our headquarters.',
  );
  const address1 = pick('contact.address_line1', '1200 North Federal Highway');
  const address2 = pick('contact.address_line2', 'Suite 300');
  const address3 = pick('contact.address_line3', 'Boca Raton, FL 33432');
  const hours = pick('contact.hours', 'Open 24/7 — Elite Trader Support');
  const email = pick('contact.email', 'support@duncanfunded.com');

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' },
        ])}
      />
      <Navbar />
      <PageHeader title="SUMMON THE CLAN" subtitle={subtitle} />

      <section className="py-20 container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Email
              </h2>
              <p className="font-body text-wool-muted">{email}</p>
            </div>
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Headquarters
              </h2>
              <p className="font-body text-wool-muted">
                {address1}
                <br />
                {address2}
                <br />
                {address3}
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Hours
              </h2>
              <p className="font-body text-wool-muted">{hours}</p>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
