import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import TradingBackground from '@/components/TradingBackground';
import BlogCard from '@/components/BlogCard';
import { getPost, getPosts, SITE_URL } from '@/lib/api';
import { JsonLd, blogPostingSchema, breadcrumbSchema } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render every published post at build time; new ones via ISR.
export async function generateStaticParams() {
  try {
    const { data } = await getPosts({ limit: 50 });
    return data.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 60;

// Per-post metadata — the heart of blog SEO.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.tags.map((t) => t.name),
    alternates: { canonical: post.seo.canonicalUrl || url },
    openGraph: {
      type: 'article',
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      url,
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author?.name || 'Duncan Funded'],
      tags: post.tags.map((t) => t.name),
      images: [
        {
          url: post.seo.ogImage || '/assets/hero-bg.jpg',
          width: 1920,
          height: 1080,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [post.seo.ogImage || '/assets/hero-bg.jpg'],
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Related posts — same category, excluding the current post.
  let related: typeof post[] = [];
  try {
    const { data } = await getPosts({
      limit: 4,
      category: post.category?.slug,
    });
    related = data.filter((p) => p.id !== post.id).slice(0, 3);
  } catch {
    related = [];
  }

  return (
    <div className="min-h-screen bg-pine">
      <JsonLd data={blogPostingSchema(post)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
      <Navbar />

      {/* Article header */}
      <header className="relative pt-40 pb-12 overflow-hidden">
        <div className="absolute inset-0">
          <TradingBackground />
          <div className="absolute inset-0 tartan-texture opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-3xl text-center">
          <nav className="flex items-center justify-center gap-2 mb-6 font-body text-[11px] tracking-wider uppercase text-wool-muted/60">
            <Link href="/" className="hover:text-gold transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gold transition-colors">
              Blog
            </Link>
          </nav>

          {post.category && (
            <span className="inline-block font-body text-[10px] tracking-[0.25em] uppercase text-gold/80 bg-gold/10 px-3 py-1 rounded-sm mb-5">
              {post.category.name}
            </span>
          )}

          <h1 className="font-display text-3xl md:text-5xl gold-text-gradient font-bold tracking-wide leading-tight mb-6">
            {post.title}
          </h1>

          <p className="font-accent text-lg md:text-xl text-wool-muted italic max-w-2xl mx-auto mb-6">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-center gap-4 font-body text-xs text-wool-muted/70 tracking-wider">
            <span>{post.author?.name || 'Duncan Funded'}</span>
            <span className="w-1 h-1 rounded-full bg-gold/40" />
            <span>{formatDate(post.publishedAt)}</span>
            <span className="w-1 h-1 rounded-full bg-gold/40" />
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* Feature image */}
      {post.coverImage && (
        <div className="container mx-auto px-6 max-w-4xl -mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-sm border border-gold/15 object-cover max-h-[480px]"
          />
        </div>
      )}

      {/* Article body */}
      <article className="container mx-auto px-6 max-w-3xl py-12">
        <div className="prose prose-invert max-w-none font-body prose-headings:font-display prose-headings:tracking-wide prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:leading-relaxed prose-li:marker:text-gold prose-strong:text-wool">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-12 pt-8 border-t border-gold/10">
            <span className="font-body text-xs uppercase tracking-widest text-wool-muted/60">
              Tagged
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="font-body text-[11px] tracking-wider text-wool-muted bg-highland/60 border border-gold/15 px-3 py-1 rounded-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 border border-gold/20 bg-highland/50 rounded-sm p-8 text-center tartan-texture">
          <h2 className="font-display text-xl gold-text-gradient font-bold tracking-wider mb-3 uppercase">
            Ready to Earn Your Funding?
          </h2>
          <p className="font-body text-sm text-wool-muted mb-6 max-w-lg mx-auto">
            Put the discipline to work. Choose a Duncan Funded challenge and trade real capital.
          </p>
          <Link
            href="/programs"
            className="inline-block font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-8 py-3 rounded-sm hover:text-gold-light transition-all"
          >
            View Programs
          </Link>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="container mx-auto px-6 max-w-6xl py-16 border-t border-gold/10">
          <h2 className="font-display text-2xl gold-text-gradient font-bold tracking-wider mb-8 text-center uppercase">
            More from the Journal
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
