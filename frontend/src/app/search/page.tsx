import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { searchSite } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search — Duncan Funded',
  description: 'Search Duncan Funded programs, FAQs, and blog posts.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true }, // search result pages shouldn't be indexed
};

const CATEGORY_LABEL: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  futures: 'Futures',
  equities: 'Equities',
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q || '').trim();
  const results = q.length >= 2 ? await searchSite(q) : null;
  const hasResults =
    results && (results.posts.length || results.faqs.length || results.programs.length);

  return (
    <div className="min-h-screen bg-pine">
      <Navbar />
      <PageHeader
        eyebrow="Site Search"
        title="SEARCH RESULTS"
        subtitle={q ? `Results for "${q}"` : 'Enter a search term to find programs, FAQs, and blog posts.'}
      />

      <section className="py-16 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {!q && (
            <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
              <p className="font-accent italic text-wool-muted">
                Use the search field in the navigation bar to begin.
              </p>
            </div>
          )}

          {q && q.length < 2 && (
            <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
              <p className="font-accent italic text-wool-muted">
                Please enter at least 2 characters to search.
              </p>
            </div>
          )}

          {results && !hasResults && (
            <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
              <p className="font-body text-wool-muted">
                No matches for <span className="text-gold">&ldquo;{results.query}&rdquo;</span>.
              </p>
              <p className="font-accent italic text-sm text-wool-muted/70 mt-3">
                Try a different keyword, or browse our{' '}
                <Link href="/programs" className="text-gold underline underline-offset-2">
                  programs
                </Link>
                {' or '}
                <Link href="/faq" className="text-gold underline underline-offset-2">
                  FAQ
                </Link>
                .
              </p>
            </div>
          )}

          {results && hasResults && (
            <div className="space-y-12">
              {results.programs.length > 0 && (
                <section>
                  <h2 className="font-display text-xl gold-text-gradient tracking-wider uppercase mb-5">
                    Programs ({results.programs.length})
                  </h2>
                  <div className="space-y-3">
                    {results.programs.map((p) => (
                      <Link
                        key={p.id}
                        href="/programs"
                        className="block border border-gold/15 bg-highland/30 rounded-sm p-5 hover:border-gold/40 transition-all"
                      >
                        <div className="flex items-baseline justify-between gap-4 mb-1">
                          <h3 className="font-display text-base text-gold tracking-wider">
                            {p.name}
                          </h3>
                          <span className="font-body text-[10px] tracking-wider text-wool-muted uppercase shrink-0">
                            {CATEGORY_LABEL[p.category] || p.category}
                            {p.popular ? ' · Popular' : ''}
                          </span>
                        </div>
                        {p.matchingRules.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {p.matchingRules.map((r, i) => (
                              <li key={i} className="font-body text-sm text-wool-muted">
                                · {r}
                              </li>
                            ))}
                          </ul>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.faqs.length > 0 && (
                <section>
                  <h2 className="font-display text-xl gold-text-gradient tracking-wider uppercase mb-5">
                    FAQ ({results.faqs.length})
                  </h2>
                  <div className="space-y-3">
                    {results.faqs.map((f) => (
                      <Link
                        key={f.id}
                        href={`/faq#${f.categorySlug}`}
                        className="block border border-gold/15 bg-highland/30 rounded-sm p-5 hover:border-gold/40 transition-all"
                      >
                        <h3 className="font-body text-base text-wool mb-1.5">{f.question}</h3>
                        <p className="font-body text-sm text-wool-muted line-clamp-3">
                          {f.answer}
                        </p>
                        <p className="font-body text-[10px] tracking-wider text-wool-muted/60 uppercase mt-2">
                          {f.categoryLabel}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.posts.length > 0 && (
                <section>
                  <h2 className="font-display text-xl gold-text-gradient tracking-wider uppercase mb-5">
                    Blog ({results.posts.length})
                  </h2>
                  <div className="space-y-3">
                    {results.posts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/blog/${p.slug}`}
                        className="block border border-gold/15 bg-highland/30 rounded-sm p-5 hover:border-gold/40 transition-all"
                      >
                        <h3 className="font-display text-base text-gold tracking-wider mb-1.5">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="font-body text-sm text-wool-muted line-clamp-3">
                            {p.excerpt}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
