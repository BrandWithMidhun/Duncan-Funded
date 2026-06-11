'use client';

import { motion } from 'framer-motion';

/**
 * Animated ticker strip showing FX pairs scrolling across the top of
 * the viewport. INTENTIONALLY NOT MOUNTED in the layout — see notes.
 *
 * Why this exists but isn't on by default:
 *
 *   The numbers below are HARDCODED sample values, not live market
 *   data. For a real prop firm, showing fake forex prices in a UI
 *   strip risks misleading visitors who might think they're trading
 *   off these numbers. If we want a real ticker we'd need a paid
 *   data feed (e.g. Finnhub, Polygon, FCS API) and a WebSocket
 *   layer to push updates. Until then, this component sits unused.
 *
 *   If you want to display this anyway as decorative/aesthetic
 *   content (some sites do this and label it as such), import this
 *   into a page and add a "Sample data — for illustration only"
 *   tooltip or label nearby.
 */

const tickers = [
  { pair: 'EUR/USD', price: '1.0847', change: '+0.32%', up: true },
  { pair: 'GBP/JPY', price: '191.245', change: '-0.18%', up: false },
  { pair: 'USD/CHF', price: '0.8812', change: '+0.14%', up: true },
  { pair: 'AUD/USD', price: '0.6523', change: '+0.45%', up: true },
  { pair: 'USD/CAD', price: '1.3621', change: '-0.09%', up: false },
  { pair: 'EUR/GBP', price: '0.8567', change: '+0.21%', up: true },
  { pair: 'NZD/USD', price: '0.6012', change: '-0.33%', up: false },
  { pair: 'XAU/USD', price: '2,341.50', change: '+1.12%', up: true },
];

export default function TickerBar() {
  const items = [...tickers, ...tickers];

  return (
    <div className="fixed top-20 left-0 right-0 z-40 overflow-hidden bg-pine/60 backdrop-blur-md border-b border-gold/10">
      <motion.div
        className="flex items-center gap-8 py-2 whitespace-nowrap"
        animate={{ x: [0, -50 * tickers.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 font-body text-[11px] tracking-wider"
          >
            <span className="text-gold/60">{t.pair}</span>
            <span className="text-foreground/70">{t.price}</span>
            <span
              className={
                t.up ? 'text-[hsl(150,60%,40%)]' : 'text-[hsl(3,52%,46%)]'
              }
            >
              {t.up ? '▲' : '▼'} {t.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
