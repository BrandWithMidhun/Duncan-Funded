'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TradingCandle } from './TradingBackground';
import { trackEvent } from './AnalyticsTracker';
import {
  getSettings,
  DEFAULT_SETTINGS,
  getPrograms,
  type SiteSettings,
  type PublicProgram,
  type PublicProgramRule,
} from '@/lib/api';

/**
 * Programs configurator — informational version.
 *
 * Previous incarnations of this component had a live pricing
 * calculator: clickable sizes, platforms, and toggleable add-ons that
 * recalculated a total in real-time. The new design (Lovable Programs.tsx)
 * drops that interactivity — sizes / platforms / add-ons render as
 * read-only chips, the submit button is just "Start Trading", and the
 * actual checkout happens on the external broker dashboard.
 *
 * What's still interactive:
 *   - Selecting which program's rules to display (radio list)
 *   - The Terms & Conditions agreement checkbox
 *   - The Start Trading button (opens the broker dashboard CTA URL)
 *
 * Data flow:
 *   - Pull live programs from /api/programs once mounted; render the
 *     hardcoded fallback until the API resolves so SSR / first paint
 *     is never empty.
 *   - Rules support both legacy `string[]` and new `{color, text}[]`
 *     shapes — `toRules()` normalises at render time.
 *   - `?p=<id|slug>` query param deep-links to a specific program
 *     (used by the chat widget action chips).
 */

type Addon = {
  id: string;
  label: string;
  percent: number;
  group?: string;
};

type Rule = { color: 'green' | 'red'; text: string };

type Program = {
  id: string;
  name: string;
  platforms: string[];
  sizes: number[];
  prices: Record<number, number>;
  rules: PublicProgramRule[];
  addons: Addon[];
};

/** Normalise rules into the colored shape for rendering. */
function toRules(raw: PublicProgramRule[]): Rule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r): Rule | null => {
      if (typeof r === 'string') {
        const t = r.trim();
        return t ? { color: 'green', text: t } : null;
      }
      if (r && typeof r === 'object' && typeof r.text === 'string') {
        const t = r.text.trim();
        if (!t) return null;
        return { color: r.color === 'red' ? 'red' : 'green', text: t };
      }
      return null;
    })
    .filter((r): r is Rule => r !== null);
}

// ---- Fallback program list ----
// Used until /api/programs responds. Kept in sync with the backend
// defaultPrograms.js so SSR shows real content even if the API is
// down. If you edit one, edit both.
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

