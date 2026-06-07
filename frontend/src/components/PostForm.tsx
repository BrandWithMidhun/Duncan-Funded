'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PostInput, AdminPost } from '@/lib/adminApi';
import MarkdownEditor from './MarkdownEditor';

interface Props {
  initial?: AdminPost;
  onSubmit: (input: PostInput) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
}

/** Create / edit form for a blog post. */
export default function PostForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage || '');
  const [category, setCategory] = useState(initial?.category?.name || '');
  const [tags, setTags] = useState((initial?.tags || []).map((t) => t.name).join(', '));
  const [status, setStatus] = useState(initial?.status || 'DRAFT');
  const [featured, setFeatured] = useState(initial?.featured || false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (excerpt.trim().length < 10) return setError('Excerpt must be at least 10 characters.');
    if (content.trim().length < 20) return setError('Content must be at least 20 characters.');

    const input: PostInput = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage.trim() || null,
      status,
      featured,
      categoryName: category.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };

    setSaving(true);
    const res = await onSubmit(input);
    setSaving(false);

    if (res.ok) {
      router.push('/admin/posts');
    } else {
      setError(res.error || 'Failed to save the post.');
    }
  };

  const inputClass =
    'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition';
  const labelClass =
    'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Post title"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className={labelClass}>
          Excerpt <span className="text-wool-muted/50">(used in listings &amp; meta description)</span>
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="A short summary of the article"
        />
      </div>

      <div>
        <label htmlFor="coverImage" className={labelClass}>
          Feature Image URL{' '}
          <span className="text-wool-muted/50">(shown on the post &amp; in listings)</span>
        </label>
        <input
          id="coverImage"
          type="url"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          className={inputClass}
          placeholder="https://example.com/image.jpg"
        />
        <p className="font-body text-xs text-wool-muted/60 mt-2">
          Recommended: 1600 × 900px (16:9), JPG or WebP, under 500&nbsp;KB for fast loading.
        </p>
        {coverImage.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage.trim()}
            alt="Feature image preview"
            className="mt-3 rounded-sm border border-gold/20 max-h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div>
        <label htmlFor="content" className={labelClass}>
          Content
        </label>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Write your article — use the toolbar for formatting, or just type."
        />
        <p className="font-body text-[11px] text-wool-muted/60 mt-2">
          Type freely. Keyboard shortcuts: <strong className="text-gold">Cmd/Ctrl+B</strong> bold,{' '}
          <strong className="text-gold">Cmd/Ctrl+I</strong> italic,{' '}
          <strong className="text-gold">Cmd/Ctrl+K</strong> link. Saved as Markdown.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder="e.g. Strategy"
          />
        </div>
        <div>
          <label htmlFor="tags" className={labelClass}>
            Tags <span className="text-wool-muted/50">(comma-separated)</span>
          </label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="forex, risk, tips"
          />
        </div>
      </div>

      <details className="border border-gold/15 rounded-sm bg-highland/30">
        <summary className="font-body text-xs uppercase tracking-widest text-wool-muted px-4 py-3 cursor-pointer">
          SEO overrides (optional)
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div>
            <label htmlFor="metaTitle" className={labelClass}>
              Meta title
            </label>
            <input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputClass}
              placeholder="Defaults to the post title"
            />
          </div>
          <div>
            <label htmlFor="metaDescription" className={labelClass}>
              Meta description
            </label>
            <textarea
              id="metaDescription"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Defaults to the excerpt"
            />
          </div>
        </div>
      </details>

      <div className="grid sm:grid-cols-2 gap-6 items-end">
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <label className="flex items-center gap-3 font-body text-sm text-wool cursor-pointer pb-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 accent-[hsl(43,62%,51%)]"
          />
          Feature this post
        </label>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-8 py-3 rounded-sm hover:text-gold-light transition-all disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/posts')}
          className="font-body text-xs tracking-wider uppercase text-wool-muted hover:text-gold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
