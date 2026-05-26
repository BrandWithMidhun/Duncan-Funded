'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { listMessages, type ContactMessage } from '@/lib/adminApi';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await listMessages();
      if (res.ok && res.data) {
        setMessages(res.data.data);
      } else {
        setError(res.error || 'Failed to load messages.');
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Messages
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          {messages.length} contact {messages.length === 1 ? 'submission' : 'submissions'}
        </p>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {!loading && !error && messages.length === 0 && (
        <p className="font-accent text-wool-muted italic">No messages yet.</p>
      )}

      {!loading && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className="border border-gold/15 bg-highland/40 rounded-sm p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <div>
                  <span className="font-display text-base text-gold tracking-wide">
                    {m.name}
                  </span>
                  <a
                    href={`mailto:${m.email}`}
                    className="font-body text-sm text-wool-muted ml-3 hover:text-gold transition-colors"
                  >
                    {m.email}
                  </a>
                </div>
                <span className="font-body text-[11px] text-wool-muted/60">
                  {formatDate(m.createdAt)}
                </span>
              </div>
              <p className="font-body text-sm text-wool-muted leading-relaxed whitespace-pre-wrap">
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
