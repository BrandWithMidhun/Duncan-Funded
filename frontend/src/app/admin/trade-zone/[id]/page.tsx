'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import TradeZoneToolForm from '@/components/TradeZoneToolForm';
import { getTradeZoneTool, type TradeZoneTool } from '@/lib/adminApi';

export default function EditTradeZoneToolPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [tool, setTool] = useState<TradeZoneTool | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const res = await getTradeZoneTool(id);
      if (!active) return;
      if (res.ok && res.data) setTool(res.data.data);
      else setError(res.error || 'Failed to load tool.');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Edit Trader Arsenal Tool
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
          Update the card on the public Trader Arsenal page.
        </p>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {tool && <TradeZoneToolForm mode="edit" initial={tool} />}
    </AdminShell>
  );
}
