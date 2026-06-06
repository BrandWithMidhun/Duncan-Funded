'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Plus, Trash2, Save, X } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  listRestrictions,
  createRestriction,
  updateRestriction,
  deleteRestriction,
  type CoreRestrictionPattern,
  type CustomRestriction,
} from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 focus:border-gold/60 px-3 py-2 rounded-sm font-body text-sm text-wool placeholder:text-wool-muted/45 outline-none transition-colors';
const labelClass =
  'block font-body text-[11px] tracking-wider text-wool-muted uppercase mb-1.5';

interface FormState {
  pattern: string;
  notes: string;
  isRegex: boolean;
  enabled: boolean;
}

const emptyForm: FormState = { pattern: '', notes: '', isRegex: false, enabled: true };

export default function ChatRestrictionsPage() {
  const [core, setCore] = useState<CoreRestrictionPattern[]>([]);
  const [custom, setCustom] = useState<CustomRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };

  const reload = async () => {
    const res = await listRestrictions();
    if (res.ok && res.data) {
      setCore(res.data.data.core);
      setCustom(res.data.data.custom);
    } else {
      setError(res.error || 'Failed to load restrictions.');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (r: CustomRestriction) => {
    setEditingId(r.id);
    setForm({
      pattern: r.pattern,
      notes: r.notes,
      isRegex: r.isRegex,
      enabled: r.enabled,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.pattern.trim() || form.pattern.trim().length < 2) {
      setError('Pattern must be at least 2 characters.');
      return;
    }
    setBusy(true);
    const res = editingId
      ? await updateRestriction(editingId, form)
      : await createRestriction(form);
    setBusy(false);
    if (res.ok) {
      resetForm();
      flash(editingId ? 'Restriction updated.' : 'Restriction added.');
      reload();
    } else {
      setError(res.error || 'Save failed.');
    }
  };

  const handleToggle = async (r: CustomRestriction) => {
    const res = await updateRestriction(r.id, { enabled: !r.enabled });
    if (res.ok) reload();
    else setError(res.error || 'Toggle failed.');
  };

  const handleDelete = async (r: CustomRestriction) => {
    if (!confirm(`Delete restriction "${r.pattern}"? This cannot be undone.`)) return;
    const res = await deleteRestriction(r.id);
    if (res.ok) {
      flash('Deleted.');
      reload();
    } else {
      setError(res.error || 'Delete failed.');
    }
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <Link
          href="/admin/chats"
          className="font-body text-xs tracking-wider text-wool-muted hover:text-gold uppercase"
        >
          ← Back to Chats
        </Link>
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase mt-3">
          Chat Restrictions
        </h1>
        <p className="font-body text-sm text-wool-muted mt-2 max-w-2xl">
          Words and phrases the chatbot is forbidden from saying. If Duncan&apos;s reply contains
          any restricted pattern, his whole message is replaced with a safe deflection before the
          visitor sees it. Compliance patterns work alongside the system prompt rules.
        </p>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}
      {success && (
        <p className="font-body text-sm text-[hsl(150,60%,45%)] bg-[hsl(150,40%,15%)] border border-[hsl(150,40%,30%)] px-4 py-3 rounded-sm mb-6">
          {success}
        </p>
      )}

      {/* ---- Core protections (read-only) ---- */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gold" strokeWidth={1.8} />
          <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase">
            Core Protections
          </h2>
          <span className="font-body text-[10px] tracking-wider text-wool-muted/60 uppercase">
            Locked
          </span>
        </div>
        <p className="font-body text-xs text-wool-muted mb-5 max-w-2xl">
          Built-in compliance patterns that cannot be edited or removed. These exist to keep the
          firm safe regardless of what gets added or removed below.
        </p>
        {loading && <p className="font-accent italic text-wool-muted">Loading…</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {core.map((c) => (
            <div
              key={c.id}
              className="border border-gold/15 bg-highland/20 rounded-sm p-4 opacity-90"
            >
              <div className="font-display text-sm text-gold tracking-wider mb-1">{c.label}</div>
              <div className="font-body text-xs text-wool-muted/80 break-words">{c.source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Add / edit form ---- */}
      <section className="mb-12 max-w-2xl">
        <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase mb-4">
          {editingId ? 'Edit Restriction' : 'Add New Restriction'}
        </h2>
        <div className="border border-gold/15 bg-highland/30 rounded-sm p-5 space-y-4">
          <div>
            <label className={labelClass}>Pattern *</label>
            <input
              type="text"
              value={form.pattern}
              onChange={(e) => setForm({ ...form, pattern: e.target.value })}
              placeholder={form.isRegex ? '\\b(get rich|easy money)\\b' : 'easy money'}
              className={inputClass}
              maxLength={200}
            />
            <p className="font-body text-xs text-wool-muted/60 mt-1.5">
              {form.isRegex
                ? 'JavaScript regex source. Case-insensitive by default.'
                : 'Plain text phrase. Whole-word match, case-insensitive.'}
            </p>
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Why this is blocked"
              className={inputClass}
              maxLength={500}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRegex}
                onChange={(e) => setForm({ ...form, isRegex: e.target.checked })}
                className="accent-gold"
              />
              <span className="font-body text-sm text-wool">Regex pattern</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="accent-gold"
              />
              <span className="font-body text-sm text-wool">Enabled</span>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={busy || !form.pattern.trim()}
              className="inline-flex items-center gap-2 font-body text-sm tracking-wider uppercase px-5 py-2.5 rounded-sm bg-gradient-to-br from-gold to-gold-light text-pine font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Add Restriction'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 font-body text-sm tracking-wider uppercase px-4 py-2.5 rounded-sm border border-gold/30 text-wool-muted hover:text-gold"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---- Custom restrictions list ---- */}
      <section>
        <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase mb-4">
          Custom Restrictions ({custom.length})
        </h2>
        {custom.length === 0 && !loading && (
          <div className="border border-gold/15 bg-highland/30 rounded-sm p-6 text-center">
            <p className="font-accent italic text-wool-muted">
              No custom restrictions yet. Core protections above are active.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {custom.map((r) => (
            <div
              key={r.id}
              className={`border rounded-sm p-4 transition-colors ${
                r.enabled
                  ? 'border-gold/15 bg-highland/30'
                  : 'border-gold/5 bg-highland/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono text-sm text-gold break-all">{r.pattern}</code>
                    {r.isRegex && (
                      <span className="font-body text-[9px] tracking-[0.18em] uppercase text-wool-muted bg-pine/40 border border-gold/20 px-1.5 py-0.5 rounded-sm shrink-0">
                        Regex
                      </span>
                    )}
                    {!r.enabled && (
                      <span className="font-body text-[9px] tracking-[0.18em] uppercase text-wool-muted/70 bg-pine/40 border border-wool-muted/20 px-1.5 py-0.5 rounded-sm shrink-0">
                        Disabled
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="font-body text-xs text-wool-muted/80">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(r)}
                    className="font-body text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-sm border border-gold/30 text-wool-muted hover:text-gold hover:border-gold/60"
                  >
                    {r.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleEdit(r)}
                    className="font-body text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-sm border border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    aria-label="Delete"
                    className="p-1.5 rounded-sm border border-heritage/30 text-heritage hover:bg-heritage/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
