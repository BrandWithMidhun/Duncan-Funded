'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import {
  getChat,
  setChatFlags,
  deleteChat,
  type AdminChatDetail,
} from '@/lib/adminApi';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default function AdminChatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [chat, setChat] = useState<AdminChatDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const res = await getChat(id);
    if (res.ok && res.data) setChat(res.data.data);
    else setError(res.error || 'Failed to load chat.');
  };

  useEffect(() => {
    if (!id) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleFlag = async (key: 'flagged' | 'exemplar') => {
    if (!chat) return;
    setBusy(true);
    const res = await setChatFlags(id, { [key]: !chat[key] });
    setBusy(false);
    if (res.ok && res.data) setChat(res.data.data);
    else setError(res.error || 'Failed to update.');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    setBusy(true);
    const res = await deleteChat(id);
    setBusy(false);
    if (res.ok) router.push('/admin/chats');
    else setError(res.error || 'Failed to delete.');
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <Link
          href="/admin/chats"
          className="font-body text-xs tracking-wider text-wool-muted hover:text-gold uppercase"
        >
          ← All Chats
        </Link>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {!chat && !error && <p className="font-accent italic text-wool-muted">Loading…</p>}

      {chat && (
        <div className="max-w-3xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-xl gold-text-gradient font-bold tracking-wider uppercase">
                Conversation
              </h1>
              <p className="font-body text-xs text-wool-muted mt-1">
                Started {formatDateTime(chat.createdAt)}
                {chat.ipAddress && (
                  <>
                    {' '}· <span className="font-mono">{chat.ipAddress}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleFlag('flagged')}
                disabled={busy}
                className={`font-body text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border transition-all ${
                  chat.flagged
                    ? 'text-heritage border-heritage/60 bg-heritage/10'
                    : 'text-wool-muted border-gold/30 hover:text-heritage hover:border-heritage/60'
                }`}
              >
                {chat.flagged ? '✓ Flagged' : 'Flag'}
              </button>
              <button
                onClick={() => toggleFlag('exemplar')}
                disabled={busy}
                className={`font-body text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border transition-all ${
                  chat.exemplar
                    ? 'text-gold border-gold/60 bg-gold/10'
                    : 'text-wool-muted border-gold/30 hover:text-gold hover:border-gold/60'
                }`}
              >
                {chat.exemplar ? '★ Exemplar' : 'Mark Exemplar'}
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="font-body text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border border-heritage/30 text-heritage hover:bg-heritage/10"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {chat.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-sm font-body text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-gold to-gold-light text-pine'
                      : 'bg-highland/60 text-wool border border-gold/15'
                  }`}
                >
                  {m.content}
                  <div
                    className={`mt-2 font-body text-[10px] tracking-wider uppercase opacity-60 ${
                      m.role === 'user' ? 'text-pine' : 'text-wool-muted'
                    }`}
                  >
                    {m.role} · {formatDateTime(m.createdAt)}
                    {m.tokensIn > 0 || m.tokensOut > 0 ? (
                      <> · {m.tokensIn}/{m.tokensOut} tok</>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
