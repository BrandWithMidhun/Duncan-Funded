import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import BlogCard from '@/components/BlogCard';
import { getPosts, getCategories, type Post, type Pagination, type Category } from '@/lib/api';
import { JsonLd, breadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'The Duncan Journal',
  description:
    'Trading insight, evaluation strategy, and risk-management wisdom from the Duncan Funded council — built for funded and aspiring prop traders.',
  alternates: { canonical: '/blog' },
};

// Revalidate the listing periodically so new posts appear without a rebuild.
export const revalidate = 60;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(parseInt(sp.page || '1', 10) || 1, 1);
  const category = sp.category;

  let posts: Post[];
  let pagination: Pagination;
  let categories: Category[];
  try {
    const [list, cats] = await Promise.all([
      getPosts({ page, limit: 9, category }),
      getCategories(),
    ]);
    posts = list.data;
    pagination = list.pagination;
    categories = cats;
  } catch {
    posts = [];
    pagination = { total: 0, page: 1, limit: 9, totalPages: 1 };
    categories = [];
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    if (category) q.set('category', category);
    const qs = q.toString();
    return `/blog${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ])}
      />
      <Navbar />

      <PageHeader
        title="THE DUNCAN JOURNAL"
        subtitle="Insight, strategy, and discipline — dispatches for the funded trader."
      />

      <section className="py-12 container mx-auto px-6">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/blog"
              className={`font-body text-xs tracking-wider uppercase px-4 py-2 rounded-sm border transition-all ${
                !category
                  ? 'border-gold/50 text-gold bg-gold/10'
                  : 'border-gold/15 text-wool-muted hover:border-gold/30'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`font-body text-xs tracking-wider uppercase px-4 py-2 rounded-sm border transition-all ${
                  category === cat.slug
                    ? 'border-gold/50 text-gold bg-gold/10'
                    : 'border-gold/15 text-wool-muted hover:border-gold/30'
                }`}
              >
                {cat.name}
                {typeof cat.postCount === 'number' && (
                  <span className="ml-1.5 text-wool-muted/50">({cat.postCount})</span>
                )}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-accent text-xl text-wool-muted italic">
              No dispatches yet. The council is sharpening its quills.
            </p>
            <p className="font-body text-xs text-wool-muted/50 mt-3">
              (Ensure the backend API is running and seeded.)
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-16">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="font-body text-xs tracking-wider uppercase text-gold tartan-button px-5 py-2.5 rounded-sm"
              >
                ← Previous
              </Link>
            )}
            <span className="font-body text-xs text-wool-muted tracking-wider">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            {page < pagination.totalPages && (
              <Link
                href={buildHref(page + 1)}
                className="font-body text-xs tracking-wider uppercase text-gold tartan-button px-5 py-2.5 rounded-sm"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
