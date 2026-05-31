'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { listSeoPages, updateSeoPage, type SeoPage } from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition';
const labelClass = 'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';

export default function AdminSeoPage() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await listSeoPages();
      if (res.ok && res.data) {
        setPages(res.data.data);
      } else {
        setError(res.error || 'Failed to load SEO settings.');
      }
      setLoading(false);
    })();
  }, []);

  const updateField = (slug: string, field: keyof SeoPage, value: string) => {
    setPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, [field]: value } : p)),
    );
  };

  const handleSave = async (page: SeoPage) => {
    setSavingSlug(page.slug);
    setSuccessSlug(null);
    setError('');
    const res = await updateSeoPage(page.slug, {
      title: page.title,
      description: page.description,
      ogImage: page.ogImage,
    });
    setSavingSlug(null);
    if (res.ok) {
      setSuccessSlug(page.slug);
      setTimeout(() => setSuccessSlug((s) => (s === page.slug ? null : s)), 2500);
    } else {
      setError(res.error || 'Failed to save.');
    }
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Page SEO
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Edit the title, description, and social-share image for each page.
          Empty fields fall back to sensible defaults.
        </p>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {!loading && pages.length > 0 && (
        <div className="space-y-6 max-w-3xl">
          {pages.map((page) => (
            <div
              key={page.slug}
              className="border border-gold/15 bg-highland/30 rounded-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base text-gold tracking-wider uppercase">
                  /{page.slug === 'home' ? '' : page.slug}
                </h2>
                <span className="font-body text-xs text-wool-muted/60 uppercase tracking-wider">
                  {page.slug}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    value={page.title}
                    onChange={(e) => updateField(page.slug, 'title', e.target.value)}
                    className={inputClass}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={page.description}
                    onChange={(e) =>
                      updateField(page.slug, 'description', e.target.value)
                    }
                    rows={2}
                    className={`${inputClass} resize-none`}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Social-share image URL{' '}
                    <span className="text-wool-muted/50">(optional)</span>
                  </label>
                  <input
                    value={page.ogImage}
                    onChange={(e) => updateField(page.slug, 'ogImage', e.target.value)}
                    className={inputClass}
                    placeholder="https://example.com/og.jpg"
                    maxLength={500}
                  />
                  <p className="font-body text-xs text-wool-muted/60 mt-2">
                    Recommended: 1200 × 630px, JPG or PNG, under 1&nbsp;MB.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSave(page)}
                    disabled={savingSlug === page.slug}
                    className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-60"
                  >
                    {savingSlug === page.slug ? 'Saving…' : 'Save'}
                  </button>
                  {successSlug === page.slug && (
                    <span className="font-body text-xs text-[hsl(150,60%,55%)]">
                      ✓ Saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
