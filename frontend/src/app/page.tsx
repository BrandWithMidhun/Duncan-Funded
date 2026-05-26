import { Navbar, TickerBar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import ProgramsSection from '@/components/ProgramsSection';
import { HowItWorksSection, WhyDuncanSection } from '@/components/Sections';
import FAQSection from '@/components/FAQSection';
import { faqData } from '@/lib/faq';
import { JsonLd, faqPageSchema } from '@/lib/seo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd data={faqPageSchema(faqData)} />
      <Navbar />
      <TickerBar />
      <HeroSection />
      <ProgramsSection />
      <HowItWorksSection />
      <WhyDuncanSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
