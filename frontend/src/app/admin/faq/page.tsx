'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import AdminShell from '@/components/AdminShell';
import {
  listAdminFaq,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  type FaqAdminCategory,
} from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-3 py-2 rounded-sm font-body text-wool focus:border-gold outline-none transition text-sm';

export default function AdminFaqPage() {
  const [cats, setCats] = useState<FaqAdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // New-category form
  const [newCatLabel, setNewCatLabel] = useState('');

  // Track which items are being edited
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ q: string; a: string }>({ q: '', a: '' });

  // New-item form per category
  const [newItem, setNewItem] = useState<Record<string, { q: string; a: string }>>({});

  const load = async () => {
    setLoading(true);
    const res = await listAdminFaq();
    if (res.ok && res.data) {
      setCats(res.data.data);
      setError('');
    } else {
      setError(res.error || 'Failed to load FAQ.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const guard = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = () =>
    guard(async () => {
      if (newCatLabel.trim().length < 2) return setError('Category label is too short.');
      const order = cats.length;
      const res = await createFaqCategory({ label: newCatLabel.trim(), order });
      if (!res.ok) {
        setError(res.error || 'Failed to create category.');
        return;
      }
      setNewCatLabel('');
      await load();
    });

  const handleRenameCategory = (id: string, newLabel: string) =>
    guard(async () => {
      const res = await updateFaqCategory(id, { label: newLabel });
      if (!res.ok) setError(res.error || 'Failed to rename.');
      await load();
    });

  const handleDeleteCategory = (cat: FaqAdminCategory) =>
    guard(async () => {
      if (
        !window.confirm(
          `Delete the "${cat.label}" category and all ${cat.faqs.length} of its questions? This cannot be undone.`,
        )
      )
        return;
      const res = await deleteFaqCategory(cat.id);
      if (!res.ok) setError(res.error || 'Failed to delete.');
      await load();
    });

  const handleAddItem = (cat: FaqAdminCategory) =>
    guard(async () => {
      const data = newItem[cat.id] || { q: '', a: '' };
      if (data.q.trim().length < 3 || data.a.trim().length < 2) {
        setError('Question (3+ chars) and answer (2+ chars) are required.');
        return;
      }
      const res = await createFaqItem({
        categoryId: cat.id,
        question: data.q,
        answer: data.a,
        order: cat.faqs.length,
      });
      if (!res.ok) {
        setError(res.error || 'Failed to add question.');
        return;
      }
      setNewItem((prev) => ({ ...prev, [cat.id]: { q: '', a: '' } }));
      await load();
    });

  const handleSaveItem = (itemId: string) =>
    guard(async () => {
      const res = await updateFaqItem(itemId, { question: draft.q, answer: draft.a });
      if (!res.ok) {
        setError(res.error || 'Failed to save.');
        return;
      }
      setEditingItem(null);
      await load();
    });

  const handleDeleteItem = (itemId: string) =>
    guard(async () => {
      if (!window.confirm('Delete this question?')) return;
      const res = await deleteFaqItem(itemId);
      if (!res.ok) setError(res.error || 'Failed to delete.');
      await load();
    });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          FAQ Manager
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Create categories and add questions inside each. Changes appear on the public site within a minute.
        </p>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {/* Add category */}
      <div className="border border-gold/15 bg-highland/30 rounded-sm p-4 mb-8 max-w-3xl flex items-center gap-3">
        <input
          value={newCatLabel}
          onChange={(e) => setNewCatLabel(e.target.value)}
          placeholder="New category label (e.g. Forex Programs)"
          className={`${inputClass} flex-1`}
          maxLength={120}
        />
        <button
          onClick={handleAddCategory}
          disabled={busy || newCatLabel.trim().length < 2}
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-5 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-50"
        >
          + Add Category
        </button>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {!loading && cats.length === 0 && (
        <p className="font-accent text-wool-muted italic">
          No categories yet. Add one above to get started.
        </p>
      )}

      <div className="space-y-6 max-w-3xl">
        {cats.map((cat) => (
          <div
            key={cat.id}
            className="border border-gold/15 bg-highland/30 rounded-sm overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center gap-2 p-4 border-b border-gold/10">
              <input
                defaultValue={cat.label}
                onBlur={(e) => {
                  if (e.target.value.trim() !== cat.label) {
                    handleRenameCategory(cat.id, e.target.value.trim());
                  }
                }}
                className={`${inputClass} flex-1 font-display text-base text-gold tracking-wider uppercase`}
                maxLength={120}
              />
              <span className="font-body text-xs text-wool-muted">
                {cat.faqs.length} {cat.faqs.length === 1 ? 'item' : 'items'}
              </span>
              <button
                onClick={() => handleDeleteCategory(cat)}
                disabled={busy}
                className="font-body text-xs tracking-wider text-heritage hover:opacity-80 uppercase px-2"
              >
                Delete
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-gold/10">
              {cat.faqs.map((it) => {
                const isEditing = editingItem === it.id;
                return (
                  <div key={it.id} className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={draft.q}
                          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                          placeholder="Question"
                          className={inputClass}
                        />
                        <textarea
                          value={draft.a}
                          onChange={(e) => setDraft({ ...draft, a: e.target.value })}
                          placeholder={
                            'Answer — supports Markdown.\n\nBlank line between paragraphs.\n- Bullet points like this\n- Use **bold** and *italic*\n- Links: [label](https://example.com)'
                          }
                          rows={10}
                          className={`${inputClass} resize-y font-mono text-[13px] leading-relaxed`}
                        />
                        <p className="font-body text-[11px] text-wool-muted/60">
                          Supports Markdown. Use blank lines between paragraphs,{' '}
                          <code className="text-gold">- item</code> for bullet points,{' '}
                          <code className="text-gold">**bold**</code>,{' '}
                          <code className="text-gold">*italic*</code>, and{' '}
                          <code className="text-gold">[label](url)</code> for links. Single
                          line breaks are preserved.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSaveItem(it.id)}
                            disabled={busy}
                            className="font-display text-xs tracking-wider uppercase text-gold border border-gold/40 px-4 py-1.5 rounded-sm hover:bg-gold/5"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="font-body text-xs text-wool-muted hover:text-gold uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-wool mb-2">{it.q}</p>
                          <div className="font-body text-xs text-wool-muted leading-relaxed admin-faq-preview">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={{
                                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: (props) => (
                                  <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-0.5" {...props} />
                                ),
                                ol: (props) => (
                                  <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-0.5" {...props} />
                                ),
                                a: (props) => (
                                  <a className="text-gold underline break-words" {...props} />
                                ),
                                strong: (props) => <strong className="text-wool" {...props} />,
                                code: (props) => (
                                  <code
                                    className="px-1 py-0.5 rounded-sm bg-pine/60 border border-gold/15 text-gold text-[11px]"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {it.a}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingItem(it.id);
                              setDraft({ q: it.q, a: it.a });
                            }}
                            className="font-body text-xs tracking-wider text-gold hover:text-gold-light uppercase"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            disabled={busy}
                            className="font-body text-xs tracking-wider text-heritage hover:opacity-80 uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add item */}
              <div className="p-4 bg-pine/30">
                <input
                  value={(newItem[cat.id]?.q) || ''}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      [cat.id]: { q: e.target.value, a: prev[cat.id]?.a || '' },
                    }))
                  }
                  placeholder="New question…"
                  className={`${inputClass} mb-2`}
                />
                <textarea
                  value={(newItem[cat.id]?.a) || ''}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      [cat.id]: { q: prev[cat.id]?.q || '', a: e.target.value },
                    }))
                  }
                  placeholder="Answer — Markdown supported"
                  rows={5}
                  className={`${inputClass} resize-y mb-1 font-mono text-[13px] leading-relaxed`}
                />
                <p className="font-body text-[10px] text-wool-muted/60 mb-2">
                  Markdown supported: blank lines = paragraphs,{' '}
                  <code className="text-gold">- item</code> = bullets,{' '}
                  <code className="text-gold">**bold**</code>,{' '}
                  <code className="text-gold">[label](url)</code>.
                </p>
                <button
                  onClick={() => handleAddItem(cat)}
                  disabled={busy}
                  className="font-display text-xs tracking-wider uppercase text-gold border border-gold/40 px-4 py-1.5 rounded-sm hover:bg-gold/5"
                >
                  + Add Question
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
