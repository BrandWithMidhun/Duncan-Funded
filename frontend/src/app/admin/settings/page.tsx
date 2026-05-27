'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { getSettings, updateSettings, type SiteSettings, type MenuItem } from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition';
const labelClass = 'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      const res = await getSettings();
      if (res.ok && res.data) {
        setSettings(res.data.data);
      } else {
        setError(res.error || 'Failed to load settings.');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await updateSettings(settings);
    setSaving(false);
    if (res.ok && res.data) {
      setSettings(res.data.data);
      setSuccess('Settings saved.');
    } else {
      setError(res.error || 'Failed to save settings.');
    }
  };

  // ---- Menu item helpers ----
  const updateMenuItem = (i: number, field: keyof MenuItem, value: string) => {
    if (!settings) return;
    const menu = settings.menu.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    setSettings({ ...settings, menu });
  };
  const addMenuItem = () => {
    if (!settings) return;
    setSettings({ ...settings, menu: [...settings.menu, { label: '', href: '' }] });
  };
  const removeMenuItem = (i: number) => {
    if (!settings) return;
    setSettings({ ...settings, menu: settings.menu.filter((_, idx) => idx !== i) });
  };
  const moveMenuItem = (i: number, dir: -1 | 1) => {
    if (!settings) return;
    const menu = [...settings.menu];
    const j = i + dir;
    if (j < 0 || j >= menu.length) return;
    [menu[i], menu[j]] = [menu[j], menu[i]];
    setSettings({ ...settings, menu });
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Site Settings
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Edit call-to-action links, the logo, and the navigation menu.
        </p>
      </div>

      {loading && <p className="font-accent text-wool-muted italic">Loading settings…</p>}

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {!loading && settings && (
        <div className="space-y-10 max-w-2xl">
          {/* Button URLs */}
          <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
            <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
              Button URLs
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>&quot;Get Funded&quot; button</label>
                <input
                  value={settings.urls.getFunded}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      urls: { ...settings.urls, getFunded: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>&quot;Begin Your Challenge&quot; button</label>
                <input
                  value={settings.urls.beginChallenge}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      urls: { ...settings.urls, beginChallenge: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>&quot;Sign In&quot; button</label>
                <input
                  value={settings.urls.signIn}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      urls: { ...settings.urls, signIn: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Logo */}
          <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
            <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
              Logo
            </h2>
            <label className={labelClass}>
              Logo image URL{' '}
              <span className="text-wool-muted/50">(leave blank to use the default crest)</span>
            </label>
            <input
              value={settings.logoUrl || ''}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              className={inputClass}
              placeholder="https://example.com/logo.png"
            />
            <p className="font-body text-xs text-wool-muted/60 mt-2">
              Recommended: square image, 256 × 256px, PNG or SVG with a
              transparent background, under 200&nbsp;KB.
            </p>
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="Logo preview"
                className="mt-3 h-16 w-16 object-contain border border-gold/20 rounded-sm bg-pine/40 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </section>

          {/* Menu */}
          <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base text-gold tracking-wider uppercase">
                Navigation Menu
              </h2>
              <button
                onClick={addMenuItem}
                className="font-body text-xs tracking-wider uppercase text-gold border border-gold/40 px-3 py-1.5 rounded-sm hover:bg-gold/5 transition-all"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {settings.menu.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item.label}
                    onChange={(e) => updateMenuItem(i, 'label', e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="Label"
                  />
                  <input
                    value={item.href}
                    onChange={(e) => updateMenuItem(i, 'href', e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="/path or https://..."
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveMenuItem(i, -1)}
                      className="text-wool-muted hover:text-gold text-xs px-1"
                      aria-label="Move up"
                      type="button"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveMenuItem(i, 1)}
                      className="text-wool-muted hover:text-gold text-xs px-1"
                      aria-label="Move down"
                      type="button"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    onClick={() => removeMenuItem(i)}
                    className="font-body text-xs tracking-wider text-heritage hover:opacity-80 uppercase px-2"
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {settings.menu.length === 0 && (
                <p className="font-body text-sm text-wool-muted italic">
                  No menu items. Add at least one.
                </p>
              )}
            </div>
          </section>

          {success && (
            <p className="font-body text-sm text-[hsl(150,60%,45%)] bg-[hsl(150,40%,15%)] border border-[hsl(150,40%,30%)] px-4 py-3 rounded-sm">
              {success}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-8 py-3 rounded-sm hover:text-gold-light transition-all disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
