'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import {
  listTradeZoneTools,
  deleteTradeZoneTool,
  updateTradeZoneTool,
  type TradeZoneTool,
} from '@/lib/adminApi';
import { pickToolIcon } from '@/lib/tradeZoneIcons';

export default function AdminTradeZoneListPage() {
  const [tools, setTools] = useState<TradeZoneTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await listTradeZoneTools();
    if (res.ok && res.data) {
      setTools(res.data.data);
    } else {
      setError(res.error || 'Failed to load tools.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (t: TradeZoneTool) => {
    if (
      !window.confirm(
        `Delete "${t.name}"? This removes it from the public Trader Arsenal page. Cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    const res = await deleteTradeZoneTool(t.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Delete failed.');
      return;
    }
    await load();
  };

  const handleToggle = async (t: TradeZoneTool) => {
    setBusy(true);
    const res = await updateTradeZoneTool(t.id, { enabled: !t.enabled });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Update failed.');
      return;
    }
    await load();
  };

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Trader Arsenal
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            Manage the cards shown on the public Trader Arsenal page
            (<code className="text-gold">/trade-zone</code>). Each tool has a name,
            description, icon, optional launch URL, and order.
          </p>
        </div>
        <Link
          href="/admin/trade-zone/new"
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all shrink-0"
        >
          + Add Tool
        </Link>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {!loading && tools.length === 0 && (
        <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
          <p className="font-accent text-wool-muted italic">
            No tools yet. Click <span className="text-gold">+ Add Tool</span> to create the
            first one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tools.map((t) => {
          const Icon = pickToolIcon(t.iconKey);
          return (
            <div
              key={t.id}
              className={`border rounded-sm p-5 flex items-center gap-5 ${
                t.enabled
                  ? 'border-gold/15 bg-highland/30'
                  : 'border-gold/10 bg-highland/10 opacity-60'
              }`}
            >
              <div className="w-12 h-12 shrink-0 border border-gold/20 rounded-sm flex items-center justify-center bg-pine/60">
                <Icon className="w-6 h-6 text-gold" strokeWidth={1.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-display text-base text-gold tracking-wider truncate">
                    {t.name}
                  </h2>
                  {!t.enabled && (
                    <span className="inline-block font-body text-[9px] tracking-[0.2em] uppercase text-wool-muted bg-pine border border-gold/20 px-2 py-0.5 rounded-sm">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-wool-muted line-clamp-1 mb-1">
                  {t.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-wool-muted/70">
                  <span>icon: {t.iconKey}</span>
                  <span>·</span>
                  <span>order: {t.order}</span>
                  {t.slug && (
                    <>
                      <span>·</span>
                      <span>
                        /trade-zone/<span className="text-gold">{t.slug}</span>
                      </span>
                    </>
                  )}
                  {t.launchUrl && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-[260px]">
                        override → {t.launchUrl}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(t)}
                  disabled={busy}
                  className="font-body text-xs tracking-wider text-wool-muted border border-gold/20 px-4 py-1.5 rounded-sm hover:text-wool hover:border-gold/40 uppercase disabled:opacity-50"
                >
                  {t.enabled ? 'Disable' : 'Enable'}
                </button>
                <Link
                  href={`/admin/trade-zone/${t.id}`}
                  className="font-body text-xs tracking-wider text-gold border border-gold/30 px-4 py-1.5 rounded-sm hover:bg-gold/5 uppercase"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(t)}
                  disabled={busy}
                  className="font-body text-xs tracking-wider text-heritage border border-heritage/30 px-4 py-1.5 rounded-sm hover:bg-heritage/10 uppercase disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
