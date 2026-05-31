import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('contact', '/contact');
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' },
        ])}
      />
      <Navbar />
      <PageHeader
        title="SUMMON THE CLAN"
        subtitle="Questions, partnerships, or press inquiries — reach the Duncan council."
      />

      <section className="py-20 container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Email
              </h2>
              <p className="font-body text-wool-muted">support@duncanfunded.com</p>
            </div>
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Headquarters
              </h2>
              <p className="font-body text-wool-muted">
                1200 North Federal Highway,
                <br />
                Suite 300 Boca Raton,
                <br />
                FL 33432
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-2 uppercase">
                Hours
              </h2>
              <p className="font-body text-wool-muted">24/7 Elite Support</p>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
