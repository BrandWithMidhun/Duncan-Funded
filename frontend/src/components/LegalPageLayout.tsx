import { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

/**
 * Shared layout for the static legal pages (Terms, Privacy, Disclaimer).
 * Wraps body content in the prose styling used elsewhere on the site.
 */
export default function LegalPageLayout({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pine">
      <Navbar />
      <PageHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />

      <section className="py-20 container mx-auto px-6">
        <article className="max-w-3xl mx-auto font-body text-wool-muted text-base leading-relaxed space-y-6">
          {lastUpdated && (
            <p className="font-accent italic text-sm text-wool-muted/70">
              Last updated: {lastUpdated}
            </p>
          )}
          {children}

          {/* Trade-name disclosure — required on every legal page */}
          <div className="mt-10 pt-6 border-t border-gold/10">
            <p className="font-body text-sm text-wool-muted/80 leading-relaxed">
              Duncan Funded is a trade name of Superb Choice LLC.
            </p>
          </div>
        </article>
      </section>

      <Footer />
    </div>
  );
}
