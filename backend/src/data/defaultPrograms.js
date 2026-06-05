/**
 * Source of truth for the default program lineup. Used by:
 *   - scripts/seed-programs.js  (manual seed CLI)
 *   - src/services/programService.js#autoSeedIfEmpty (called on boot)
 *
 * Adding a new program here makes it appear automatically the next
 * time the server boots on an empty database — admins can still edit
 * or delete it afterwards through /admin/programs.
 */

const FOREX_ADDONS = [
  { id: 'remove-lock', label: 'Remove Lock on Payout', percent: 25 },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];
const INSTANT_ADDONS = [
  { id: 'profit-share', label: 'Profit Share', percent: 20 },
  { id: 'hold-weekend', label: 'Hold Weekend', percent: 10 },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];
const PAYOUT_ONLY = [{ id: 'payout-protector', label: 'Payout Protector', percent: 25 }];
const EQUITIES_ADDONS = [
  { id: 'profit-share', label: 'Profit Share', percent: 15 },
  { id: 'remove-lock', label: 'Remove Lock on Payout', percent: 25 },
  { id: 'consistency-33', label: 'Relaxed Consistency to 33%', percent: 20, group: 'consistency' },
  { id: 'consistency-50', label: 'Relaxed Consistency to 50%', percent: 35, group: 'consistency' },
  { id: 'payout-protector', label: 'Payout Protector', percent: 25 },
];

export const DEFAULT_PROGRAMS = [
  {
    category: 'forex',
    name: 'Forex One Step Assessment',
    popular: false,
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
    category: 'forex',
    name: 'Forex Two Step Assessment',
    popular: false,
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
    category: 'forex',
    name: 'Instant Funded Forex Account',
    popular: true,
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
    category: 'forex',
    name: 'Instant Funded Forex Lite Account',
    popular: false,
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
    category: 'crypto',
    name: 'Crypto One Step Assessment',
    popular: false,
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
    addons: PAYOUT_ONLY,
  },
  {
    category: 'crypto',
    name: 'Crypto Two Step Assessment',
    popular: true,
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
    addons: PAYOUT_ONLY,
  },
  {
    category: 'futures',
    name: 'Futures Assessment',
    popular: true,
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
    addons: PAYOUT_ONLY,
  },
  {
    category: 'equities',
    name: 'Equities One Step Assessment',
    popular: true,
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
