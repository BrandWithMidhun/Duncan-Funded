// Typed client for the Duncan Funded backend API.
// All blog/newsletter/contact data flows through here.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Author {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PostSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
  canonicalUrl: string | null;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  status: string;
  featured: boolean;
  readingTime: number;
  views: number;
  seo: PostSeo;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: Author | null;
  category: Category | null;
  tags: Tag[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostList {
  data: Post[];
  pagination: Pagination;
}

interface FetchOpts {
  // Next.js revalidation window in seconds (ISR). Default 60s.
  revalidate?: number;
}

async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: opts.revalidate ?? 60 },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

// ---- Blog ----

export async function getPosts(params: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
} = {}): Promise<PostList> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.category) q.set('category', params.category);
  if (params.tag) q.set('tag', params.tag);
  if (params.search) q.set('search', params.search);
  if (params.featured !== undefined) q.set('featured', String(params.featured));
  const qs = q.toString();
  return apiGet<PostList>(`/api/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await apiGet<{ data: Post }>(`/api/posts/${slug}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiGet<{ data: Category[] }>('/api/categories');
  return res.data;
}

export async function getSitemapData(): Promise<{ posts: { slug: string; updatedAt: string }[] }> {
  return apiGet<{ posts: { slug: string; updatedAt: string }[] }>('/api/sitemap-data', {
    revalidate: 300,
  });
}

// ---- Newsletter & Contact (client-side POSTs) ----

export async function subscribeNewsletter(
  email: string,
  source = 'website',
): Promise<{ message: string; ok: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    });
    const json = await res.json();
    return { message: json.message || json.error || 'Something went wrong.', ok: res.ok };
  } catch {
    return { message: 'Unable to reach the server. Please try again.', ok: false };
  }
}

export async function submitContact(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<{ message: string; ok: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { message: json.message || json.error || 'Something went wrong.', ok: res.ok };
  } catch {
    return { message: 'Unable to reach the server. Please try again.', ok: false };
  }
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ---- Site settings ----

export interface MenuItem {
  label: string;
  href: string;
}

export interface SiteSettings {
  urls: {
    getFunded: string;
    beginChallenge: string;
    signIn: string;
  };
  logoUrl: string | null;
  menu: MenuItem[];
}

// Defaults — used when the backend is unreachable so the site still renders.
export const DEFAULT_SETTINGS: SiteSettings = {
  urls: {
    getFunded: '/programs',
    beginChallenge: 'https://duncanfundeddashboard.propaccount.com/en/sign-up',
    signIn: 'https://duncanfundeddashboard.propaccount.com/en/sign-in',
  },
  logoUrl: null,
  menu: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Trade Zone', href: '/trade-zone' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],
};

/** Fetch site settings (URLs, logo, menu). Falls back to defaults on error. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return DEFAULT_SETTINGS;
    const json = await res.json();
    return json.data as SiteSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
