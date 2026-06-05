'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  listContent,
  updateContent,
  type ContentSection,
} from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool text-sm focus:border-gold outline-none transition';
const labelClass =
  'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';

export default function AdminContentPage() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await listContent();
      if (res.ok && res.data) {
        setSections(res.data.data);
        const initial: Record<string, string> = {};
        for (const s of res.data.data) {
          for (const b of s.blocks) initial[b.key] = b.value;
        }
        setDrafts(initial);
      } else {
        setError(res.error || 'Failed to load content.');
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = (key: string, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  };

  const handleReset = (key: string, defaultVal: string) => {
    setDrafts((d) => ({ ...d, [key]: defaultVal }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const res = await updateContent(drafts);
    setSaving(false);
    if (res.ok) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } else {
      setError(res.error || 'Save failed.');
    }
  };

  const hasChanges = (() => {
    for (const s of sections) {
      for (const b of s.blocks) {
        if ((drafts[b.key] ?? '') !== (b.value ?? '')) return true;
      }
    }
    return false;
  })();

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Site Content
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            Edit text and links across the site. Empty fields fall back to their default value.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedAt && (
            <span className="font-body text-xs text-[hsl(150,60%,55%)]">✓ Saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      <div className="space-y-8 max-w-3xl">
        {sections.map((section) => (
          <section
            key={section.page}
            className="border border-gold/15 bg-highland/30 rounded-sm p-6"
          >
            <h2 className="font-display text-base text-gold tracking-wider uppercase mb-5">
              {section.label}
            </h2>
            <div className="space-y-5">
              {section.blocks.map((block) => {
                const currentValue = drafts[block.key] ?? '';
                const isChanged = currentValue !== block.value;
                return (
                  <div key={block.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelClass} htmlFor={block.key}>
                        {block.label}
                        {isChanged && <span className="ml-2 text-gold text-[10px]">●</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleReset(block.key, block.default)}
                        className="font-body text-[10px] tracking-wider uppercase text-wool-muted/60 hover:text-gold"
                      >
                        Reset to Default
                      </button>
                    </div>
                    {block.kind === 'textarea' ? (
                      <textarea
                        id={block.key}
                        value={currentValue}
                        onChange={(e) => handleChange(block.key, e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-none`}
                        maxLength={4000}
                      />
                    ) : (
                      <input
                        id={block.key}
                        type={block.kind === 'url' ? 'text' : 'text'}
                        value={currentValue}
                        onChange={(e) => handleChange(block.key, e.target.value)}
                        className={inputClass}
                        maxLength={4000}
                        placeholder={
                          block.kind === 'url' ? '/programs or https://example.com' : undefined
                        }
                      />
                    )}
                    {block.help && (
                      <p className="font-body text-xs text-wool-muted/60 mt-1.5">{block.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {sections.length > 0 && (
        <div className="mt-8 max-w-3xl flex items-center justify-end gap-3 sticky bottom-6 z-10">
          {savedAt && (
            <span className="font-body text-xs text-[hsl(150,60%,55%)]">✓ Saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-pine/95 backdrop-blur-sm shadow-lg"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </AdminShell>
  );
}
