/**
 * Small visual bullet — a green-or-red trading-candle glyph used as a
 * decorative list marker throughout the site. Pure CSS via the
 * candle-green / candle-red classes defined in globals.css.
 */
interface TradingCandleProps {
  variant?: 'green' | 'red';
}

export default function TradingCandle({ variant = 'green' }: TradingCandleProps) {
  return (
    <span
      className={variant === 'green' ? 'candle-green' : 'candle-red'}
      aria-hidden="true"
    />
  );
}
