'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TradingCandle } from './TradingBackground';
import {
  getSettings,
  DEFAULT_SETTINGS,
  getPrograms,
  type SiteSettings,
  type PublicProgram,
} from '@/lib/api';

type Addon = {
  id: string;
  label: string;
  percent: number; // percent of base plan price
  group?: string; // mutually exclusive within a group
};

type Program = {
  id: string;
  name: string;
  platforms: string[];
  sizes: number[];
  prices: Record<number, number>;
  rules: string[];
  addons: Addon[];
};

const FOREX_ADDONS: Addon[] = [
  { id: 'remove-lock', label: 'Remove Lock on Payout', percent: 25 },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];

const INSTANT_ADDONS: Addon[] = [
  { id: 'profit-share', label: 'Profit Share', percent: 20 },
  { id: 'hold-weekend', label: 'Hold Weekend', percent: 10 },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];

const PAYOUT_ONLY_ADDONS: Addon[] = [
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];

const EQUITIES_ADDONS: Addon[] = [
  { id: 'profit-share', label: 'Profit Share', percent: 15 },
  { id: 'remove-lock', label: 'Remove Lock on Payout', percent: 25 },
  { id: 'consistency-33', label: 'Relaxed Consistency to 33%', percent: 20, group: 'consistency' },
  { id: 'consistency-50', label: 'Relaxed Consistency to 50%', percent: 35, group: 'consistency' },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];

