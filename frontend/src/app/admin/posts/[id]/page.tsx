'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import PostForm from '@/components/PostForm';
import { listAdminPosts, updatePost, type AdminPost, type PostInput } from '@/lib/adminApi';

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      // The admin list returns full posts (including content) — find by id.
      const res = await listAdminPosts();
      if (res.ok && res.data) {
        const found = res.data.data.find((p) => p.id === id);
        if (found) {
          setPost(found);
        } else {
          setError('Post not found.');
        }
      } else {
        setError(res.error || 'Failed to load the post.');
      }
      setLoading(false);
    })();
  }, [id]);

  const handleUpdate = async (input: PostInput) => {
    const res = await updatePost(id, input);
    return { ok: res.ok, error: res.error };
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Edit Post
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Update an existing blog article.
        </p>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading post…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {!loading && post && (
        <PostForm initial={post} onSubmit={handleUpdate} submitLabel="Save Changes" />
      )}
    </AdminShell>
  );
}
