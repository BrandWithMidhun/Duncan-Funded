'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { searchSite, type SearchResults } from '@/lib/api';

const MIN_LEN = 2;
const DEBOUNCE_MS = 220;

const CATEGORY_LABEL: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  futures: 'Futures',
  equities: 'Equities',
};

interface Props {
  /** When true, the bar is rendered always-visible (mobile menu).
   *  Otherwise it starts as a small icon that expands on click. */
  alwaysOpen?: boolean;
}

export default function NavbarSearch({ alwaysOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(alwaysOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opening; debounced fetch as user types.
  useEffect(() => {
    if (open && !alwaysOpen) {
      // small delay so the input is in the DOM before focusing
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, alwaysOpen]);

  useEffect(() => {
    if (query.trim().length < MIN_LEN) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const r = await searchSite(query.trim());
      setResults(r);
      setLoading(false);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
      setLoading(false);
    };
  }, [query]);

  // Close on outside click (only when in expanding mode).
  useEffect(() => {
    if (alwaysOpen) return;
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, alwaysOpen]);

  // Esc closes / clears
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) {
          setQuery('');
          setResults(null);
        } else if (!alwaysOpen) {
          setOpen(false);
        }
      }
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, query, alwaysOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < MIN_LEN) return;
    setOpen(false);
    setResults(null);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleResultClick = () => {
    setOpen(false);
    setResults(null);
    setQuery('');
  };

  // Collapsed icon mode (desktop default)
  if (!open && !alwaysOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="text-wool-muted hover:text-gold transition-colors p-2"
      >
        <Search className="w-4 h-4" strokeWidth={1.8} />
      </button>
    );
  }

  const hasResults =
    results && (results.posts.length || results.faqs.length || results.programs.length);

  return (
    <div ref={containerRef} className={`relative ${alwaysOpen ? 'w-full' : ''}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wool-muted/60 pointer-events-none"
          strokeWidth={1.8}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programs, FAQs, blog…"
          className={`bg-pine/70 border border-gold/20 focus:border-gold/60 rounded-sm pl-9 pr-9 py-2 font-body text-sm text-wool placeholder:text-wool-muted/50 outline-none transition-colors ${
            alwaysOpen ? 'w-full' : 'w-56 lg:w-72'
          }`}
          maxLength={120}
        />
        {(query || !alwaysOpen) && (
          <button
            type="button"
            onClick={() => {
              if (query) {
                setQuery('');
                setResults(null);
                inputRef.current?.focus();
              } else {
                setOpen(false);
              }
            }}
            aria-label={query ? 'Clear search' : 'Close search'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-wool-muted/50 hover:text-gold p-1"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </form>

      {/* Dropdown of live results */}
      {open && query.trim().length >= MIN_LEN && (
        <div
          className={`absolute right-0 mt-2 bg-pine/98 backdrop-blur-md border border-gold/25 rounded-sm shadow-2xl shadow-black/50 overflow-hidden ${
            alwaysOpen ? 'left-0 w-full' : 'w-[28rem] max-w-[calc(100vw-2rem)]'
          }`}
        >
          {loading && !results && (
            <div className="px-4 py-6 font-accent italic text-sm text-wool-muted/70 text-center">
              Searching…
            </div>
          )}

          {results && !hasResults && (
            <div className="px-4 py-6 font-body text-sm text-wool-muted text-center">
              No matches for <span className="text-gold">&ldquo;{results.query}&rdquo;</span>.
            </div>
          )}

          {results && hasResults && (
            <div className="max-h-[70vh] overflow-y-auto">
              {results.programs.length > 0 && (
                <ResultGroup label="Programs">
                  {results.programs.map((p) => (
                    <Link
                      key={p.id}
                      href="/programs"
                      onClick={handleResultClick}
                      className="block px-4 py-2.5 hover:bg-gold/8 border-l-2 border-transparent hover:border-gold transition-all"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-sm tracking-wider text-gold truncate">
                          {p.name}
                        </span>
                        <span className="font-body text-[10px] tracking-wider text-wool-muted uppercase shrink-0">
                          {CATEGORY_LABEL[p.category] || p.category}
                          {p.popular ? ' · Popular' : ''}
                        </span>
                      </div>
                      {p.matchingRules[0] && (
                        <p className="font-body text-xs text-wool-muted/70 mt-1 truncate">
                          {p.matchingRules[0]}
                        </p>
                      )}
                    </Link>
                  ))}
                </ResultGroup>
              )}

              {results.faqs.length > 0 && (
                <ResultGroup label="FAQ">
                  {results.faqs.map((f) => (
                    <Link
                      key={f.id}
                      href={`/faq#${f.categorySlug}`}
                      onClick={handleResultClick}
                      className="block px-4 py-2.5 hover:bg-gold/8 border-l-2 border-transparent hover:border-gold transition-all"
                    >
                      <div className="font-body text-sm text-wool truncate">{f.question}</div>
                      <div className="font-body text-xs text-wool-muted/60 mt-0.5 truncate">
                        {f.categoryLabel}
                      </div>
                    </Link>
                  ))}
                </ResultGroup>
              )}

              {results.posts.length > 0 && (
                <ResultGroup label="Blog">
                  {results.posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      onClick={handleResultClick}
                      className="block px-4 py-2.5 hover:bg-gold/8 border-l-2 border-transparent hover:border-gold transition-all"
                    >
                      <div className="font-body text-sm text-wool truncate">{p.title}</div>
                      {p.excerpt && (
                        <div className="font-body text-xs text-wool-muted/70 mt-0.5 line-clamp-2">
                          {p.excerpt}
                        </div>
                      )}
                    </Link>
                  ))}
                </ResultGroup>
              )}

              {results.total > 0 && (
                <button
                  type="button"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="w-full px-4 py-2.5 font-body text-xs tracking-wider text-gold hover:text-gold-light border-t border-gold/10 hover:bg-gold/5 uppercase text-center transition-colors"
                >
                  See all {results.total} result{results.total === 1 ? '' : 's'} →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 font-body text-[10px] tracking-[0.2em] text-wool-muted/60 uppercase">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