const programs: Program[] = [
  {
    id: 'forex-one-step',
    name: 'Forex One Step Assessment',
    platforms: ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'],
    sizes: [5000, 10000, 25000, 50000, 100000, 250000, 400000],
    prices: { 5000: 44, 10000: 95, 25000: 240, 50000: 455, 100000: 910, 250000: 2250, 400000: 4000 },
    rules: [
      'Max Drawdown: 6%',
      'Daily Drawdown: 5%',
      'Profit Target: 10%',
      'Base Profit Split: 80%',
      'Choose from multiple trading platforms',
    ],
    addons: FOREX_ADDONS,
  },
  {
    id: 'forex-two-step',
    name: 'Forex Two Step Assessment',
    platforms: ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'],
    sizes: [5000, 10000, 25000, 50000, 100000, 250000, 400000],
    prices: { 5000: 30, 10000: 60, 25000: 145, 50000: 263, 100000: 525, 250000: 1500, 400000: 2600 },
    rules: [
      'Max Drawdown: 7%',
      'Daily Drawdown: 5%',
      'Profit Target: 8% (Phase 1), 5% (Phase 2)',
      'Base Profit Split: 85%',
      'Choose from multiple trading platforms',
    ],
    addons: FOREX_ADDONS,
  },
  {
    id: 'instant-funded-forex',
    name: 'Instant Funded Forex Account',
    platforms: ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'],
    sizes: [5000, 10000, 25000, 50000, 100000],
    prices: { 5000: 250, 10000: 500, 25000: 1350, 50000: 3000, 100000: 5750 },
    rules: [
      'Max Drawdown: 8% (Trailing)',
      'Daily Max Loss Limit: 5%',
      'No Profit Target',
      'Base Profit Split: 80%',
      'Complete KYC and sign the trader contract to become eligible for withdrawals',
    ],
    addons: INSTANT_ADDONS,
  },
  {
    id: 'instant-funded-forex-lite',
    name: 'Instant Funded Forex Lite Account',
    platforms: ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'],
    sizes: [5000, 10000, 25000, 50000, 100000],
    prices: { 5000: 85, 10000: 145, 25000: 260, 50000: 400, 100000: 700 },
    rules: [
      'Max Drawdown: 5% (Trailing)',
      'Daily Max Loss Limit: 3%',
      'No Profit Target',
      'Base Profit Split: 80%',
      'Consistency Requirement: 25%',
      'Profit Buffer: 3%',
    ],
    addons: INSTANT_ADDONS,
  },
  {
    id: 'crypto-one-step',
    name: 'Crypto One Step Assessment',
    platforms: ['DXtrade', 'GooeyPro'],
    sizes: [5000, 10000, 25000, 50000, 100000, 200000],
    prices: { 5000: 55, 10000: 115, 25000: 300, 50000: 625, 100000: 1200, 200000: 2250 },
    rules: [
      '1-Step Evaluation',
      'Profit Target: 10%',
      'Max Drawdown: 6%',
      'Daily Drawdown: 4%',
      'Base Profit Split: 80%',
      '24/7 Crypto Markets',
    ],
    addons: PAYOUT_ONLY_ADDONS,
  },
  {
    id: 'crypto-two-step',
    name: 'Crypto Two Step Assessment',
    platforms: ['DXtrade', 'GooeyPro'],
    sizes: [5000, 10000, 25000, 50000, 100000, 200000],
    prices: { 5000: 45, 10000: 100, 25000: 250, 50000: 500, 100000: 995, 200000: 2000 },
    rules: [
      '2-Phase Evaluation',
      'Profit Target: 8% (Phase 1), 5% (Phase 2)',
      'Max Daily Loss: 5%',
      'Max Total Loss: 10%',
      'Base Profit Split: 85%',
      'Major + Altcoin Pairs, Weekend Trading',
    ],
    addons: PAYOUT_ONLY_ADDONS,
  },
  {
    id: 'futures-assessment',
    name: 'Futures Assessment',
    platforms: ['DXFuture', 'Volumetrica'],
    sizes: [25000, 50000, 100000, 150000],
    prices: { 25000: 305, 50000: 604, 100000: 1150, 150000: 1500 },
    rules: [
      'Single-Phase Evaluation',
      'Trailing Drawdown',
      'CME, COMEX, NYMEX',
      'Base Profit Split: 80%',
      'Payouts Every 30 Days',
      'Reset Available',
    ],
    addons: PAYOUT_ONLY_ADDONS,
  },
  {
    id: 'equities-one-step',
    name: 'Equities One Step Assessment',
    platforms: ['GooeyPro'],
    sizes: [5000, 10000, 25000, 50000, 100000, 200000],
    prices: { 5000: 55, 10000: 79, 25000: 179, 50000: 329, 100000: 649, 200000: 1499 },
    rules: [
      'One Step Equities Assessment',
      'Profit Target: 8%',
      'Max Drawdown: 5%',
      'Base Profit Split: 80%',
      'US Equities & ETFs',
      'Pre/Post Market',
    ],
    addons: EQUITIES_ADDONS,
  },
];

