import type { MetadataRoute } from 'next';
import { getSitemapData, SITE_URL } from '@/lib/api';

// Next.js serves this at /sitemap.xml — regenerated on a schedule.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/programs`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/trade-zone`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const { posts } = await getSitemapData();
    postRoutes = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch {
    // Backend unavailable at build time — static routes still ship.
    postRoutes = [];
  }

  return [...staticRoutes, ...postRoutes];
}
