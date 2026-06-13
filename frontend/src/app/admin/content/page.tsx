'use client';

import { useEffect, useMemo, useState } from 'react';
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

/**
 * Admin Site Content editor — tabbed by section.
 *
 * One tab per section (Homepage Hero, Programs, FAQ, etc.). Only the
 * active tab's fields render at a time so admins aren't scrolling
 * through dozens of inputs to find a single string. A small ● dot
 * appears on tabs that hold unsaved changes. The selected tab is
 * mirrored to the URL as ?tab=<page-slug> so a refresh keeps you
 * where you were and tabs are linkable.
 *
 * Save behaviour is unchanged from the previous single-page version:
 * the Save Changes button POSTs the entire draft set in one request,
 * so an admin can edit fields across multiple tabs and persist them
 * all at once.
 */
export default function AdminContentPage() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Which section's fields are currently visible. Defaults to the
  // first section once data has loaded; mirrored to the URL so
  // refresh/back-button preserve position. Reading the URL via
  // `window.location` (not next/navigation's useSearchParams) keeps
  // this page out of the Suspense-prerender path Next 16 requires.
  const initialTabFromUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('tab') || ''
      : '';
  const [activeTab, setActiveTab] = useState<string>(initialTabFromUrl);

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
        // If no tab in URL or the requested tab doesn't exist anymore,
        // fall back to the first available section.
        const first = res.data.data[0]?.page || '';
        const requested =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('tab') || ''
            : '';
        const valid = res.data.data.some((s) => s.page === requested);
        if (!valid && first) setActiveTab(first);
      } else {
        setError(res.error || 'Failed to load content.');
      }
      setLoading(false);
    })();
  }, []);

  const setTab = (page: string) => {
    setActiveTab(page);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', page);
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  };

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
      // Refresh server-side `value` baseline so unsaved dots disappear
      const refreshed = await listContent();
      if (refreshed.ok && refreshed.data) setSections(refreshed.data.data);
    } else {
      setError(res.error || 'Save failed.');
    }
  };

  // Per-section unsaved-changes detection — used both to mark the
  // overall Save button and to put a dot on individual tabs.
  const sectionHasChanges = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const s of sections) {
      map[s.page] = s.blocks.some(
        (b) => (drafts[b.key] ?? '') !== (b.value ?? ''),
      );
    }
    return map;
  }, [sections, drafts]);

  const hasAnyChanges = Object.values(sectionHasChanges).some(Boolean);
  const currentSection = sections.find((s) => s.page === activeTab) || sections[0];

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Site Content
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            Edit text and links across the site. Empty fields fall back to their default value.
            Switch sections with the tabs below.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedAt && (
            <span className="font-body text-xs text-[hsl(150,60%,55%)]">✓ Saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasAnyChanges || saving}
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

      {sections.length > 0 && (
        <>
          {/* Tab strip */}
          <div
            role="tablist"
            aria-label="Content sections"
            className="flex flex-wrap items-stretch gap-2 mb-6 border-b border-gold/15 pb-3"
          >
            {sections.map((s) => {
              const active = s.page === currentSection?.page;
              const dirty = sectionHasChanges[s.page];
              return (
                <button
                  key={s.page}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(s.page)}
                  className={`font-display text-xs tracking-[0.18em] uppercase px-4 py-2.5 rounded-sm border transition-colors ${
                    active
                      ? 'bg-highland text-gold border-gold/60 shadow-[0_0_18px_-6px_hsl(43_62%_51%/0.5)]'
                      : 'bg-highland/20 text-wool-muted border-gold/15 hover:text-gold hover:border-gold/40'
                  }`}
                >
                  {s.label}
                  {dirty && (
                    <span
                      className={`ml-2 text-[10px] ${active ? 'text-gold' : 'text-gold/70'}`}
                      aria-label="Unsaved changes"
                    >
                      ●
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active section's blocks */}
          {currentSection && (
            <div className="max-w-3xl">
              <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
                <h2 className="font-display text-base text-gold tracking-wider uppercase mb-1">
                  {currentSection.label}
                </h2>
                <p className="font-body text-xs text-wool-muted/70 mb-5">
                  {currentSection.blocks.length} field
                  {currentSection.blocks.length === 1 ? '' : 's'}
                </p>
                <div className="space-y-5">
                  {currentSection.blocks.map((block) => {
                    const currentValue = drafts[block.key] ?? '';
                    const isChanged = currentValue !== block.value;
                    return (
                      <div key={block.key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelClass} htmlFor={block.key}>
                            {block.label}
                            {isChanged && (
                              <span className="ml-2 text-gold text-[10px]">●</span>
                            )}
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
                            rows={4}
                            className={`${inputClass} resize-y`}
                            maxLength={4000}
                          />
                        ) : (
                          <input
                            id={block.key}
                            type="text"
                            value={currentValue}
                            onChange={(e) => handleChange(block.key, e.target.value)}
                            className={inputClass}
                            maxLength={4000}
                            placeholder={
                              block.kind === 'url'
                                ? '/programs or https://example.com'
                                : undefined
                            }
                          />
                        )}
                        {block.help && (
                          <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                            {block.help}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="mt-6 flex items-center justify-end gap-3 sticky bottom-6 z-10">
                {savedAt && (
                  <span className="font-body text-xs text-[hsl(150,60%,55%)]">✓ Saved</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasAnyChanges || saving}
                  className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-pine/95 backdrop-blur-sm shadow-lg"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
