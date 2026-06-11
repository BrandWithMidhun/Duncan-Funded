'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createTradeZoneTool,
  updateTradeZoneTool,
  type TradeZoneTool,
  type TradeZoneToolInput,
} from '@/lib/adminApi';
import { TRADE_ZONE_ICON_KEYS, pickToolIcon } from '@/lib/tradeZoneIcons';

interface Props {
  mode: 'create' | 'edit';
  initial?: TradeZoneTool;
}

const EMPTY: TradeZoneToolInput = {
  name: '',
  description: '',
  iconKey: 'activity',
  launchUrl: '',
  launchLabel: 'Launch',
  order: 0,
  enabled: true,
};

export default function TradeZoneToolForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TradeZoneToolInput>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description,
          iconKey: initial.iconKey,
          launchUrl: initial.launchUrl,
          launchLabel: initial.launchLabel,
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

  const set = <K extends keyof TradeZoneToolInput>(
    key: K,
    val: TradeZoneToolInput[K],
  ) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl">
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
          placeholder="A short, plain-language description shown on the card."
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
          Launch URL
        </label>
        <input
          type="text"
          value={form.launchUrl}
          onChange={(e) => set('launchUrl', e.target.value)}
          maxLength={500}
          placeholder="e.g. /admin or https://dashboard.example.com"
          className="w-full bg-pine/60 border border-gold/20 rounded-sm px-4 py-2.5 font-body text-sm text-wool placeholder:text-wool-muted/40 focus:border-gold/60 focus:outline-none"
        />
        <p className="font-body text-[11px] text-wool-muted/60 mt-1">
          Internal paths start with <code className="text-gold">/</code> and open in
          the same tab. External URLs (
          <code className="text-gold">https://…</code>) open in a new tab. Leave
          empty to hide the Launch button.
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
          href="/admin/trade-zone"
          className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-5 py-2.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
