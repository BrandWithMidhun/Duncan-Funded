/**
 * Default Trader Arsenal tools. Used by tradeZoneService.seedIfEmpty()
 * on boot — only inserted if the table is empty, so subsequent edits
 * in admin survive restarts.
 *
 * Each tool has:
 *   - slug          URL-safe identifier for the /trade-zone/<slug> page
 *   - launchUrl     OPTIONAL override for the card's Launch button. If
 *                   empty, the button points to the internal detail page
 *                   /trade-zone/<slug>. If set (https://... or /path),
 *                   the card button goes there instead.
 *   - detailContent Markdown rendered on the detail page.
 *
 * icon_key must match a key in the ICONS map on the frontend
 * (frontend/src/lib/tradeZoneIcons.ts). If you add a new tool with an
 * icon_key that doesn't exist there, the frontend falls back to the
 * "activity" icon and the card still renders cleanly.
 */
export const DEFAULT_TRADE_ZONE_TOOLS = [
  {
    name: 'Live Dashboard',
    slug: 'live-dashboard',
    description:
      'Real-time P&L, drawdown, and rule monitoring for your funded accounts.',
    iconKey: 'activity',
    launchUrl: '',
    launchLabel: 'Open Dashboard',
    order: 1,
    enabled: true,
    detailContent: `## What it is

The Live Dashboard is your real-time command centre for every account you operate under Duncan capital. Track open positions, daily P&L, drawdown headroom, and rule status — all in one place, refreshed continuously.

## What you can do here

- Monitor open trades and equity curve in real time
- See your distance to the **daily loss limit** at a glance
- Track **max drawdown** consumption across the life of the account
- Review **closed trade history** with filtering and tagging
- Receive **rule-violation alerts** before they breach

## Who it's for

Every Duncan trader — from evaluation candidates checking their first profit target, to scaled traders managing six-figure capital allocations.

## Coming soon

A mobile companion app for push notifications when key thresholds are approached. Watch this space.`,
  },
  {
    name: 'Economic Calendar',
    slug: 'economic-calendar',
    description:
      'Stay ahead of high-impact news that moves the markets you trade.',
    iconKey: 'calendar',
    launchUrl: '',
    launchLabel: 'Open Calendar',
    order: 2,
    enabled: true,
    detailContent: `## What it is

A focused, trader-grade economic calendar showing the events that actually move price — central bank decisions, payrolls, CPI, GDP, PMIs, and major geopolitical scheduled releases.

## What you can do here

- Filter by **currency**, **impact level**, and **event type**
- See historical, forecast, and actual values side-by-side
- Cross-reference each release with **News Event policy windows**
  (positions held 3 minutes before or after a release are prohibited
  under Duncan rules)
- Subscribe to **email or in-app alerts** for the events you trade

## Why it matters at Duncan

Trading inside the News Event window is a fast path to having positions
closed and P&L removed. Use this calendar to plan around releases, not
into them.`,
  },
  {
    name: 'Position Sizer',
    slug: 'position-sizer',
    description:
      'Calculate precise lot sizes based on your daily and overall loss limits.',
    iconKey: 'calculator',
    launchUrl: '',
    launchLabel: 'Open Sizer',
    order: 3,
    enabled: true,
    detailContent: `## What it is

A disciplined position-sizing calculator built around Duncan's rule
framework. Enter your account size, instrument, stop distance, and the
percentage of daily loss limit you're willing to risk — get back a lot
size you can trade with confidence.

## What you can do here

- Calculate lot size by **fixed risk percentage**
- Account for **instrument pip value** (Forex, indices, metals, crypto)
- Stress-test against your remaining **daily loss headroom**
- Save **risk presets** per asset class for one-click sizing

## Why it matters

The single most common reason traders fail evaluation is oversized
positions taken on conviction trades. The Position Sizer removes the
math so you size correctly under pressure.`,
  },
  {
    name: 'Trade Journal',
    slug: 'trade-journal',
    description:
      'Log, tag, and review every setup. The clan rewards reflection.',
    iconKey: 'book',
    launchUrl: '',
    launchLabel: 'Open Journal',
    order: 4,
    enabled: true,
    detailContent: `## What it is

A structured trade journal designed around the Duncan ethos — *discere
pati*, learn to endure. Every trade you take is logged with the context
you need to learn from it: setup, entry rationale, exit reason, and
post-trade reflection.

## What you can do here

- Log trades with **screenshots, tags, and notes**
- Group trades by **strategy** to measure what's actually working
- Review **win-rate, expectancy, and risk/reward** by tag
- Export your journal for tax records or external review

## The discipline angle

Consistency comes from review, not effort. Traders who journal weekly
catch the patterns — both setup and behavioural — that traders running
on instinct miss. Plan to spend 15 minutes a week with this.`,
  },
  {
    name: 'Strategy Library',
    slug: 'strategy-library',
    description:
      'Curated playbooks from funded Duncan traders, refreshed regularly.',
    iconKey: 'library',
    launchUrl: '',
    launchLabel: 'Browse Library',
    order: 5,
    enabled: true,
    detailContent: `## What it is

A growing library of strategy write-ups contributed by funded Duncan
traders and reviewed by the team. Not signals — *playbooks*. Setups,
rules of engagement, when they work, and when they fail.

## What you'll find

- **Session-based** setups for Forex and equities
- **Volatility-contraction** patterns for futures
- **Range-break** and **mean-reversion** plays for crypto
- **Risk management frameworks** ranked by drawdown profile

## How to use it

Pick one strategy. Paper-test it for two weeks. Journal every entry.
Take it live only if your journal confirms the edge survives contact
with your psychology. Strategies in this library are starting points,
not finished products.`,
  },
  {
    name: 'Risk Console',
    slug: 'risk-console',
    description:
      'Pre-trade checks, max-exposure alerts, and kill-switch style protections.',
    iconKey: 'shield',
    launchUrl: '',
    launchLabel: 'Open Console',
    order: 6,
    enabled: true,
    detailContent: `## What it is

A pre-trade risk gate sitting between your platform and your impulses.
Set your daily and per-trade risk limits up front — the Risk Console
enforces them when emotion would otherwise override the plan.

## What you can do here

- Configure **max risk per trade** as % of account or fixed currency
- Set a **daily loss kill-switch** that disables trading when hit
- Cap **concurrent open positions** by instrument or correlation cluster
- Receive **pre-trade warnings** when you size beyond your own rules

## Why this exists

Funded trading fails on tail events — the one outsize loss that wipes
out a month of careful trading. The Risk Console is the seatbelt: you
hope you never need it, you're glad when you do.`,
  },
];
