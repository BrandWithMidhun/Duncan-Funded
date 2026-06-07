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
  integrations: {
    gtmId: string;
    metaPixelId: string;
    whatsappPhone: string;
    whatsappMessage: string;
  };
  chatbot: {
    enabled: boolean;
    model: string;
    monthlyTokenBudget: number;
    ratePerHour: number;
    ratePerDay: number;
    maxMessagesPerSession: number;
    openingMessage: string;
    systemExtras: string;
  };
  popups: {
    newsletter: {
      enabled: boolean;
      title: string;
      body: string;
      buttonLabel: string;
      delaySeconds: number;
      scrollThreshold: number;
      cooldownDays: number;
    };
    exitIntent: {
      enabled: boolean;
      title: string;
      body: string;
      ctaLabel: string;
      ctaUrl: string;
      cooldownDays: number;
    };
  };
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
  integrations: {
    gtmId: '',
    metaPixelId: '',
    whatsappPhone: '',
    whatsappMessage: '',
  },
  chatbot: {
    enabled: true,
    model: 'claude-haiku-4-5-20251001',
    monthlyTokenBudget: 15_000_000,
    ratePerHour: 20,
    ratePerDay: 100,
    maxMessagesPerSession: 40,
    openingMessage:
      "Welcome. I'm Duncan — your guide to our capital funding challenges. Ask me about programs, evaluation rules, payouts, or platforms. I can't provide financial or investment advice.",
    systemExtras: '',
  },
  popups: {
    newsletter: {
      enabled: false,
      title: 'Join the brief',
      body: 'Get evaluation updates, payout news, and platform announcements.',
      buttonLabel: 'Subscribe',
      delaySeconds: 30,
      scrollThreshold: 50,
      cooldownDays: 14,
    },
    exitIntent: {
      enabled: false,
      title: 'Before you go…',
      body: 'Take a look at our funded challenges.',
      ctaLabel: 'See Programs',
      ctaUrl: '/programs',
      cooldownDays: 30,
    },
  },
};

/** Fetch site settings (URLs, logo, menu, integrations). Falls back to defaults on error. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return DEFAULT_SETTINGS;
    const json = await res.json();
    const data = json.data as SiteSettings;
    // Defensive: ensure nested objects always exist even on old backend payloads.
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      integrations: { ...DEFAULT_SETTINGS.integrations, ...(data.integrations || {}) },
      chatbot: { ...DEFAULT_SETTINGS.chatbot, ...(data.chatbot || {}) },
      popups: {
        newsletter: {
          ...DEFAULT_SETTINGS.popups.newsletter,
          ...((data.popups && data.popups.newsletter) || {}),
        },
        exitIntent: {
          ...DEFAULT_SETTINGS.popups.exitIntent,
          ...((data.popups && data.popups.exitIntent) || {}),
        },
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ---- FAQ (public) ----

export interface PublicFaqItem {
  id: string;
  q: string;
  a: string;
}

export interface PublicFaqCategory {
  id: string;
  slug: string;
  label: string;
  faqs: PublicFaqItem[];
}

/** Fetch all FAQ categories with items. Falls back to [] on error. */
export async function getFaqCategories(): Promise<PublicFaqCategory[]> {
  try {
    const res = await fetch(`${API_URL}/api/faq`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as PublicFaqCategory[]) || [];
  } catch {
    return [];
  }
}

// ---- Per-page SEO (public) ----

export interface PageSeo {
  slug: string;
  title: string;
  description: string;
  ogImage: string;
}

/** Fetch SEO content for a single page slug. Returns null if unavailable. */
export async function getPageSeo(slug: string): Promise<PageSeo | null> {
  try {
    const res = await fetch(`${API_URL}/api/seo/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data as PageSeo) || null;
  } catch {
    return null;
  }
}

// ---- Content blocks (public) ----

export type ContentMap = Record<string, string>;

/** Fetch the public content map. Always returns an object — empty if API down. */
export async function getContent(): Promise<ContentMap> {
  try {
    const res = await fetch(`${API_URL}/api/content`, { next: { revalidate: 30 } });
    if (!res.ok) return {};
    const json = await res.json();
    return (json.data as ContentMap) || {};
  } catch {
    return {};
  }
}

// ---- Programs (public) ----

export interface PublicProgramAddon {
  id: string;
  label: string;
  percent: number;
  group?: string;
}

export interface PublicProgram {
  id: string;
  slug: string;
  category: 'forex' | 'crypto' | 'futures' | 'equities';
  name: string;
  popular: boolean;
  platforms: string[];
  sizes: number[];
  prices: Record<string, number>;
  rules: string[];
  addons: PublicProgramAddon[];
  order: number;
}

/** Fetch the public program list. Returns [] on error. */
export async function getPrograms(): Promise<PublicProgram[]> {
  try {
    const res = await fetch(`${API_URL}/api/programs`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as PublicProgram[]) || [];
  } catch {
    return [];
  }
}

// ---- Search (public) ----

export interface SearchPostHit {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
}
export interface SearchFaqHit {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  categorySlug: string;
  categoryLabel: string;
}
export interface SearchProgramHit {
  id: string;
  slug: string;
  category: string;
  name: string;
  popular: boolean;
  matchingRules: string[];
}
export interface SearchResults {
  query: string;
  posts: SearchPostHit[];
  faqs: SearchFaqHit[];
  programs: SearchProgramHit[];
  total: number;
}

export async function searchSite(q: string): Promise<SearchResults> {
  try {
    const res = await fetch(
      `${API_URL}/api/search?q=${encodeURIComponent(q)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) {
      return { query: q, posts: [], faqs: [], programs: [], total: 0 };
    }
    const json = await res.json();
    return json.data as SearchResults;
  } catch {
    return { query: q, posts: [], faqs: [], programs: [], total: 0 };
  }
}

// ---- Chatbot ----

export interface ChatAction {
  type: 'program' | 'signup' | 'browse';
  label: string;
  href: string;
  external?: boolean;
}

export interface ChatReply {
  sessionId: string;
  reply: string;
  actions: ChatAction[];
}

export async function sendChatMessage(input: {
  sessionId?: string;
  visitorId: string;
  message: string;
}): Promise<{ ok: true; data: ChatReply } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, data: json.data as ChatReply };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}
