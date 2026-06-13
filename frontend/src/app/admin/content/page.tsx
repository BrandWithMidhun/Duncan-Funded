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
 * Admin Site Content editor — page-grouped tabs.
 *
 * Tabs at the top are one-per-page (Homepage, Trader Arsenal, About,
 * Contact, Footer). All sections belonging to the same page render
 * stacked under that tab so admin doesn't see 9 separate tabs for
 * what is conceptually "the home page". A small ● dot appears on a
 * tab when any field inside it has unsaved changes. Active tab is
 * mirrored to ?tab=<page-slug> via window.history so refresh and
 * back-button preserve position.
 *
 * Visually mirrors /admin/settings — text labels with a gold
 * underline indicator on the active one, no boxed tab buttons.
 *
 * Save behaviour is unchanged: one Save Changes button POSTs the
 * full draft set in one request, so cross-page edits persist together.
 */

/** Friendly page-name labels keyed by the section.page slug.
 *  Anything not in the map falls back to a capitalized slug. */
const PAGE_LABELS: Record<string, string> = {
  home: 'Homepage',
  'trade-zone': 'Trader Arsenal',
  about: 'About',
  contact: 'Contact',
  footer: 'Footer',
};

/** Preferred display order — anything outside this list appears after,
 *  alphabetised. Keeps Homepage first since it's edited most often. */
const PAGE_ORDER: string[] = ['home', 'trade-zone', 'about', 'contact', 'footer'];

function prettyPage(page: string): string {
  if (PAGE_LABELS[page]) return PAGE_LABELS[page];
  return page
    .split(/[-_]/)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(' ');
}

function pageOrderIndex(page: string): number {
  const i = PAGE_ORDER.indexOf(page);
  return i === -1 ? PAGE_ORDER.length + 1 : i;
}

/** Strip the "Homepage — " / "Trader Arsenal — " prefix so the
 *  section sub-header inside a tab doesn't repeat the page name. */
function stripSectionPrefix(label: string): string {
  const dashIdx = label.indexOf(' — ');
  return dashIdx > 0 ? label.slice(dashIdx + 3) : label;
}

export default function AdminContentPage() {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

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

        // Pick a sensible default tab if URL doesn't carry a valid one.
        const pages = Array.from(new Set(res.data.data.map((s) => s.page)));
        pages.sort((a, b) => pageOrderIndex(a) - pageOrderIndex(b));
        const requested =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('tab') || ''
            : '';
        const valid = pages.includes(requested);
        if (!valid && pages[0]) setActiveTab(pages[0]);
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
      const refreshed = await listContent();
      if (refreshed.ok && refreshed.data) setSections(refreshed.data.data);
    } else {
      setError(res.error || 'Save failed.');
    }
  };

  // Group sections by page slug, in the configured display order.
  const pages = useMemo(() => {
    const byPage = new Map<string, ContentSection[]>();
    for (const s of sections) {
      const list = byPage.get(s.page) || [];
      list.push(s);
      byPage.set(s.page, list);
    }
    return Array.from(byPage.entries())
      .map(([page, sectionsForPage]) => ({ page, sections: sectionsForPage }))
      .sort((a, b) => pageOrderIndex(a.page) - pageOrderIndex(b.page));
  }, [sections]);

  // Per-page unsaved-changes detection — used both to put a ● on each
  // tab and to enable / disable the Save button.
  const pageHasChanges = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const { page, sections: sectionsForPage } of pages) {
      map[page] = sectionsForPage.some((s) =>
        s.blocks.some((b) => (drafts[b.key] ?? '') !== (b.value ?? '')),
      );
    }
    return map;
  }, [pages, drafts]);

  const hasAnyChanges = Object.values(pageHasChanges).some(Boolean);
  const currentPage =
    pages.find((p) => p.page === activeTab) || pages[0] || null;

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Site Content
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            Edit text and links across the site. Empty fields fall back to their default value.
            Switch pages with the tabs below.
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

      {pages.length > 0 && (
        <div className="max-w-3xl">
          {/* Tab strip — matches /admin/settings styling: plain text
              labels, gold underline indicator, no boxed buttons. */}
          <div
            role="tablist"
            aria-label="Site content pages"
            className="flex flex-wrap border-b border-gold/20 mb-8 -mx-2"
          >
            {pages.map(({ page }) => {
              const active = page === currentPage?.page;
              const dirty = pageHasChanges[page];
              return (
                <button
                  key={page}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(page)}
                  className={`font-body text-xs tracking-wider uppercase px-4 py-3 mx-2 transition-colors ${
                    active
                      ? 'text-gold border-b-2 border-gold -mb-px'
                      : 'text-wool-muted hover:text-wool'
                  }`}
                >
                  {prettyPage(page)}
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

          {/* Stacked sections for the active page */}
          {currentPage && (
            <div className="space-y-8">
              {currentPage.sections.map((section) => (
                <section
                  key={section.page + '|' + section.label}
                  className="border border-gold/15 bg-highland/30 rounded-sm p-6"
                >
                  <h2 className="font-display text-base text-gold tracking-wider uppercase mb-1">
                    {stripSectionPrefix(section.label)}
                  </h2>
                  <p className="font-body text-xs text-wool-muted/70 mb-5">
                    {section.blocks.length} field
                    {section.blocks.length === 1 ? '' : 's'}
                  </p>
                  <div className="space-y-5">
                    {section.blocks.map((block) => {
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
              ))}

              <div className="flex items-center justify-end gap-3 sticky bottom-6 z-10">
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
        </div>
      )}
    </AdminShell>
  );
}