const fallbackPrograms: Program[] = [
  {
    id: 'forex-one-step',
    name: 'Forex One Step Assessment',
    platforms: ['cTrader', 'DXtrade', 'GooeyPro', 'MTR'],
    sizes: [5000, 10000, 25000, 50000, 100000, 250000, 400000],
    prices: { 5000: 44, 10000: 95, 25000: 240, 50000: 455, 100000: 910, 250000: 2250, 400000: 4000 },
    rules: [
      { color: 'green', text: 'Base Profit Split: 80%' },
      { color: 'green', text: 'Profit Target: 10%' },
      { color: 'red', text: 'Daily Drawdown: 5%' },
      { color: 'red', text: 'Max Drawdown Fixed: 6%' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'red', text: '14-Day Withdraw Rule' },
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
      { color: 'green', text: 'Base Profit Split: 80%' },
      { color: 'green', text: 'Profit Target: 8% (Phase 1), 5% (Phase 2)' },
      { color: 'red', text: 'Daily Drawdown: 5%' },
      { color: 'red', text: 'Max Drawdown Fixed: 7%' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'red', text: '14-Day Withdraw Rule' },
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
      { color: 'green', text: 'Base Profit Split: 80%' },
      { color: 'green', text: 'No Profit Target' },
      { color: 'green', text: 'Minimum Withdraw 1% — $5k minimum $100' },
      { color: 'green', text: 'No minimum trading days' },
      { color: 'green', text: 'No minimum profitable day' },
      { color: 'green', text: 'No 14-Day Withdrawal Rule' },
      { color: 'green', text: 'No Consistency Rule' },
      { color: 'red', text: 'Daily Drawdown: 5%' },
      { color: 'red', text: 'Max Drawdown: 8% (Trailing)' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'green', text: 'Complete KYC and sign the trader contract' },
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
      { color: 'green', text: 'Base Profit Split: 80%' },
      { color: 'green', text: 'No Profit Target' },
      { color: 'green', text: 'Minimum Withdraw 1% — $5k minimum $100' },
      { color: 'green', text: 'No minimum trading days' },
      { color: 'green', text: 'No minimum profitable day' },
      { color: 'green', text: 'No 14-Day Withdrawal Rule' },
      { color: 'red', text: 'Daily Drawdown: 3%' },
      { color: 'red', text: 'Max Drawdown: 5% (Trailing)' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'green', text: 'Profit Buffer: 3%' },
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
      { color: 'green', text: 'Base Profit Split: 90%' },
      { color: 'green', text: 'Profit Target: 9%' },
      { color: 'green', text: 'Daily Cap Limit: 3% (profit and loss)' },
      { color: 'red', text: 'Max Drawdown Fixed: 6%' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'green', text: '24/7 Crypto Markets' },
      { color: 'green', text: 'Stable Coin + Altcoin Pairs' },
      { color: 'red', text: '14-Day Withdraw Rule' },
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
      { color: 'green', text: 'Base Profit Split: 90%' },
      { color: 'green', text: 'Profit Target: 6% (Phase 1), 9% (Phase 2)' },
      { color: 'green', text: 'Daily Cap Limit: 3% (profit and loss)' },
      { color: 'red', text: 'Max Drawdown Fixed: 9% (both phases)' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'green', text: '24/7 Crypto Markets' },
      { color: 'green', text: 'Stable Coin + Altcoin Pairs' },
      { color: 'green', text: 'Weekend Trading' },
      { color: 'red', text: '14-Day Withdraw Rule' },
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
      { color: 'green', text: '4-Phase Assessment Program' },
      { color: 'green', text: 'Profit Target: Phase 1 - 10%, Phase 2 - 5%, Phase 3 - 3%, Funded - 0%' },
      { color: 'red', text: 'Daily Drawdown: All Phases 5%' },
      { color: 'red', text: 'Max Drawdown Fixed: Phase 1-3 6%, Funded 5% (Trailing)' },
      { color: 'green', text: 'Choose from multiple platforms' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'red', text: 'Payouts per phase — must withdraw before advancing to the next phase' },
      { color: 'green', text: 'Reset Available' },
      { color: 'red', text: '14-Day Withdraw Rule' },
    ],
    addons: PAYOUT_ONLY_ADDONS,
  },
  {
    id: 'equities-one-step',
    name: 'Equities',
    platforms: ['GooeyPro'],
    sizes: [5000, 10000, 25000, 50000, 100000, 200000],
    prices: { 5000: 55, 10000: 79, 25000: 179, 50000: 329, 100000: 649, 200000: 1499 },
    rules: [
      { color: 'green', text: 'US Equities & ETFs' },
      { color: 'green', text: 'Base Profit Split: 80%' },
      { color: 'green', text: 'Profit Target: 8%' },
      { color: 'red', text: 'Daily Drawdown: 2.5% (Trailing, Intraday)' },
      { color: 'red', text: 'Daily Profit Cap: 2.5% (evaluation only — soft breach, resume next trading day)' },
      { color: 'red', text: 'Max Drawdown Fixed: 3%' },
      { color: 'red', text: 'Consistency Rule: 25% (funded only)' },
      { color: 'red', text: 'Trading Window: 9:30 a.m. - 3:30 p.m. EST (Regular Sessions Only)' },
      { color: 'green', text: 'Choose Add-on' },
      { color: 'red', text: '14-Day Withdraw Rule' },
    ],
    addons: EQUITIES_ADDONS,
  },
];

