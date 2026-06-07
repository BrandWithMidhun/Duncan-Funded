'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { getSettings, updateSettings, type SiteSettings, type MenuItem } from '@/lib/adminApi';

const inputClass =
  'w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition';
const labelClass = 'font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block';

type SettingsTab = 'urls' | 'branding' | 'menu' | 'integrations' | 'chatbot' | 'popups';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'urls', label: 'URLs' },
  { id: 'branding', label: 'Branding' },
  { id: 'menu', label: 'Menu' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'popups', label: 'Popups' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<SettingsTab>('urls');

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
        <div className="max-w-2xl">
          {/* Tab navigation */}
          <div className="flex flex-wrap border-b border-gold/20 mb-8 -mx-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`font-body text-xs tracking-wider uppercase px-4 py-3 mx-2 transition-colors ${
                  tab === t.id
                    ? 'text-gold border-b-2 border-gold -mb-px'
                    : 'text-wool-muted hover:text-wool'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-10">
          {/* Button URLs */}
          {tab === 'urls' && (
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
          )}

          {/* Logo */}
          {tab === 'branding' && (
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
          )}

          {/* Menu */}
          {tab === 'menu' && (
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
          )}

          {/* ---- Integrations ---- */}
          {tab === 'integrations' && (
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
          )}

          {/* ---- Chatbot ---- */}
          {tab === 'chatbot' && (
          <section>
            <h2 className="font-display text-lg gold-text-gradient font-bold tracking-wider uppercase mb-4">
              Chatbot
            </h2>
            <p className="font-body text-xs text-wool-muted mb-6 max-w-2xl">
              AI assistant powered by Claude. Strict compliance: never provides investment
              advice or recommends specific challenges. Requires <code className="text-gold">ANTHROPIC_API_KEY</code> set
              in Railway backend environment. Manage banned words in{' '}
              <a
                href="/admin/chat-restrictions"
                className="text-gold underline underline-offset-2"
              >
                Chat Restrictions
              </a>
              .
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
          )}

          {/* ---- Popups (newsletter + exit-intent) ---- */}
          {tab === 'popups' && <PopupsSection settings={settings} setSettings={setSettings} />}
          </div>

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

// ============================================================
// Popups section — newsletter + exit-intent
// Both are editable here and rendered on the public site.
// ============================================================

interface PopupsSectionProps {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}

function PopupsSection({ settings, setSettings }: PopupsSectionProps) {
  const popups = settings.popups || {
    newsletter: {
      enabled: false,
      title: '',
      body: '',
      buttonLabel: 'Subscribe',
      delaySeconds: 30,
      scrollThreshold: 50,
      cooldownDays: 14,
    },
    exitIntent: {
      enabled: false,
      title: '',
      body: '',
      ctaLabel: '',
      ctaUrl: '',
      cooldownDays: 30,
    },
  };

  const setNewsletter = (patch: Partial<typeof popups.newsletter>) =>
    setSettings({
      ...settings,
      popups: { ...popups, newsletter: { ...popups.newsletter, ...patch } },
    });
  const setExitIntent = (patch: Partial<typeof popups.exitIntent>) =>
    setSettings({
      ...settings,
      popups: { ...popups, exitIntent: { ...popups.exitIntent, ...patch } },
    });

  const checkboxRow = (
    checked: boolean,
    onChange: (v: boolean) => void,
    label: string,
  ) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
          checked
            ? 'bg-gradient-to-br from-gold to-gold-light border-gold'
            : 'border-gold/40'
        }`}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-pine" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span className="font-body text-sm text-wool tracking-wide">{label}</span>
    </label>
  );

  return (
    <>
      {/* Newsletter popup */}
      <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
        <h2 className="font-display text-base text-gold tracking-wider uppercase mb-2">
          Newsletter Popup
        </h2>
        <p className="font-body text-xs text-wool-muted mb-5">
          Shown after the delay OR scroll threshold, whichever first. Hidden once dismissed or
          submitted for the cooldown period.
        </p>
        <div className="space-y-4">
          {checkboxRow(
            popups.newsletter.enabled,
            (v) => setNewsletter({ enabled: v }),
            'Enable newsletter popup',
          )}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={popups.newsletter.title}
              onChange={(e) => setNewsletter({ title: e.target.value })}
              className={inputClass}
              maxLength={120}
              placeholder="Join the brief"
            />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea
              value={popups.newsletter.body}
              onChange={(e) => setNewsletter({ body: e.target.value })}
              rows={3}
              maxLength={500}
              className={`${inputClass} resize-none`}
              placeholder="Subscribe for evaluation insights, payout news, and platform updates."
            />
          </div>
          <div>
            <label className={labelClass}>Button Label</label>
            <input
              type="text"
              value={popups.newsletter.buttonLabel}
              onChange={(e) => setNewsletter({ buttonLabel: e.target.value })}
              className={inputClass}
              maxLength={40}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Delay (sec)</label>
              <input
                type="number"
                value={popups.newsletter.delaySeconds}
                onChange={(e) =>
                  setNewsletter({ delaySeconds: Number(e.target.value) || 30 })
                }
                className={inputClass}
                min={3}
                max={600}
              />
            </div>
            <div>
              <label className={labelClass}>Scroll %</label>
              <input
                type="number"
                value={popups.newsletter.scrollThreshold}
                onChange={(e) =>
                  setNewsletter({ scrollThreshold: Number(e.target.value) || 50 })
                }
                className={inputClass}
                min={10}
                max={100}
              />
            </div>
            <div>
              <label className={labelClass}>Cooldown (days)</label>
              <input
                type="number"
                value={popups.newsletter.cooldownDays}
                onChange={(e) =>
                  setNewsletter({ cooldownDays: Number(e.target.value) || 14 })
                }
                className={inputClass}
                min={0}
                max={365}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Exit-intent popup */}
      <section className="border border-gold/15 bg-highland/30 rounded-sm p-6">
        <h2 className="font-display text-base text-gold tracking-wider uppercase mb-2">
          Exit-Intent Popup
        </h2>
        <p className="font-body text-xs text-wool-muted mb-5">
          Desktop only. Triggers once when the visitor's cursor leaves the top of the viewport.
          Cooled down per visitor after dismissal.
        </p>
        <div className="space-y-4">
          {checkboxRow(
            popups.exitIntent.enabled,
            (v) => setExitIntent({ enabled: v }),
            'Enable exit-intent popup',
          )}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={popups.exitIntent.title}
              onChange={(e) => setExitIntent({ title: e.target.value })}
              className={inputClass}
              maxLength={120}
              placeholder="Before you go…"
            />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea
              value={popups.exitIntent.body}
              onChange={(e) => setExitIntent({ body: e.target.value })}
              rows={3}
              maxLength={500}
              className={`${inputClass} resize-none`}
              placeholder="Take a look at our funded challenges before you leave."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CTA Label</label>
              <input
                type="text"
                value={popups.exitIntent.ctaLabel}
                onChange={(e) => setExitIntent({ ctaLabel: e.target.value })}
                className={inputClass}
                maxLength={60}
                placeholder="See programs"
              />
            </div>
            <div>
              <label className={labelClass}>CTA URL</label>
              <input
                type="text"
                value={popups.exitIntent.ctaUrl}
                onChange={(e) => setExitIntent({ ctaUrl: e.target.value })}
                className={inputClass}
                maxLength={500}
                placeholder="/programs"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Cooldown (days)</label>
            <input
              type="number"
              value={popups.exitIntent.cooldownDays}
              onChange={(e) =>
                setExitIntent({ cooldownDays: Number(e.target.value) || 30 })
              }
              className={inputClass}
              min={0}
              max={365}
            />
          </div>
        </div>
      </section>
    </>
  );
}
