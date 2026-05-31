import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ProgramsSection from '@/components/ProgramsSection';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('programs', '/programs');
}

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
      <PageHeader title="FUNDING PROGRAMS" subtitle="Choose your path. Earn your capital." />
      <ProgramsSection />
      <Footer />
    </div>
  );
}
