/**
 * Default Trader Arsenal tools. Used by tradeZoneService.seedIfEmpty()
 * on boot — only inserted if the table is empty, so subsequent edits
 * in admin survive restarts.
 *
 * icon_key must match a key in the ICONS map on the frontend
 * (frontend/src/lib/tradeZoneIcons.ts). If you add a new tool with an
 * icon_key that doesn't exist there, the frontend falls back to the
 * "activity" icon and the card still renders cleanly.
 *
 * launch_url can be:
 *   - empty string -> no Launch button rendered
 *   - internal path "/something" -> Next.js Link (same tab)
 *   - external URL "https://..." -> opens in a new tab
 */
export const DEFAULT_TRADE_ZONE_TOOLS = [
  {
    name: 'Live Dashboard',
    description:
      'Real-time P&L, drawdown, and rule monitoring for your funded accounts.',
    iconKey: 'activity',
    launchUrl: '',
    launchLabel: 'Launch',
    order: 1,
    enabled: true,
  },
  {
    name: 'Economic Calendar',
    description:
      'Stay ahead of high-impact news that moves the markets you trade.',
    iconKey: 'calendar',
    launchUrl: '',
    launchLabel: 'Open',
    order: 2,
    enabled: true,
  },
  {
    name: 'Position Sizer',
    description:
      'Calculate precise lot sizes based on your daily and overall loss limits.',
    iconKey: 'calculator',
    launchUrl: '',
    launchLabel: 'Calculate',
    order: 3,
    enabled: true,
  },
  {
    name: 'Trade Journal',
    description:
      'Log, tag, and review every setup. The clan rewards reflection.',
    iconKey: 'book',
    launchUrl: '',
    launchLabel: 'Open Journal',
    order: 4,
    enabled: true,
  },
  {
    name: 'Strategy Library',
    description:
      'Curated playbooks from funded Duncan traders, refreshed regularly.',
    iconKey: 'library',
    launchUrl: '',
    launchLabel: 'Browse',
    order: 5,
    enabled: true,
  },
  {
    name: 'Risk Console',
    description:
      'Pre-trade checks, max-exposure alerts, and kill-switch style protections.',
    iconKey: 'shield',
    launchUrl: '',
    launchLabel: 'Launch',
    order: 6,
    enabled: true,
  },
];
