'use client';

import AdminShell from '@/components/AdminShell';
import PostForm from '@/components/PostForm';
import { createPost, type PostInput } from '@/lib/adminApi';

export default function NewPostPage() {
  const handleCreate = async (input: PostInput) => {
    const res = await createPost(input);
    return { ok: res.ok, error: res.error };
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          New Post
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Create a new blog article.
        </p>
      </div>
      <PostForm onSubmit={handleCreate} submitLabel="Create Post" />
    </AdminShell>
  );
}
