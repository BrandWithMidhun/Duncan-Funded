/**
 * Default Trader Arsenal tools. Used by tradeZoneService.seedIfEmpty()
 * on boot — only inserted if the table is empty.
 *
 * Behaviour:
 *   - Every tool's LAUNCH button on the public Trader Arsenal page
 *     goes to /programs by default.
 *   - Admin can override per tool in /admin/trade-zone by setting
 *     a Launch URL (any internal path /... or external URL https://...).
 *
 *   - `slug` is kept on each tool but is no longer used for client
 *     navigation. We retain the column for admin convenience (it
 *     surfaces in the admin list and could be used later for SEO
 *     metadata or analytics tagging).
 *
 *   - `detailContent` is left empty. The per-tool detail page was
 *     removed; if the user later wants to bring it back, the field
 *     is still in the DB schema waiting to be re-wired.
 */
export const DEFAULT_TRADE_ZONE_TOOLS = [
  {
    name: 'Live Dashboard',
    slug: 'live-dashboard',
    description:
      'Real-time P&L, drawdown, and rule monitoring for your funded accounts.',
    iconKey: 'activity',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 1,
    enabled: true,
  },
  {
    name: 'Economic Calendar',
    slug: 'economic-calendar',
    description:
      'Stay ahead of high-impact news that moves the markets you trade.',
    iconKey: 'calendar',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 2,
    enabled: true,
  },
  {
    name: 'Position Sizer',
    slug: 'position-sizer',
    description:
      'Calculate precise lot sizes based on your daily and overall loss limits.',
    iconKey: 'calculator',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 3,
    enabled: true,
  },
  {
    name: 'Trade Journal',
    slug: 'trade-journal',
    description:
      'Log, tag, and review every setup. The clan rewards reflection.',
    iconKey: 'book',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 4,
    enabled: true,
  },
  {
    name: 'Strategy Library',
    slug: 'strategy-library',
    description:
      'Curated playbooks from funded Duncan traders, refreshed regularly.',
    iconKey: 'library',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 5,
    enabled: true,
  },
  {
    name: 'Risk Console',
    slug: 'risk-console',
    description:
      'Pre-trade checks, max-exposure alerts, and kill-switch style protections.',
    iconKey: 'shield',
    launchUrl: '',
    launchLabel: 'Launch',
    detailContent: '',
    order: 6,
    enabled: true,
  },
];
