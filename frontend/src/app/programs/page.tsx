import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ProgramsConfigurator from '@/components/ProgramsConfigurator';
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
      <PageHeader
        title="SELECT YOUR FUNDING PROGRAM"
        subtitle="Choose your program, account size, platform, and add-ons. Your rules and pricing update automatically."
        eyebrow="Single Page Configurator"
      />
      <ProgramsConfigurator />
      <Footer />
    </div>
  );
}
