'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createProgram,
  updateProgram,
  type Program,
  type ProgramAddon,
} from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool text-sm focus:border-gold outline-none transition';
const labelClass =
  'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';
const smallInputClass =
  'bg-pine/60 border border-gold/20 px-3 py-2 rounded-sm font-body text-wool text-sm focus:border-gold outline-none transition';

const EMPTY_PROGRAM: Omit<Program, 'id' | 'slug'> = {
  category: 'forex',
  name: '',
  popular: false,
  platforms: [],
  sizes: [],
  prices: {},
  rules: [],
  addons: [],
  order: 0,
};

export default function ProgramForm({ program }: { program?: Program }) {
  const router = useRouter();
  const isEdit = !!program;
  const initial = program
    ? {
        category: program.category,
        name: program.name,
        popular: program.popular,
        platforms: program.platforms,
        sizes: program.sizes,
        prices: program.prices,
        rules: program.rules,
        addons: program.addons,
        order: program.order,
      }
    : EMPTY_PROGRAM;

  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Text helpers — store comma/newline-separated text in local state, parse on save
  const [platformsText, setPlatformsText] = useState(initial.platforms.join(', '));
  const [sizesText, setSizesText] = useState(initial.sizes.join(', '));
  const [rulesText, setRulesText] = useState(initial.rules.join('\n'));
  const [pricesText, setPricesText] = useState(
    Object.entries(initial.prices)
      .map(([s, p]) => `${s}: ${p}`)
      .join('\n'),
  );

  const updateAddon = (i: number, patch: Partial<ProgramAddon>) => {
    setForm((f) => {
      const next = [...f.addons];
      next[i] = { ...next[i], ...patch };
      return { ...f, addons: next };
    });
  };
  const addAddon = () =>
    setForm((f) => ({
      ...f,
      addons: [...f.addons, { id: '', label: '', percent: 0 }],
    }));
  const removeAddon = (i: number) =>
    setForm((f) => ({ ...f, addons: f.addons.filter((_, idx) => idx !== i) }));

  const parsePricesText = (text: string): Record<number, number> => {
    const out: Record<number, number> = {};
    for (const line of text.split(/\n/)) {
      const m = line.match(/^\s*(\d+)\s*[:=]\s*(\d+(?:\.\d+)?)\s*$/);
      if (m) out[Number(m[1])] = Number(m[2]);
    }
    return out;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!['forex', 'crypto', 'futures', 'equities'].includes(form.category))
      return setError('Category must be forex, crypto, futures or equities.');

    const platforms = platformsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const sizes = sizesText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const rules = rulesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const prices = parsePricesText(pricesText);
    const addons = form.addons
      .filter((a) => a.label.trim())
      .map((a) => ({
        id: a.id || a.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label: a.label.trim(),
        percent: Number(a.percent) || 0,
        ...(a.group ? { group: a.group } : {}),
      }));

    const payload = { ...form, platforms, sizes, rules, prices, addons };

    setSaving(true);
    const res = isEdit
      ? await updateProgram(program!.id, payload)
      : await createProgram(payload);
    setSaving(false);

    if (res.ok) {
      router.push('/admin/programs');
      router.refresh();
    } else {
      setError(res.error || 'Save failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7 max-w-3xl">
      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass} htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Program['category'] })}
            className={inputClass}
          >
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="futures">Futures</option>
            <option value="equities">Equities</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass} htmlFor="order">Display Order</label>
          <input
            id="order"
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
            className={inputClass}
          />
          <p className="font-body text-xs text-wool-muted/60 mt-1.5">
            Lower numbers appear first in the configurator list.
          </p>
        </div>
        <div className="flex items-center mt-7">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(e) => setForm({ ...form, popular: e.target.checked })}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                form.popular
                  ? 'bg-gradient-to-br from-gold to-gold-light border-gold'
                  : 'border-gold/40'
              }`}
            >
              {form.popular && (
                <svg className="w-3.5 h-3.5 text-pine" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            <span className="font-body text-sm text-wool tracking-wide">
              Mark as Most Popular
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="platforms">
          Platforms <span className="text-wool-muted/50">(comma-separated)</span>
        </label>
        <input
          id="platforms"
          value={platformsText}
          onChange={(e) => setPlatformsText(e.target.value)}
          placeholder="cTrader, DXtrade, GooeyPro, MTR"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="sizes">
          Account Sizes <span className="text-wool-muted/50">(comma-separated, in USD)</span>
        </label>
        <input
          id="sizes"
          value={sizesText}
          onChange={(e) => setSizesText(e.target.value)}
          placeholder="5000, 10000, 25000, 50000, 100000"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="prices">
          Prices <span className="text-wool-muted/50">(one per line: size: price)</span>
        </label>
        <textarea
          id="prices"
          value={pricesText}
          onChange={(e) => setPricesText(e.target.value)}
          rows={6}
          placeholder={'5000: 44\n10000: 95\n25000: 240'}
          className={`${inputClass} resize-none font-mono`}
        />
        <p className="font-body text-xs text-wool-muted/60 mt-1.5">
          Each size you listed above should have a price here. Lines that don&apos;t match
          <code className="font-mono"> size: price </code>are ignored.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="rules">
          Rules <span className="text-wool-muted/50">(one per line)</span>
        </label>
        <textarea
          id="rules"
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          rows={6}
          placeholder={'Max Drawdown: 6%\nDaily Drawdown: 5%\nProfit Target: 10%'}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={`${labelClass} mb-0`}>Add-ons</label>
          <button
            type="button"
            onClick={addAddon}
            className="font-body text-xs tracking-wider text-gold hover:text-gold-light uppercase"
          >
            + Add Add-on
          </button>
        </div>
        <div className="space-y-3">
          {form.addons.map((a, i) => (
            <div
              key={i}
              className="border border-gold/15 bg-pine/40 p-4 rounded-sm grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center"
            >
              <input
                value={a.label}
                onChange={(e) => updateAddon(i, { label: e.target.value })}
                placeholder="Label (e.g. Profit Share)"
                className={smallInputClass}
              />
              <input
                type="number"
                value={a.percent}
                onChange={(e) => updateAddon(i, { percent: Number(e.target.value) || 0 })}
                placeholder="Percent"
                className={smallInputClass}
              />
              <input
                value={a.group || ''}
                onChange={(e) => updateAddon(i, { group: e.target.value || undefined })}
                placeholder="Group (optional)"
                className={smallInputClass}
              />
              <button
                type="button"
                onClick={() => removeAddon(i)}
                className="font-body text-xs text-heritage hover:opacity-80 uppercase tracking-wider px-2"
              >
                Remove
              </button>
            </div>
          ))}
          {form.addons.length === 0 && (
            <p className="font-accent italic text-sm text-wool-muted">No add-ons yet.</p>
          )}
        </div>
        <p className="font-body text-xs text-wool-muted/60 mt-2">
          <strong>Group</strong> creates a mutual-exclusion group (only one addon with the same
          group name can be selected at a time). Leave blank for an independent add-on.
        </p>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gold/10">
        <button
          type="submit"
          disabled={saving}
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-3 rounded-sm hover:text-gold-light transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Program'}
        </button>
        <Link
          href="/admin/programs"
          className="font-body text-xs tracking-wider text-wool-muted hover:text-gold uppercase"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
