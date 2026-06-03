import TradingBackground from './TradingBackground';

/** Reusable hero header for interior pages. */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative pt-40 pb-16 overflow-hidden">
      <div className="absolute inset-0">
        <TradingBackground />
        <div className="absolute inset-0 tartan-texture opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>
      <div className="relative z-10 container mx-auto px-6 text-center">
        {children}
        {eyebrow && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              {eyebrow}
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
        )}
        <h1 className="font-display text-5xl md:text-7xl gold-text-gradient font-bold tracking-wider mb-6">
          {title}
        </h1>
        {subtitle && (
          <p className="font-accent text-xl md:text-2xl text-wool-muted italic max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
