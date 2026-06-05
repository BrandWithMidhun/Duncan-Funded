import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import ProgramsSection from '@/components/ProgramsSection';
import { HowItWorksSection, WhyDuncanSection } from '@/components/Sections';
import FAQSection from '@/components/FAQSection';
import { faqData } from '@/lib/faq';
import { JsonLd, faqPageSchema } from '@/lib/seo';
import { getContent } from '@/lib/api';

export default async function HomePage() {
  const content = await getContent();
  const pick = (key: string, fb: string) => (content[key] && content[key].trim()) || fb;
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd data={faqPageSchema(faqData)} />
      <Navbar />
      <HeroSection />
      <ProgramsSection />
      <HowItWorksSection />
      <WhyDuncanSection />
      <FAQSection
        eyebrow={pick('home.faq.eyebrow', 'Questions')}
        title={pick('home.faq.title', 'FAQ')}
      />
      <Footer />
    </div>
  );
}
