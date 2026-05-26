import type { Post } from './api';
import { SITE_URL } from './api';

/** Organization schema — emitted once in the root layout. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Duncan Funded',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/duncan-crest.png`,
    description:
      'A premium proprietary trading firm powered by FPFX technology. Prove your skill, earn your funding.',
    slogan: 'Trade with Honour. Profit with Legacy.',
  };
}

/** WebSite schema with search action. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Duncan Funded',
    url: SITE_URL,
  };
}

/** BlogPosting schema for an individual article. */
export function blogPostingSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo.metaDescription,
    image: post.seo.ogImage || `${SITE_URL}/assets/hero-bg.jpg`,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': post.author ? 'Person' : 'Organization',
      name: post.author?.name || 'Duncan Funded',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Duncan Funded',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/duncan-crest.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.map((t) => t.name).join(', '),
    articleSection: post.category?.name,
    wordCount: post.content.trim().split(/\s+/).length,
  };
}

/** Breadcrumb schema. */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/** FAQPage schema. */
export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Renders a JSON-LD <script> tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
