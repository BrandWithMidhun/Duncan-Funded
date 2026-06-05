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

          {/* ---- Integrations ---- */}
          <section>
            <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase mb-4">
              Integrations
            </h2>
            <p className="font-body text-xs text-wool-muted mb-6 max-w-2xl">
              Marketing pixels and contact channels. Leave a field empty to disable that integration.
            </p>
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className={labelClass}>Google Tag Manager ID</label>
                <input
                  value={settings.integrations?.gtmId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations || {
                          gtmId: '',
                          metaPixelId: '',
                          whatsappPhone: '',
                          whatsappMessage: '',
                        }),
                        gtmId: e.target.value,
                      },
                    })
                  }
                  placeholder="GTM-XXXXXXX"
                  className={inputClass}
                  maxLength={20}
                />
                <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                  Format: <code>GTM-XXXXXXX</code>. Loads on every page when set.
                </p>
              </div>

              <div>
                <label className={labelClass}>Meta (Facebook) Pixel ID</label>
                <input
                  value={settings.integrations?.metaPixelId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations || {
                          gtmId: '',
                          metaPixelId: '',
                          whatsappPhone: '',
                          whatsappMessage: '',
                        }),
                        metaPixelId: e.target.value.replace(/\D/g, ''),
                      },
                    })
                  }
                  placeholder="1234567890123456"
                  className={inputClass}
                  maxLength={20}
                />
                <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                  Numeric Pixel ID from Meta Events Manager. Fires a PageView on every page.
                </p>
              </div>

              <div>
                <label className={labelClass}>WhatsApp Phone Number</label>
                <input
                  value={settings.integrations?.whatsappPhone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations || {
                          gtmId: '',
                          metaPixelId: '',
                          whatsappPhone: '',
                          whatsappMessage: '',
                        }),
                        whatsappPhone: e.target.value.replace(/\D/g, ''),
                      },
                    })
                  }
                  placeholder="971501234567"
                  className={inputClass}
                  maxLength={20}
                />
                <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                  International format, no spaces or <code>+</code>. e.g. UAE <code>9715…</code>, US <code>1212…</code>.
                </p>
              </div>

              <div>
                <label className={labelClass}>WhatsApp Pre-filled Message</label>
                <textarea
                  value={settings.integrations?.whatsappMessage || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations || {
                          gtmId: '',
                          metaPixelId: '',
                          whatsappPhone: '',
                          whatsappMessage: '',
                        }),
                        whatsappMessage: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  placeholder="Hi, I would like to know more about Duncan Funded."
                  className={`${inputClass} resize-none`}
                  maxLength={500}
                />
              </div>
            </div>
          </section>

          {/* ---- Chatbot ---- */}
          <section>
            <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase mb-4">
              Chatbot
            </h2>
            <p className="font-body text-xs text-wool-muted mb-6 max-w-2xl">
              AI assistant powered by Claude. Strict compliance: never provides investment
              advice or recommends specific challenges. Requires <code className="text-gold">ANTHROPIC_API_KEY</code> set
              in Railway backend environment.
            </p>
            <div className="space-y-5 max-w-2xl">
              {/* Enabled toggle */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chatbot?.enabled !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chatbot: { ...(settings.chatbot || {} as SiteSettings['chatbot']), enabled: e.target.checked },
                    })
                  }
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
                    settings.chatbot?.enabled !== false
                      ? 'bg-gradient-to-br from-gold to-gold-light border-gold'
                      : 'border-gold/40'
                  }`}
                >
                  {settings.chatbot?.enabled !== false && (
                    <svg className="w-3.5 h-3.5 text-pine" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span className="font-body text-sm text-wool tracking-wide">
                  Enable chatbot site-wide
                </span>
              </label>

              <div>
                <label className={labelClass}>Model</label>
                <select
                  value={settings.chatbot?.model || 'claude-haiku-4-5-20251001'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chatbot: { ...(settings.chatbot || {} as SiteSettings['chatbot']), model: e.target.value },
                    })
                  }
                  className={inputClass}
                >
                  <option value="claude-haiku-4-5-20251001">
                    Claude Haiku 4.5 (recommended — fast, low cost)
                  </option>
                  <option value="claude-sonnet-4-5-20250929">
                    Claude Sonnet 4.5 (higher quality, ~3x cost)
                  </option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Monthly Token Budget</label>
                  <input
                    type="number"
                    value={settings.chatbot?.monthlyTokenBudget ?? 15000000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        chatbot: {
                          ...(settings.chatbot || {} as SiteSettings['chatbot']),
                          monthlyTokenBudget: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className={inputClass}
                    min={0}
                  />
                  <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                    Tokens, not dollars. 15M ≈ $50/mo with Haiku.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Max Messages / Session</label>
                  <input
                    type="number"
                    value={settings.chatbot?.maxMessagesPerSession ?? 40}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        chatbot: {
                          ...(settings.chatbot || {} as SiteSettings['chatbot']),
                          maxMessagesPerSession: Number(e.target.value) || 40,
                        },
                      })
                    }
                    className={inputClass}
                    min={2}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Rate Limit / Hour (per IP)</label>
                  <input
                    type="number"
                    value={settings.chatbot?.ratePerHour ?? 20}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        chatbot: {
                          ...(settings.chatbot || {} as SiteSettings['chatbot']),
                          ratePerHour: Number(e.target.value) || 20,
                        },
                      })
                    }
                    className={inputClass}
                    min={1}
                  />
                </div>
                <div>
                  <label className={labelClass}>Rate Limit / Day (per IP)</label>
                  <input
                    type="number"
                    value={settings.chatbot?.ratePerDay ?? 100}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        chatbot: {
                          ...(settings.chatbot || {} as SiteSettings['chatbot']),
                          ratePerDay: Number(e.target.value) || 100,
                        },
                      })
                    }
                    className={inputClass}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Opening Message</label>
                <textarea
                  value={settings.chatbot?.openingMessage || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chatbot: {
                        ...(settings.chatbot || {} as SiteSettings['chatbot']),
                        openingMessage: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  maxLength={2000}
                  placeholder="First message the bot shows when someone opens the chat."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>System Prompt — Extra Guidance</label>
                <textarea
                  value={settings.chatbot?.systemExtras || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chatbot: {
                        ...(settings.chatbot || {} as SiteSettings['chatbot']),
                        systemExtras: e.target.value,
                      },
                    })
                  }
                  rows={5}
                  maxLength={8000}
                  placeholder={'Append additional instructions for the bot. Examples:\n- "When users ask about resets, mention they can reset once per challenge."\n- "If asked about evaluation duration, say there is no time limit."'}
                  className={`${inputClass} resize-none font-mono text-xs`}
                />
                <p className="font-body text-xs text-wool-muted/60 mt-1.5">
                  Use this to teach the bot about gaps you spot when reviewing chats in{' '}
                  <code className="text-gold">/admin/chats</code>. The compliance rules cannot be
                  overridden here.
                </p>
              </div>
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
