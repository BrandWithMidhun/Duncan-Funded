import {
  Activity,
  CalendarDays,
  Calculator,
  BookOpen,
  Library,
  ShieldAlert,
  LineChart,
  TrendingUp,
  Target,
  Lock,
  Zap,
  Compass,
  Gauge,
  Bell,
  Bookmark,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

/**
 * Lookup table mapping a tool's `iconKey` string from the backend to
 * a real lucide-react component. Keep this in sync with VALID_ICON_KEYS
 * in backend/src/services/tradeZoneService.js.
 *
 * Unknown keys fall back to Activity in pickToolIcon below — the page
 * always renders a card, even if the admin saved a bogus icon name.
 */
export const TRADE_ZONE_ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  calendar: CalendarDays,
  calculator: Calculator,
  book: BookOpen,
  library: Library,
  shield: ShieldAlert,
  chart: LineChart,
  'trending-up': TrendingUp,
  target: Target,
  lock: Lock,
  zap: Zap,
  compass: Compass,
  gauge: Gauge,
  bell: Bell,
  bookmark: Bookmark,
  briefcase: Briefcase,
};

/** Ordered list of allowed icon keys, used by the admin form to render
 *  a dropdown. Keep this aligned with the keys in TRADE_ZONE_ICONS. */
export const TRADE_ZONE_ICON_KEYS = Object.keys(TRADE_ZONE_ICONS);

/** Resolve an icon component for a given key. Always returns something
 *  renderable — falls back to Activity for unknown keys. */
export function pickToolIcon(iconKey: string): LucideIcon {
  return TRADE_ZONE_ICONS[iconKey] || Activity;
}
