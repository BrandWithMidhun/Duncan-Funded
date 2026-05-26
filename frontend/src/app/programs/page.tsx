import type { Metadata } from 'next';
import { Navbar, TickerBar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ProgramsSection from '@/components/ProgramsSection';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Funding Programs',
  description:
    'Choose your Duncan Funded program — Highland Scout, Clan Warrior, or Chieftain. Account sizes from $10,000 to $200,000 with up to 90% profit split.',
  alternates: { canonical: '/programs' },
};

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Programs', url: '/programs' },
        ])}
      />
      <Navbar />
      <TickerBar />
      <PageHeader title="FUNDING PROGRAMS" subtitle="Choose your path. Earn your capital." />
      <ProgramsSection />
      <Footer />
    </div>
  );
}
