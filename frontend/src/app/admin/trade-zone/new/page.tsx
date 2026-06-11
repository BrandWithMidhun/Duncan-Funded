'use client';

import AdminShell from '@/components/AdminShell';
import TradeZoneToolForm from '@/components/TradeZoneToolForm';

export default function NewTradeZoneToolPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          New Trader Arsenal Tool
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
          Add a new card to the public Trader Arsenal page.
        </p>
      </div>
      <TradeZoneToolForm mode="create" />
    </AdminShell>
  );
}
