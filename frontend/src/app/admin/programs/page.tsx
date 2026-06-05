'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { listPrograms, deleteProgram, type Program } from '@/lib/adminApi';

const CATEGORY_LABEL: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  futures: 'Futures',
  equities: 'Equities',
};

export default function AdminProgramsListPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await listPrograms();
    if (res.ok && res.data) {
      setPrograms(res.data.data);
    } else {
      setError(res.error || 'Failed to load programs.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (p: Program) => {
    if (
      !window.confirm(
        `Delete "${p.name}"? This cannot be undone and will remove it from the live configurator.`,
      )
    )
      return;
    setBusy(true);
    const res = await deleteProgram(p.id);
    setBusy(false);
    if (!res.ok) setError(res.error || 'Delete failed.');
    await load();
  };

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Programs
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            Manage the programs shown in the Programs page configurator. Each program has its own
            sizes, prices, rules, platforms, and add-ons.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-6 py-2.5 rounded-sm hover:text-gold-light transition-all shrink-0"
        >
          + Add Program
        </Link>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {!loading && programs.length === 0 && (
        <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
          <p className="font-accent text-wool-muted italic mb-3">
            No programs yet. Seed the database from the backend
            (<code className="font-body text-gold">npm run seed:programs</code>) or add one manually.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {programs.map((p) => (
          <div
            key={p.id}
            className="border border-gold/15 bg-highland/30 rounded-sm p-5 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-base text-gold tracking-wider truncate">
                  {p.name}
                </h2>
                {p.popular && (
                  <span className="inline-block font-body text-[9px] tracking-[0.2em] uppercase text-wool bg-heritage px-2 py-0.5 rounded-sm">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-wool-muted">
                <span>{CATEGORY_LABEL[p.category] || p.category}</span>
                <span>·</span>
                <span>{p.sizes.length} sizes</span>
                <span>·</span>
                <span>{p.rules.length} rules</span>
                <span>·</span>
                <span>{p.addons.length} add-ons</span>
                <span>·</span>
                <span>order: {p.order}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/programs/${p.id}`}
                className="font-body text-xs tracking-wider text-gold border border-gold/30 px-4 py-1.5 rounded-sm hover:bg-gold/5 uppercase"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(p)}
                disabled={busy}
                className="font-body text-xs tracking-wider text-heritage border border-heritage/30 px-4 py-1.5 rounded-sm hover:bg-heritage/10 uppercase disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
