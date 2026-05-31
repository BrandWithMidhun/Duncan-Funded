import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import FAQSection from '@/components/FAQSection';
import { faqData } from '@/lib/faq';
import { JsonLd, faqPageSchema, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('faq', '/faq');
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd data={faqPageSchema(faqData)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'FAQ', url: '/faq' },
        ])}
      />
      <Navbar />
      <PageHeader title="FREQUENT QUESTIONS" subtitle="Answers from the Duncan council." />
      <FAQSection />
      <Footer />
    </div>
  );
}
