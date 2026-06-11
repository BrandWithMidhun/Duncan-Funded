'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createTradeZoneTool,
  updateTradeZoneTool,
  type TradeZoneTool,
} from '@/lib/adminApi';
import { TRADE_ZONE_ICON_KEYS, pickToolIcon } from '@/lib/tradeZoneIcons';
import MarkdownEditor from './MarkdownEditor';

interface Props {
  mode: 'create' | 'edit';
  initial?: TradeZoneTool;
}

/**
 * Local form shape — matches the backend create/update payload.
 * Includes slug + detailContent, which are managed below.
 */
type FormState = {
  name: string;
  slug: string;
  description: string;
  iconKey: string;
  launchUrl: string;
  launchLabel: string;
  detailContent: string;
  order: number;
  enabled: boolean;
};

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  iconKey: 'activity',
  launchUrl: '',
  launchLabel: 'Launch',
  detailContent: '',
  order: 0,
  enabled: true,
};

/** Match the backend slugify rules so the live preview shows what
 *  the server will actually store. */
function localSlugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

export default function TradeZoneToolForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug || '',
          description: initial.description,
          iconKey: initial.iconKey,
          launchUrl: initial.launchUrl,
          launchLabel: initial.launchLabel,
          detailContent: initial.detailContent || '',
          order: initial.order,
          enabled: initial.enabled,
        }
      : EMPTY,
  );
  // Slug auto-fill behaviour: in create mode, if the admin hasn't typed
  // anything into the slug field, we keep deriving it from the name as
  // they type. Once they touch the slug field, we stop overriding it.
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const PreviewIcon = pickToolIcon(form.iconKey);
  const previewSlug = form.slug || localSlugify(form.name) || 'tool';

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.description.trim()) return setError('Description is required.');

    setBusy(true);
    const payload = { ...form };
    const res =
      mode === 'create'
        ? await createTradeZoneTool(payload)
        : await updateTradeZoneTool(initial!.id, payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error || 'Save failed.');
      return;
    }
    router.push('/admin/trade-zone');
    router.refresh();
  };

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => {
            set('name', e.target.value);
            // Auto-derive slug while admin hasn't touched the slug field
            if (!slugTouched) {
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: localSlugify(e.target.value),
              }));
            }
          }}
          maxLength={120}
          placeholder="e.g. Live Dashboard"
          className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Slug
        </label>
        <div className="flex items-stretch gap-0">
          <span className="font-body text-xs text-wool-muted bg-pine/40 border border-r-0 border-gold/20 rounded-l-sm px-3 flex items-center">
            /trade-zone/
          </span>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set('slug', localSlugify(e.target.value));
            }}
            placeholder={localSlugify(form.name) || 'tool-slug'}
            className="flex-1 bg-pine/60 border border-gold/20 rounded-r-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
          />
        </div>
        <p className="font-body text-[11px] text-wool-muted/60 mt-1">
          URL of the detail page. Auto-generated from the name; edit if you
          want a different path. Resulting URL:{' '}
          <code className="text-gold">/trade-zone/{previewSlug}</code>
        </p>
      </div>

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Card Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Short blurb shown on the Trader Arsenal card and the detail page hero."
          className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none resize-y"
        />
        <p className="font-body text-[11px] text-wool-muted/60 mt-1">
          {form.description.length}/600
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
            Icon
          </label>
          <div className="flex items-center gap-3">
            <select
              value={form.iconKey}
              onChange={(e) => set('iconKey', e.target.value)}
              className="flex-1 bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool focus:border-gold/60 focus:outline-none"
            >
              {TRADE_ZONE_ICON_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <div className="w-10 h-10 border border-gold/20 rounded-sm flex items-center justify-center bg-pine/60 shrink-0">
              <PreviewIcon className="w-5 h-5 text-gold" strokeWidth={1.25} />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
            Order
          </label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set('order', Number(e.target.value))}
            min={0}
            max={9999}
            className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool focus:border-gold/60 focus:outline-none"
          />
          <p className="font-body text-[11px] text-wool-muted/60 mt-1">
            Lower numbers show first.
          </p>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Launch URL Override (Optional)
        </label>
        <input
          type="text"
          value={form.launchUrl}
          onChange={(e) => set('launchUrl', e.target.value)}
          maxLength={500}
          placeholder="Leave empty to link to the detail page above"
          className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
        />
        <p className="font-body text-[11px] text-wool-muted/60 mt-1">
          By default the card's Launch button goes to{' '}
          <code className="text-gold">/trade-zone/{previewSlug}</code>. Set
          an override here if the button should jump straight to an
          external dashboard (
          <code className="text-gold">https://…</code>) or a different
          internal page (
          <code className="text-gold">/some/path</code>).
        </p>
      </div>

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Launch Button Label
        </label>
        <input
          type="text"
          value={form.launchLabel}
          onChange={(e) => set('launchLabel', e.target.value)}
          maxLength={40}
          placeholder="Launch"
          className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
          Detail Page Content
        </label>
        <MarkdownEditor
          value={form.detailContent}
          onChange={(v) => set('detailContent', v)}
          placeholder="Write the full description shown on /trade-zone/{slug}. Use the toolbar for headings, lists, links, and emphasis."
        />
        <p className="font-body text-[11px] text-wool-muted/60 mt-2">
          This is the body of the tool's dedicated detail page. Saved as
          Markdown. Keyboard shortcuts:{' '}
          <strong className="text-gold">Cmd/Ctrl+B</strong> bold,{' '}
          <strong className="text-gold">Cmd/Ctrl+I</strong> italic,{' '}
          <strong className="text-gold">Cmd/Ctrl+K</strong> link.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => set('enabled', e.target.checked)}
          className="w-4 h-4 accent-gold"
        />
        <span className="font-body text-sm text-wool">
          Enabled (visible on the public Trader Arsenal page)
        </span>
      </label>

      <div className="flex items-center gap-3 pt-4 border-t border-gold/10">
        <button
          onClick={submit}
          disabled={busy}
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all disabled:opacity-50"
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Create Tool' : 'Save Changes'}
        </button>
        {mode === 'edit' && initial?.slug && (
          <Link
            href={`/trade-zone/${initial.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-5 py-2.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase"
          >
            View live ↗
          </Link>
        )}
        <Link
          href="/admin/trade-zone"
          className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-5 py-2.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