const formatPrice = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ProgramsConfigurator() {
  const [livePrograms, setLivePrograms] = useState<Program[] | null>(null);
  const effectivePrograms = livePrograms ?? fallbackPrograms;
  const fallbackInitialId = effectivePrograms[2]?.id ?? effectivePrograms[0]?.id ?? '';
  const [programId, setProgramId] = useState<string>(fallbackInitialId);

  const program = useMemo(
    () => effectivePrograms.find((p) => p.id === programId) ?? effectivePrograms[0],
    [effectivePrograms, programId],
  );

  const [agreed, setAgreed] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => active && setSettings(s));
    getPrograms().then((list: PublicProgram[]) => {
      if (!active || list.length === 0) return;
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

      // Deep-link via ?p=<id|slug> (used by chat action chips)
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
      }

      if (requested && typeof window !== 'undefined') {
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
    trackEvent('program_selected', { program: next.name, programId: id });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setNotice({ kind: 'err', msg: 'Please agree to the Terms and Conditions to continue.' });
      return;
    }
    const ctaUrl = settings.urls.getFunded;
    trackEvent('signup_clicked', {
      program: program.name,
      programId: program.id,
      source: 'programs_configurator',
    });
    setNotice({ kind: 'ok', msg: `Starting ${program.name} — opening the broker dashboard…` });
    if (/^https?:\/\//i.test(ctaUrl)) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const rules = toRules(program.rules);

  return (
    <section className="relative pt-10 pb-24 border-t border-gold/15">
      {/* "Configure & Begin / Build Your Account" section header */}
      <div className="container mx-auto px-6 relative z-10 mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-12 h-px bg-gold/40" />
          <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
            Configure &amp; Begin
          </span>
          <div className="w-12 h-px bg-gold/40" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl tracking-wider">
          <span className="gold-text-gradient">Build Your</span>{' '}
          <span className="text-foreground">Account</span>
        </h2>
      </div>

      {/* Watermark crest — fixed bottom-left, near-invisible */}
      <div
        aria-hidden
        className="pointer-events-none select-none fixed left-6 bottom-6 w-40 md:w-56 opacity-[0.04] z-0"
        style={{
          backgroundImage: "url('/assets/duncan-crest.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left bottom',
          aspectRatio: '224 / 307',
        }}
      />
      <div className="absolute inset-0 tartan-texture opacity-[0.06] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="space-y-10">
            {/* Programs (radio list) */}
            <div id="configurator">
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Programs
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

            {/* Rules — per-rule color */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Rules
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
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start font-body text-sm text-wool/85">
                      <TradingCandle variant={rule.color} />
                      <span>{rule.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Accounts (read-only chips) */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Accounts
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.sizes.map((s) => (
                  <span
                    key={s}
                    className="px-4 py-2 font-display text-sm tracking-wider rounded-sm border border-gold/25 text-wool/80"
                  >
                    {formatPrice(s)}
                  </span>
                ))}
              </div>
            </div>

            {/* Trading Platforms (read-only chips) */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Trading Platforms
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.platforms.map((p) => (
                  <span
                    key={p}
                    className="px-5 py-2 font-display text-xs tracking-[0.2em] uppercase rounded-sm border border-gold/25 text-wool/80"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Enhancements (read-only list) */}
            <div>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-wool mb-4">
                Enhancements
              </h2>
              <div className="border border-gold/20 bg-highland/40 backdrop-blur-sm rounded-sm divide-y divide-gold/10">
                {program.addons.length === 0 ? (
                  <div className="px-5 py-4 font-body text-sm text-wool-muted italic">
                    No add-ons available for this program.
                  </div>
                ) : (
                  program.addons.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                      <TradingCandle variant="green" />
                      <div className="flex-1">
                        <div className="font-display text-sm tracking-wider text-gold">
                          {a.label}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Terms + Submit */}
            <div className="border-t border-gold/20 pt-6 space-y-5">
              {notice && (
                <p
                  className={`font-body text-sm px-4 py-3 rounded-sm border ${
                    notice.kind === 'err'
                      ? 'text-heritage bg-heritage/10 border-heritage/30'
                      : 'text-gold bg-gold/10 border-gold/30'
                  }`}
                >
                  {notice.msg}
                </p>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span
                  className={`mt-0.5 w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
                    agreed
                      ? 'bg-gradient-to-br from-gold to-gold-light border-gold'
                      : 'border-gold/40'
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
                  <a
                    href="/terms"
                    className="text-gold underline underline-offset-2"
                  >
                    Terms and Conditions
                  </a>
                  .
                </span>
              </label>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gold-gradient text-background font-display text-sm tracking-[0.2em] uppercase py-3.5 rounded-sm shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow"
              >
                Start Trading
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
