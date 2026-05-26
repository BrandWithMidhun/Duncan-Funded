'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { listAdminPosts, deletePost, type AdminPost } from '@/lib/adminApi';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await listAdminPosts();
    if (res.ok && res.data) {
      setPosts(res.data.data);
      setError('');
    } else {
      setError(res.error || 'Failed to load posts.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (post: AdminPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    const res = await deletePost(post.id);
    setDeletingId(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } else {
      window.alert(res.error || 'Failed to delete the post.');
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Posts
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-3 rounded-sm hover:text-gold-light transition-all"
        >
          New Post
        </Link>
      </div>

      {loading && (
        <p className="font-accent text-wool-muted italic">Loading posts…</p>
      )}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="font-accent text-wool-muted italic">
          No posts yet. Create your first article.
        </p>
      )}

      {!loading && posts.length > 0 && (
        <div className="border border-gold/15 rounded-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-highland/60">
              <tr className="font-body text-[11px] tracking-wider text-wool-muted uppercase">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-gold/10 font-body text-sm text-wool"
                >
                  <td className="px-4 py-3">
                    <span className="text-wool">{post.title}</span>
                    {post.featured && (
                      <span className="ml-2 text-[10px] text-gold uppercase tracking-wider">
                        ★ Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-wool-muted">
                    {post.category?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm ${
                        post.status === 'PUBLISHED'
                          ? 'bg-[hsl(150,40%,25%)] text-[hsl(150,60%,75%)]'
                          : post.status === 'DRAFT'
                            ? 'bg-navy text-wool-muted'
                            : 'bg-heritage/40 text-wool-muted'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-wool-muted">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="font-body text-xs tracking-wider text-gold hover:text-gold-light uppercase"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deletingId === post.id}
                        className="font-body text-xs tracking-wider text-heritage hover:opacity-80 uppercase disabled:opacity-50"
                      >
                        {deletingId === post.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
