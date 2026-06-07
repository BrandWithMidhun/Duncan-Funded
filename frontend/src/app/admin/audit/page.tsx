'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  listAudit,
  listLoginAttempts,
  type AdminAuditEntry,
  type LoginAttemptEntry,
} from '@/lib/adminApi';

function formatTs(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'text-[hsl(150,55%,55%)] border-[hsl(150,40%,30%)] bg-[hsl(150,40%,10%)]',
  PUT: 'text-gold border-gold/40 bg-gold/10',
  PATCH: 'text-gold border-gold/40 bg-gold/10',
  DELETE: 'text-heritage border-heritage/40 bg-heritage/10',
};

export default function AuditPage() {
  const [tab, setTab] = useState<'actions' | 'logins'>('actions');
  const [actions, setActions] = useState<AdminAuditEntry[]>([]);
  const [logins, setLogins] = useState<LoginAttemptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const [a, l] = await Promise.all([
        listAudit({ limit: 200 }),
        listLoginAttempts(200),
      ]);
      if (a.ok && a.data) setActions(a.data.data);
      else setError(a.error || 'Failed to load actions.');
      if (l.ok && l.data) setLogins(l.data.data);
      setLoading(false);
    })();
  }, []);

  const failedLogins = logins.filter((l) => !l.success).length;
  const successfulLogins = logins.length - failedLogins;

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Audit
        </h1>
        <p className="font-body text-sm text-wool-muted mt-2 max-w-2xl">
          Append-only record of admin write actions and login attempts. Use this to investigate
          changes (who edited what, when) and to spot unusual login patterns.
        </p>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gold/20 mb-6 max-w-2xl">
        <button
          onClick={() => setTab('actions')}
          className={`inline-flex items-center gap-2 font-body text-sm tracking-wider uppercase px-5 py-3 transition-colors ${
            tab === 'actions'
              ? 'text-gold border-b-2 border-gold -mb-px'
              : 'text-wool-muted hover:text-wool'
          }`}
        >
          <ShieldCheck className="w-4 h-4" strokeWidth={1.8} />
          Actions ({actions.length})
        </button>
        <button
          onClick={() => setTab('logins')}
          className={`inline-flex items-center gap-2 font-body text-sm tracking-wider uppercase px-5 py-3 transition-colors ${
            tab === 'logins'
              ? 'text-gold border-b-2 border-gold -mb-px'
              : 'text-wool-muted hover:text-wool'
          }`}
        >
          <LogIn className="w-4 h-4" strokeWidth={1.8} />
          Login Attempts ({logins.length})
        </button>
      </div>

      {loading && <p className="font-accent italic text-wool-muted">Loading…</p>}

      {!loading && tab === 'actions' && (
        <>
          {actions.length === 0 ? (
            <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
              <p className="font-accent italic text-wool-muted">
                No admin write actions logged yet.
              </p>
            </div>
          ) : (
            <div className="border border-gold/15 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-highland/40 border-b border-gold/15">
                  <tr className="text-left font-body text-[10px] tracking-wider text-wool-muted uppercase">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Path</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-gold/10 last:border-b-0 hover:bg-highland/20"
                    >
                      <td className="px-4 py-3 font-body text-xs text-wool-muted whitespace-nowrap">
                        {formatTs(a.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-wool whitespace-nowrap">
                        {a.userEmail || (
                          <span className="italic text-wool-muted/60">unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm border ${
                            METHOD_COLORS[a.method] ||
                            'text-wool-muted border-gold/20 bg-pine/40'
                          }`}
                        >
                          {a.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-wool break-all">
                        {a.path}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-wool-muted">
                        {a.status ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-wool-muted/70 hidden md:table-cell whitespace-nowrap">
                        {a.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && tab === 'logins' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="border border-gold/20 bg-highland/40 rounded-sm px-4 py-3 flex-1">
              <div className="font-body text-[10px] tracking-wider text-wool-muted/70 uppercase">
                Successful
              </div>
              <div className="font-display text-lg text-gold mt-1">{successfulLogins}</div>
            </div>
            <div className="border border-heritage/30 bg-heritage/5 rounded-sm px-4 py-3 flex-1">
              <div className="font-body text-[10px] tracking-wider text-wool-muted/70 uppercase">
                Failed
              </div>
              <div className="font-display text-lg text-heritage mt-1">{failedLogins}</div>
            </div>
          </div>

          {logins.length === 0 ? (
            <div className="border border-gold/15 bg-highland/30 rounded-sm p-8 text-center">
              <p className="font-accent italic text-wool-muted">No login attempts logged yet.</p>
            </div>
          ) : (
            <div className="border border-gold/15 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-highland/40 border-b border-gold/15">
                  <tr className="text-left font-body text-[10px] tracking-wider text-wool-muted uppercase">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3 hidden md:table-cell">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-gold/10 last:border-b-0 hover:bg-highland/20"
                    >
                      <td className="px-4 py-3 font-body text-xs text-wool-muted whitespace-nowrap">
                        {formatTs(l.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-wool">
                        {l.email || (
                          <span className="italic text-wool-muted/60">none</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm border ${
                            l.success
                              ? 'text-[hsl(150,55%,55%)] border-[hsl(150,40%,30%)] bg-[hsl(150,40%,10%)]'
                              : 'text-heritage border-heritage/40 bg-heritage/10'
                          }`}
                        >
                          {l.success ? 'OK' : 'FAILED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-wool-muted/70 hidden md:table-cell whitespace-nowrap">
                        {l.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
