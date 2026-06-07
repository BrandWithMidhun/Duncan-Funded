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

// ---- Content Blocks ----

export interface ContentBlock {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'url';
  default: string;
  value: string;
  help?: string;
}

export interface ContentSection {
  page: string;
  label: string;
  blocks: ContentBlock[];
}

export async function listContent(): Promise<ApiResult<{ data: ContentSection[] }>> {
  return authFetch<{ data: ContentSection[] }>('/api/admin/content');
}

export async function updateContent(
  values: Record<string, string>,
): Promise<ApiResult<{ data: { updated: number } }>> {
  return authFetch<{ data: { updated: number } }>('/api/admin/content', {
    method: 'PUT',
    body: JSON.stringify(values),
  });
}

// ---- Programs ----

export interface ProgramAddon {
  id: string;
  label: string;
  percent: number;
  group?: string;
}

export interface Program {
  id: string;
  slug: string;
  category: 'forex' | 'crypto' | 'futures' | 'equities';
  name: string;
  popular: boolean;
  platforms: string[];
  sizes: number[];
  prices: Record<number, number>;
  rules: string[];
  addons: ProgramAddon[];
  order: number;
}

export async function listPrograms(): Promise<ApiResult<{ data: Program[] }>> {
  return authFetch<{ data: Program[] }>('/api/admin/programs');
}

export async function getProgram(id: string): Promise<ApiResult<{ data: Program }>> {
  return authFetch<{ data: Program }>(`/api/admin/programs/${id}`);
}

export async function createProgram(
  input: Omit<Program, 'id' | 'slug'>,
): Promise<ApiResult<{ data: Program }>> {
  return authFetch<{ data: Program }>('/api/admin/programs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProgram(
  id: string,
  input: Partial<Omit<Program, 'id' | 'slug'>>,
): Promise<ApiResult<{ data: Program }>> {
  return authFetch<{ data: Program }>(`/api/admin/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProgram(id: string): Promise<ApiResult<{ message: string }>> {
  return authFetch<{ message: string }>(`/api/admin/programs/${id}`, { method: 'DELETE' });
}

// ---- Chats (admin) ----

export interface AdminChatSession {
  id: string;
  visitorId: string;
  ipAddress: string | null;
  createdAt: string;
  lastMessageAt: string;
  flagged: boolean;
  exemplar: boolean;
  messageCount: number;
  firstUserMessage: string;
}

export interface AdminChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
}

export interface AdminChatDetail extends Omit<AdminChatSession, 'messageCount' | 'firstUserMessage'> {
  userAgent: string | null;
  messages: AdminChatMessage[];
}

export interface AdminChatUsage {
  yearMonth: string;
  tokensIn: number;
  tokensOut: number;
  messageCount: number;
}

export async function listChats(opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams();
  if (opts.limit) qs.set('limit', String(opts.limit));
  if (opts.offset) qs.set('offset', String(opts.offset));
  const url = `/api/admin/chats${qs.toString() ? `?${qs.toString()}` : ''}`;
  return authFetch<{ data: AdminChatSession[] }>(url);
}

export async function getChat(id: string) {
  return authFetch<{ data: AdminChatDetail }>(`/api/admin/chats/${id}`);
}

export async function setChatFlags(
  id: string,
  flags: { flagged?: boolean; exemplar?: boolean },
) {
  return authFetch<{ data: AdminChatDetail }>(`/api/admin/chats/${id}/flags`, {
    method: 'PUT',
    body: JSON.stringify(flags),
  });
}

export async function deleteChat(id: string) {
  return authFetch<{ message: string }>(`/api/admin/chats/${id}`, { method: 'DELETE' });
}

export async function chatUsage() {
  return authFetch<{ data: AdminChatUsage }>('/api/admin/chats/usage');
}

// ---- Chat restrictions (admin) ----

export interface CoreRestrictionPattern {
  id: string;
  label: string;
  source: string;
}

export interface CustomRestriction {
  id: string;
  pattern: string;
  notes: string;
  isRegex: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestrictionsResponse {
  core: CoreRestrictionPattern[];
  custom: CustomRestriction[];
}

export async function listRestrictions() {
  return authFetch<{ data: RestrictionsResponse }>('/api/admin/chat-restrictions');
}

export async function createRestriction(input: {
  pattern: string;
  notes?: string;
  isRegex?: boolean;
  enabled?: boolean;
}) {
  return authFetch<{ data: CustomRestriction; message: string }>(
    '/api/admin/chat-restrictions',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export async function updateRestriction(
  id: string,
  input: Partial<{ pattern: string; notes: string; isRegex: boolean; enabled: boolean }>,
) {
  return authFetch<{ data: CustomRestriction; message: string }>(
    `/api/admin/chat-restrictions/${id}`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

export async function deleteRestriction(id: string) {
  return authFetch<{ message: string }>(`/api/admin/chat-restrictions/${id}`, {
    method: 'DELETE',
  });
}

// ---- Audit log + login attempts (admin) ----

export interface AdminAuditEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  method: string;
  path: string;
  status: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LoginAttemptEntry {
  id: number;
  email: string | null;
  ipAddress: string | null;
  success: boolean;
  reason: string | null;
  createdAt: string;
}

export async function listAudit(opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams();
  if (opts.limit) qs.set('limit', String(opts.limit));
  if (opts.offset) qs.set('offset', String(opts.offset));
  const url = `/api/admin/audit${qs.toString() ? `?${qs.toString()}` : ''}`;
  return authFetch<{ data: AdminAuditEntry[] }>(url);
}

export async function listLoginAttempts(limit = 100) {
  return authFetch<{ data: LoginAttemptEntry[] }>(
    `/api/admin/audit/login-attempts?limit=${limit}`,
  );
}
