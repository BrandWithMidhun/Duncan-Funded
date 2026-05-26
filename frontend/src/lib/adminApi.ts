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
