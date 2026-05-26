'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { listSubscribers, type Subscriber } from '@/lib/adminApi';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await listSubscribers();
      if (res.ok && res.data) {
        setSubscribers(res.data.data);
      } else {
        setError(res.error || 'Failed to load subscribers.');
      }
      setLoading(false);
    })();
  }, []);

  const exportCsv = () => {
    const header = 'email,status,source,subscribed\n';
    const rows = subscribers
      .map((s) => `${s.email},${s.status},${s.source || ''},${s.createdAt}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'duncan-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Subscribers
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1">
            {subscribers.length} newsletter {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </p>
        </div>
        {subscribers.length > 0 && (
          <button
            onClick={exportCsv}
            className="font-body text-xs tracking-wider uppercase text-gold border border-gold/40 px-5 py-2.5 rounded-sm hover:bg-gold/5 transition-all"
          >
            Export CSV
          </button>
        )}
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {!loading && !error && subscribers.length === 0 && (
        <p className="font-accent text-wool-muted italic">No subscribers yet.</p>
      )}

      {!loading && subscribers.length > 0 && (
        <div className="border border-gold/15 rounded-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-highland/60">
              <tr className="font-body text-[11px] tracking-wider text-wool-muted uppercase">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Source</th>
                <th className="px-4 py-3 hidden sm:table-cell">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-gold/10 font-body text-sm text-wool"
                >
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm ${
                        s.status === 'ACTIVE'
                          ? 'bg-[hsl(150,40%,25%)] text-[hsl(150,60%,75%)]'
                          : 'bg-navy text-wool-muted'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-wool-muted">
                    {s.source || '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-wool-muted">
                    {formatDate(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
