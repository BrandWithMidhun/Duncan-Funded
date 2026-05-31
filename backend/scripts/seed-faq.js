// Seed the FAQ tables with the initial 7 categories and all their items.
// Idempotent by default — only seeds if the table is empty.
// Run with --force to wipe and reseed.
import 'dotenv/config';
import { initDb, closeDb } from '../src/lib/db.js';
import { seedFromStatic } from '../src/services/faqService.js';

// Re-declared here so this script is self-contained and doesn't depend
// on the frontend's TypeScript build.
const FAQ_CATEGORIES = [
  {
    label: 'General FAQs',
    faqs: [
      { q: 'What is a Hard Breach vs. Soft Breach?', a: 'Soft breach closes violating trades but allows continued trading. Hard breach (Daily Loss Limit, Max Drawdown, or Inactivity) results in account termination.' },
      { q: 'Do I need to complete KYC?', a: 'Yes, KYC and a trader agreement are required before withdrawals.' },
      { q: 'What happens if I fail KYC?', a: 'Your withdrawal will be rejected, and the account closed.' },
      { q: 'Who is the counterparty to my trades?', a: 'The firm may act as counterparty to manage risk, but execution is always at market prices.' },
      { q: 'Do you manipulate pricing or executions?', a: 'No, pricing and executions come directly from liquidity providers/exchanges.' },
      { q: 'What countries are accepted?', a: 'Traders from all countries except OFAC-listed ones.' },
      { q: 'Minimum age requirement?', a: 'At least 18 years old (or legal minimum in your country).' },
      { q: 'Where can I track account progress?', a: 'Via the trader dashboard, updated in near real time.' },
      { q: 'Are commissions charged?', a: 'Yes, same as liquidity providers/exchanges.' },
      { q: 'Can I use automated strategies?', a: 'Allowed in FX/Futures, but not supported in Crypto programs.' },
      { q: 'What is prohibited trading?', a: 'Exploiting latency/errors, insider info, front-running, arbitrage, off-the-shelf strategies, gambling-style trading, or trading during restricted news events.' },
    ],
  },
  {
    label: 'Instant Funding (Standard)',
    faqs: [
      { q: 'What is Instant Funding?', a: 'Direct access to a funded account without an assessment phase.' },
      { q: 'What is the Daily Loss Limit?', a: "5%, calculated from prior day's balance or equity." },
      { q: 'What is the Maximum Drawdown?', a: '8% trailing, locks at starting balance after payout.' },
      { q: 'Can I hold positions over the weekend?', a: 'Positions must be closed unless Weekend Hold add-on is purchased.' },
      { q: 'What is the Profit Split?', a: '80% standard, 90% with add-on.' },
      { q: 'How do withdrawals work?', a: 'Once every 30 days, minimum $100 or 1% of starting balance.' },
      { q: 'What happens on breach?', a: 'Gains forfeited unless Payout Protector add-on is purchased.' },
    ],
  },
  {
    label: 'Instant Funding Lite',
    faqs: [
      { q: 'What is the Consistency Rule?', a: "No single day's profit may exceed 25% of total account profit." },
      { q: 'What is the Profit Buffer?', a: 'First 3% profit is non-withdrawable; withdrawals allowed only above this buffer.' },
      { q: 'When can I request my first withdrawal?', a: 'After meeting both the buffer and consistency rule, then every 14 days.' },
      { q: 'What is the Daily Loss Limit?', a: "3%, calculated from prior day's balance or equity." },
      { q: 'What is the Maximum Drawdown?', a: '5% trailing, locks at starting balance after payout.' },
    ],
  },
  {
    label: 'One Step Program',
    faqs: [
      { q: 'What is the Profit Target?', a: '10% in assessment; none in funded accounts.' },
      { q: 'What is the Daily Loss Limit?', a: "5%, calculated from prior day's balance/equity." },
      { q: 'What is the Maximum Drawdown?', a: '6%, static (does not trail).' },
      { q: 'What is the Inactivity Rule?', a: 'Breach if no trades for 30 days.' },
      { q: 'How do withdrawals work?', a: 'Allowed every 30 days, subject to 80/20 split. Lock Upon Payout applies unless disabled via add-on.' },
      { q: 'Can I hold positions over the weekend?', a: 'Allowed, but only crypto trades over weekends.' },
      { q: 'What are lot sizes?', a: 'Forex = $100k notional, Gold = 100 oz, Oil = 100 barrels, etc.' },
      { q: 'Can I trade during News Events?', a: 'Prohibited within 3 minutes before/after news events.' },
    ],
  },
  {
    label: 'Crypto One Step',
    faqs: [
      { q: 'What is the Profit Target?', a: '9% in assessment; none in funded accounts.' },
      { q: 'What is the Maximum Drawdown?', a: '6%, static.' },
      { q: 'What is the Daily Cap Limit?', a: "±3% of prior day's equity." },
      { q: 'What is the Leverage?', a: 'BTC/ETH = 5:1, others = 2:1.' },
      { q: 'How do withdrawals work?', a: 'Every 30 days, subject to 90/10 profit split.' },
      { q: 'Can I hold positions over the weekend?', a: 'Yes.' },
      { q: 'Are automated strategies supported?', a: 'Not supported on DXTrade.' },
      { q: 'Are commissions charged?', a: '0.05% per side of notional trade volume.' },
      { q: 'Can I trade during News Events?', a: 'Prohibited within 3 minutes before/after news events.' },
    ],
  },
  {
    label: 'Crypto Two Step',
    faqs: [
      { q: 'What are the Profit Targets?', a: 'Step 1 = 6%, Step 2 = 9%.' },
      { q: 'What is the Maximum Drawdown?', a: '9%, static.' },
      { q: 'What is the Daily Cap Limit?', a: "±3% of prior day's equity." },
      { q: 'What is the Leverage?', a: 'BTC/ETH = 5:1, others = 2:1.' },
      { q: 'How do withdrawals work?', a: 'Every 30 days, subject to 90/10 profit split.' },
      { q: 'Can I hold positions over the weekend?', a: 'Yes.' },
      { q: 'Are automated strategies supported?', a: 'Not supported on DXTrade.' },
      { q: 'Are commissions charged?', a: '0.05% per side of notional trade volume.' },
      { q: 'Can I trade during News Events?', a: 'Prohibited within 3 minutes before/after news events.' },
    ],
  },
  {
    label: 'Funded Futures Program',
    faqs: [
      { q: 'How do the phases work?', a: '4 phases with 9% profit target each, then transition to Live Funded account.' },
      { q: 'When do I get payouts?', a: 'At the end of each phase, once consistency rule is met.' },
      { q: 'What is the Consistency Requirement?', a: "Best day's profit ≤ 25% of total." },
      { q: 'What is the Maximum Trailing Loss?', a: '5% trailing on end-of-day balance, locks at starting balance after 5% return.' },
      { q: 'Can I reset my account?', a: 'No, a new account must be purchased.' },
      { q: 'Can I hold positions over the weekend?', a: 'No, all positions must be closed daily at 15:55 CST.' },
      { q: 'What are Futures contracts?', a: 'Standardized contracts (e.g., ES = $50 × index price).' },
      { q: 'What are Market Data Fees?', a: 'Included in purchase during Phases 1–4; deducted monthly in Live Funded.' },
      { q: 'What is the 60 Day Maximum Time rule?', a: 'Each phase must be completed within 60 days.' },
      { q: 'What is the Inactivity Rule?', a: 'Breach if no trades for 14 days (phases) or 7 days (Live Funded).' },
      { q: 'How do withdrawals work?', a: 'Payouts at each phase, then every 30 days in Live Funded.' },
      { q: 'What are the trading hours?', a: 'CME Globex open 17:00 CST, close 15:55 CST daily.' },
      { q: 'What products can I trade?', a: 'Futures only (CME, COMEX, NYMEX, CBOT).' },
      { q: 'What is prohibited trading?', a: 'Latency exploitation, insider info, gambling-style trading, arbitrage, prohibited strategies.' },
    ],
  },
];

const force = process.argv.includes('--force');

async function main() {
  console.log(force ? '🌱 Force-seeding FAQ (will wipe existing)...' : '🌱 Seeding FAQ...');
  await initDb();
  const result = await seedFromStatic(FAQ_CATEGORIES, { force });
  if (result.skipped) {
    console.log('• FAQ already populated — pass --force to reseed. Skipped.');
  } else {
    console.log(`✅ Seeded ${result.seeded} categories.`);
  }
}

main()
  .then(() => closeDb())
  .catch(async (e) => {
    console.error(e);
    await closeDb();
    process.exit(1);
  });
