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

/**
 * Admin form for one Trader Arsenal tool. The fields here are exactly
 * what's rendered on the public /trade-zone page — there is no hidden
 * data and no obsolete fields. Slug and detailContent fields that
 * existed in an earlier iteration are managed internally on the
 * backend and don't surface here anymore.
 *
 * Includes a live preview card on the right (or below on narrow
 * screens) that mirrors the public card markup so admin sees exactly
 * what the change will look like.
 */

interface Props {
  mode: 'create' | 'edit';
  initial?: TradeZoneTool;
}

type FormState = {
  name: string;
  description: string;
  iconKey: string;
  launchUrl: string;
  launchLabel: string;
  order: number;
  enabled: boolean;
};

const EMPTY: FormState = {
  name: '',
  description: '',
  iconKey: 'activity',
  launchUrl: '',
  launchLabel: 'Launch',
  order: 0,
  enabled: true,
};

/** Mirrors the public-page logic in /trade-zone/page.tsx so the
 *  preview shows the destination admin should expect. */
function previewTarget(launchUrl: string): string {
  const v = launchUrl?.trim();
  if (v) return v;
  return '/programs';
}

export default function TradeZoneToolForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description,
          iconKey: initial.iconKey,
          launchUrl: initial.launchUrl,
          launchLabel: initial.launchLabel || 'Launch',
          order: initial.order,
          enabled: initial.enabled,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const PreviewIcon = pickToolIcon(form.iconKey);

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.description.trim()) return setError('Description is required.');

    setBusy(true);
    // Backend still accepts slug + detailContent for back-compat but we
    // simply don't send them — the backend defaults them and the public
    // page no longer uses them.
    const res =
      mode === 'create'
        ? await createTradeZoneTool(form)
        : await updateTradeZoneTool(initial!.id, form);
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

  const target = previewTarget(form.launchUrl);
  const targetExternal = /^https?:\/\//i.test(target);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-5xl">
      {/* LEFT — form fields */}
      <div className="space-y-6">
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
            onChange={(e) => set('name', e.target.value)}
            maxLength={120}
            placeholder="e.g. Live Dashboard"
            className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Short blurb shown on the public Trader Arsenal card."
            className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none resize-y"
          />
          <p className="font-body text-[11px] text-wool-muted/60 mt-1">
            {form.description.length}/600
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            Launch URL (optional)
          </label>
          <input
            type="text"
            value={form.launchUrl}
            onChange={(e) => set('launchUrl', e.target.value)}
            maxLength={500}
            placeholder="Leave empty to send users to /programs"
            className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
          />
          <p className="font-body text-[11px] text-wool-muted/60 mt-1">
            Where the Launch button on this card goes. Default is{' '}
            <code className="text-gold">/programs</code>. Use a path like{' '}
            <code className="text-gold">/programs</code> for internal pages
            or a full URL like{' '}
            <code className="text-gold">https://broker.example.com/dashboard</code>{' '}
            to open an external page in a new tab.
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
          <Link
            href="/trade-zone"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-5 py-2.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase"
          >
            View public page ↗
          </Link>
          <Link
            href="/admin/trade-zone"
            className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-5 py-2.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase ml-auto"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* RIGHT — live preview card matching the public Trader Arsenal */}
      <aside className="lg:sticky lg:top-6 self-start">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-gold/60 mb-3">
          Live Preview
        </p>
        <div
          className={`flex flex-col border border-gold/20 backdrop-blur-sm p-6 rounded-sm tartan-texture bg-highland/40 ${
            !form.enabled ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <PreviewIcon className="w-6 h-6 text-gold" strokeWidth={1.25} />
            <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase">
              {form.name || 'Tool Name'}
            </h2>
          </div>
          <p className="font-body text-sm text-wool-muted leading-relaxed flex-1 mb-6">
            {form.description || 'Short description appears here.'}
          </p>
          <div className="self-stretch text-center font-body text-xs tracking-[0.25em] text-gold tartan-button px-5 py-3 rounded-sm uppercase">
            {form.launchLabel || 'Launch'}
          </div>
        </div>
        <p className="font-body text-[11px] text-wool-muted/60 mt-3 leading-relaxed">
          Button goes to{' '}
          <code className="text-gold break-all">{target}</code>
          {targetExternal && (
            <span className="text-wool-muted/50"> (new tab)</span>
          )}
          .{' '}
          {!form.enabled && (
            <span className="text-heritage">This tool is currently disabled and will not appear on the public page.</span>
          )}
        </p>
      </aside>
    </div>
  );
}