const formatPrice = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ProgramsConfigurator() {
  // The hardcoded `programs` array below acts as the fallback used until
  // the API responds (or permanently if it never does).
  const [livePrograms, setLivePrograms] = useState<Program[] | null>(null);
  const effectivePrograms = livePrograms ?? programs;
  const fallbackInitialId = effectivePrograms[2]?.id ?? effectivePrograms[0]?.id ?? '';
  const [programId, setProgramId] = useState<string>(fallbackInitialId);

  // Resolve current program from the effective list. Defaults to first
  // if the previously-selected id no longer exists (admin deleted it, etc).
  const program = useMemo(
    () => effectivePrograms.find((p) => p.id === programId) ?? effectivePrograms[0],
    [effectivePrograms, programId],
  );

  const [size, setSize] = useState<number>(program?.sizes[2] ?? program?.sizes[0] ?? 0);
  const [platform, setPlatform] = useState<string>(program?.platforms[0] ?? '');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => active && setSettings(s));
    getPrograms().then((list: PublicProgram[]) => {
      if (!active || list.length === 0) return;
      // Map PublicProgram -> Program (adapter — server includes extra fields)
      const mapped: Program[] = list.map((p) => ({
        id: p.id,
        name: p.name,
        platforms: p.platforms,
        sizes: p.sizes,
        prices: Object.fromEntries(
          Object.entries(p.prices).map(([k, v]) => [Number(k), Number(v)]),
        ) as Record<number, number>,
        rules: p.rules,
        addons: p.addons.map((a) => ({
          id: a.id,
          label: a.label,
          percent: a.percent,
          ...(a.group ? { group: a.group } : {}),
        })),
      }));
      setLivePrograms(mapped);

      // Honour a ?p= query param if present so chat action chips
      // can deep-link the user to the exact program they tapped.
      // Accepts both program id and slug (defensive — server might
      // change which one it sends in the chip href).
      let requested: Program | undefined;
      if (typeof window !== 'undefined') {
        const param = new URLSearchParams(window.location.search).get('p');
        if (param) {
          requested =
            mapped.find((p) => p.id === param) ||
            mapped.find(
              (p) => p.name.toLowerCase().replace(/\s+/g, '-') === param.toLowerCase(),
            );
        }
      }

      const next = requested ?? mapped.find((p) => p.id === programId) ?? mapped[2] ?? mapped[0];
      if (next && next.id !== programId) {
        setProgramId(next.id);
        setSize(next.sizes[2] ?? next.sizes[0] ?? 0);
        setPlatform(next.platforms[0] ?? '');
        setSelectedAddons({});
      } else if (requested) {
        // Same id requested as already set — still reset dependent state
        // so the user sees a clean config for the deep-linked program.
        setSize(requested.sizes[2] ?? requested.sizes[0] ?? 0);
        setPlatform(requested.platforms[0] ?? '');
        setSelectedAddons({});
      }

      // If we arrived with ?p=, scroll the configurator into view so the
      // user lands directly on the selected program.
      if (requested && typeof window !== 'undefined') {
        // Small delay so the layout has the live programs rendered.
        setTimeout(() => {
          const el = document.getElementById('configurator');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!program) return null;

  const handleProgramChange = (id: string) => {
    const next = effectivePrograms.find((p) => p.id === id);
    if (!next) return;
    setProgramId(id);
    if (!next.sizes.includes(size)) setSize(next.sizes[Math.min(2, next.sizes.length - 1)] ?? 0);
    if (!next.platforms.includes(platform)) setPlatform(next.platforms[0] ?? '');
    setSelectedAddons({});
  };

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const isOn = !!prev[addon.id];
      const next = { ...prev, [addon.id]: !isOn };
      if (!isOn && addon.group) {
        for (const a of program.addons) {
          if (a.group === addon.group && a.id !== addon.id) next[a.id] = false;
        }
      }
      return next;
    });
  };

  const basePrice = program.prices[size] ?? 0;
  const addonsPercent = program.addons.reduce(
    (acc, a) => acc + (selectedAddons[a.id] ? a.percent : 0),
    0,
  );
  const total = Math.round(basePrice * (1 + addonsPercent / 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setNotice({ kind: 'err', msg: 'Please agree to the Terms and Conditions to continue.' });
      return;
    }
    const ctaUrl = settings.urls.getFunded;
    setNotice({
      kind: 'ok',
      msg: `Challenge configured: ${program.name} • ${formatPrice(size)} • ${platform} • ${formatPrice(total)}`,
    });
    if (/^https?:\/\//i.test(ctaUrl)) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="relative pb-24">
      <Image
        src="/assets/duncan-crest.png"
        alt=""
        aria-hidden
        width={224}
        height={307}
        className="pointer-events-none select-none fixed left-6 bottom-6 w-40 md:w-56 h-auto opacity-[0.04] z-0"
      />
      <div className="absolute inset-0 tartan-texture opacity-[0.06]" />

      <div className="container mx-auto px-6 relative z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="space-y-10">
            {/* Program Type */}
            <div id="configurator">
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Program Type
              </h2>
              <div className="border border-gold/20 bg-highland/40 backdrop-blur-sm rounded-sm divide-y divide-gold/10">
                {effectivePrograms.map((p) => {
                  const active = p.id === programId;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                        active ? 'bg-gold/10' : 'hover:bg-gold/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        className="sr-only"
                        checked={active}
                        onChange={() => handleProgramChange(p.id)}
                      />
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          active ? 'border-gold' : 'border-gold/40'
                        }`}
                      >
                        {active && <span className="w-2 h-2 rounded-full bg-gold" />}
                      </span>
                      <span
                        className={`font-body text-sm tracking-wide ${
                          active ? 'text-gold' : 'text-wool/85'
                        }`}
                      >
                        {p.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Program Rules */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Program Rules
              </h2>
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-gold/20 bg-highland/50 backdrop-blur-sm rounded-sm p-6"
              >
                <h3 className="font-display text-base tracking-wider text-gold mb-4 uppercase">
                  {program.name}
                </h3>
                <ul className="space-y-2.5">
                  {program.rules.map((rule, i) => (
                    <li key={i} className="flex items-start font-body text-sm text-wool/85">
                      <TradingCandle variant={i % 3 === 2 ? 'red' : 'green'} />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Account Size */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Account Size
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.sizes.map((s) => {
                  const active = s === size;
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-4 py-2 font-display text-sm tracking-wider rounded-sm border transition-all ${
                        active
                          ? 'bg-gradient-to-r from-gold to-gold-light text-pine border-gold shadow-md shadow-gold/30'
                          : 'border-gold/25 text-wool/80 hover:border-gold/60 hover:text-gold'
                      }`}
                    >
                      {formatPrice(s)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trading Platform */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Trading Platform
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.platforms.map((p) => {
                  const active = p === platform;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-5 py-2 font-display text-xs tracking-[0.2em] uppercase rounded-sm border transition-all ${
                        active
                          ? 'bg-gold/15 border-gold text-gold'
                          : 'border-gold/25 text-wool/80 hover:border-gold/60 hover:text-gold'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Enhance Your Program{' '}
                <span className="font-accent italic text-sm normal-case tracking-normal text-wool-muted">
                  (Optional)
                </span>
              </h2>
              <div className="border border-gold/20 bg-highland/40 backdrop-blur-sm rounded-sm divide-y divide-gold/10">
                {program.addons.map((a) => {
                  const checked = !!selectedAddons[a.id];
                  const addonCost = Math.round(basePrice * (a.percent / 100));
                  return (
                    <label
                      key={a.id}
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gold/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleAddon(a)}
                      />
                      <span
                        className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
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
                      <div className="flex-1">
                        <div className="font-display text-sm tracking-wider text-gold">{a.label}</div>
                        <div className="font-body text-xs text-wool-muted mt-0.5">
                          +{a.percent}%{a.group && ' (one option only)'}
                        </div>
                      </div>
                      <div className="font-display text-sm text-wool/80">+{formatPrice(addonCost)}</div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Terms + Submit */}
            <div className="border-t border-gold/20 pt-6 space-y-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span
                  className={`mt-0.5 w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
                    agreed ? 'bg-gradient-to-br from-gold to-gold-light border-gold' : 'border-gold/40'
                  }`}
                >
                  {agreed && (
                    <svg className="w-3.5 h-3.5 text-pine" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span className="font-body text-xs text-wool-muted leading-relaxed">
                  I confirm that I have read and agree to the{' '}
                  <a href="/terms" className="text-gold underline underline-offset-2">
                    Terms and Conditions
                  </a>
                  .
                </span>
              </label>

              {notice && (
                <div
                  className={`font-body text-sm border px-4 py-3 rounded-sm ${
                    notice.kind === 'ok'
                      ? 'border-gold/40 bg-gold/5 text-gold'
                      : 'border-heritage/40 bg-heritage/10 text-heritage'
                  }`}
                >
                  {notice.msg}
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gold-gradient text-background font-display text-sm tracking-[0.2em] uppercase py-3.5 rounded-sm shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow"
              >
                Start My Program — {formatPrice(total)}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
