// Admin API client — handles authentication and the protected admin endpoints.
// The JWT is stored in localStorage (client-side only) and sent as a
// Bearer token on every admin request.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'duncan_admin_token';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---- Token storage ----

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

// ---- Core authenticated fetch ----

interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: 'Unable to reach the server. Please try again.' };
  }
}

// ---- Auth ----

export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: AdminUser }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json.error || 'Sign in failed.' };
    }
    setToken(json.token);
    return { ok: true, user: json.user };
  } catch {
    return { ok: false, error: 'Unable to reach the server. Please try again.' };
  }
}

export async function fetchMe(): Promise<AdminUser | null> {
  const res = await authFetch<{ user: AdminUser }>('/api/auth/me');
  return res.ok && res.data ? res.data.user : null;
}

export function logout(): void {
  clearToken();
}

// ---- Admin: posts ----

export interface AdminPost {
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
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string } | null;
  category: { id: string; name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string }[];
}

export interface PostInput {
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  status?: string;
  featured?: boolean;
  categoryName?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export async function listAdminPosts(): Promise<ApiResult<{ data: AdminPost[] }>> {
  return authFetch<{ data: AdminPost[] }>('/api/admin/posts?limit=50');
}

export async function getAdminPost(slug: string): Promise<ApiResult<{ data: AdminPost }>> {
  // Admin reads use the public single-post route (returns full content).
  return authFetch<{ data: AdminPost }>(`/api/posts/${slug}`);
}

export async function createPost(input: PostInput): Promise<ApiResult<{ data: AdminPost }>> {
  return authFetch<{ data: AdminPost }>('/api/admin/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>,
): Promise<ApiResult<{ data: AdminPost }>> {
  return authFetch<{ data: AdminPost }>(`/api/admin/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deletePost(id: string): Promise<ApiResult<{ data: { id: string } }>> {
  return authFetch<{ data: { id: string } }>(`/api/admin/posts/${id}`, {
    method: 'DELETE',
  });
}

// ---- Admin: subscribers & messages ----

export interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export async function listSubscribers(): Promise<ApiResult<{ total: number; data: Subscriber[] }>> {
  return authFetch<{ total: number; data: Subscriber[] }>('/api/admin/subscribers');
}

export async function listMessages(): Promise<ApiResult<{ total: number; data: ContactMessage[] }>> {
  return authFetch<{ total: number; data: ContactMessage[] }>('/api/admin/messages');
}

// ---- Admin: site settings ----

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
}

export async function getSettings(): Promise<ApiResult<{ data: SiteSettings }>> {
  // The settings GET is public, but we reuse authFetch for a consistent shape.
  return authFetch<{ data: SiteSettings }>('/api/settings');
}

export async function updateSettings(
  input: SiteSettings,
): Promise<ApiResult<{ data: SiteSettings }>> {
  return authFetch<{ data: SiteSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// ---- Admin: per-page SEO ----

export interface SeoPage {
  slug: string;
  title: string;
  description: string;
  ogImage: string;
}

export async function listSeoPages(): Promise<ApiResult<{ data: SeoPage[] }>> {
  return authFetch<{ data: SeoPage[] }>('/api/admin/seo');
}

export async function updateSeoPage(
  slug: string,
  input: { title: string; description: string; ogImage: string },
): Promise<ApiResult<{ data: SeoPage }>> {
  return authFetch<{ data: SeoPage }>(`/api/admin/seo/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// ---- Admin: FAQ ----

export interface FaqAdminItem {
  id: string;
  q: string;
  a: string;
  order: number;
}

export interface FaqAdminCategory {
  id: string;
  slug: string;
  label: string;
  order: number;
  faqs: FaqAdminItem[];
}

export async function listAdminFaq(): Promise<ApiResult<{ data: FaqAdminCategory[] }>> {
  return authFetch<{ data: FaqAdminCategory[] }>('/api/admin/faq');
}

export async function createFaqCategory(input: {
  label: string;
  order?: number;
}): Promise<ApiResult<{ data: { id: string; label: string; order: number } }>> {
  return authFetch('/api/admin/faq/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateFaqCategory(
  id: string,
  input: { label?: string; order?: number },
): Promise<ApiResult<{ data: { id: string; label: string; order: number } }>> {
  return authFetch(`/api/admin/faq/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteFaqCategory(id: string): Promise<ApiResult<{ message: string }>> {
  return authFetch(`/api/admin/faq/categories/${id}`, { method: 'DELETE' });
}

export async function createFaqItem(input: {
  categoryId: string;
  question: string;
  answer: string;
  order?: number;
}): Promise<ApiResult<{ data: { id: string } }>> {
  return authFetch('/api/admin/faq/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateFaqItem(
  id: string,
  input: { question?: string; answer?: string; order?: number; categoryId?: string },
): Promise<ApiResult<{ data: { id: string } }>> {
  return authFetch(`/api/admin/faq/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteFaqItem(id: string): Promise<ApiResult<{ message: string }>> {
  return authFetch(`/api/admin/faq/items/${id}`, { method: 'DELETE' });
}
