import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import FAQSection from '@/components/FAQSection';
import { faqData } from '@/lib/faq';
import { JsonLd, faqPageSchema, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Frequent Questions',
  description:
    'Answers to common questions about Duncan Funded — evaluations, payouts, scaling plans, supported platforms, and tradable instruments.',
  alternates: { canonical: '/faq' },
};

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
