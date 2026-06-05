'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { listChats, chatUsage, type AdminChatSession, type AdminChatUsage } from '@/lib/adminApi';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function truncate(text: string, max = 140) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function AdminChatsListPage() {
  const [chats, setChats] = useState<AdminChatSession[]>([]);
  const [usage, setUsage] = useState<AdminChatUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, u] = await Promise.all([listChats({ limit: 100 }), chatUsage()]);
      if (c.ok && c.data) setChats(c.data.data);
      else setError(c.error || 'Failed to load chats.');
      if (u.ok && u.data) setUsage(u.data.data);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Chats
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            All conversations from the site chatbot. Review them to spot gaps, then update the bot&apos;s
            system prompt in{' '}
            <Link href="/admin/settings" className="text-gold underline underline-offset-2">
              Settings → Chatbot
            </Link>
            .
          </p>
        </div>
        {usage && (
          <div className="shrink-0 border border-gold/20 bg-highland/40 rounded-sm px-4 py-3 text-right">
            <div className="font-body text-[10px] tracking-wider text-wool-muted/70 uppercase">
              This Month ({usage.yearMonth})
            </div>
            <div className="font-display text-sm text-gold mt-1">
              {usage.messageCount.toLocaleString()} messages
            </div>
            <div className="font-body text-xs text-wool-muted/70">
              {(usage.tokensIn + usage.tokensOut).toLocaleString()} tokens
            </div>
          </div>
        )}
      </div>

      {loading && <p className="font-accent italic text-wool-muted">Loading…</p>}
      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm">
          {error}
        </p>
      )}

      {!loading && chats.length === 0 && (
        <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
          <p className="font-accent italic text-wool-muted">
            No conversations yet. When visitors chat with the bot, they&apos;ll appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {chats.map((c) => (
          <Link
            key={c.id}
            href={`/admin/chats/${c.id}`}
            className="block border border-gold/15 bg-highland/30 rounded-sm p-5 hover:border-gold/40 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm text-wool truncate">
                  {truncate(c.firstUserMessage, 160) || (
                    <span className="italic text-wool-muted/70">No user messages yet</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.flagged && (
                  <span className="font-body text-[9px] tracking-[0.2em] uppercase text-heritage bg-heritage/10 border border-heritage/30 px-2 py-0.5 rounded-sm">
                    Flagged
                  </span>
                )}
                {c.exemplar && (
                  <span className="font-body text-[9px] tracking-[0.2em] uppercase text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-sm">
                    Exemplar
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-wool-muted/70">
              <span>{c.messageCount} message{c.messageCount === 1 ? '' : 's'}</span>
              <span>·</span>
              <span>{formatDateTime(c.lastMessageAt)}</span>
              {c.ipAddress && (
                <>
                  <span>·</span>
                  <span className="font-mono text-[10px]">{c.ipAddress}</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
