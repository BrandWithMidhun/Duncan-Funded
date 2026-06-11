'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  BarChart3,
  Bitcoin,
  Building2,
  ShieldCheck,
  Unlock,
  Moon,
  Sliders,
  type LucideIcon,
} from 'lucide-react';
import TradingCandle from './TradingCandle';

/**
 * Marketing overview rendered above the live programs configurator on
 * /programs. Four sub-sections: asset class cards, add-ons, evaluation
 * + scaling, supported platforms.
 *
 * The data here is intentionally static for now — it's marketing copy,
 * not pricing. Live pricing/rules stay in the configurator below,
 * which IS admin-editable via /admin/programs. If we ever want this
 * block admin-editable too, the right shape is a small JSON document
 * on the content_blocks table (one row per asset class).
 */

type AssetCard = {
  name: string;
  Icon: LucideIcon;
  sizes: string[];
  types: string[];
  addons: string[];
  platforms: string[];
  narrative: string;
};

const assets: AssetCard[] = [
  {
    name: 'Forex',
    Icon: LineChart,
    sizes: ['$10K', '$25K', '$50K', '$100K', '$400K'],
    types: ['One Step', 'Two Step', 'Instant Funding', 'Instant Lite'],
    addons: [
      'Profit Split Upgrade',
      'Remove Lock on Payout',
      'Weekend Hold',
      'Payout Protector',
    ],
    platforms: ['cTrader', 'DXTrade', 'MTR'],
    narrative:
      'Trade global currencies with precision. Choose your evaluation path and enhance your capital performance with powerful add-ons designed for disciplined traders.',
  },
  {
    name: 'Futures',
    Icon: BarChart3,
    sizes: ['$25K', '$50K', '$100K', '$200K'],
    types: ['Funded Futures Plan (4-Phase Performance Pathway)'],
    addons: ['Payout Protector'],
    platforms: ['DXFutures', 'Volumetrica'],
    narrative:
      'A performance-based futures program built on progression and discipline. Access CME, CBOT, NYMEX, and COMEX products across indices, energies, metals, currencies, and agricultural markets.',
  },
  {
    name: 'Crypto',
    Icon: Bitcoin,
    sizes: ['$10K', '$25K', '$50K', '$100K'],
    types: ['Instant Funding', 'Instant Lite'],
    addons: ['Payout Protector'],
    platforms: ['DXTrade', 'GooeyPro'],
    narrative:
      'Trade digital assets with real capital exposure. Instant funding options paired with risk-aligned protection.',
  },
  {
    name: 'Equities',
    Icon: Building2,
    sizes: ['Up to $200K'],
    types: ['Single Session Equities (One Step Assessment)'],
    addons: [
      'Profit Split Upgrade',
      'Remove Lock on Payout',
      'Relaxed Consistency (33% / 50%)',
      'Payout Protector',
    ],
    platforms: ['GooeyPro'],
    narrative:
      'Trade S&P 100 equities on GooeyPro from 09:30–15:55 ET. A disciplined, session-based model designed for precision and payout optimization.',
  },
];

const addonItems: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Sliders,
    title: 'Profit Split Upgrade',
    desc: 'Increase your payout percentage for greater capital efficiency.',
  },
  {
    Icon: Unlock,
    title: 'Remove Lock on Payout',
    desc: 'Withdraw profits without waiting for consistency thresholds.',
  },
  {
    Icon: Moon,
    title: 'Weekend Hold',
    desc: 'Keep Forex positions open through market close.',
  },
  {
    Icon: Sliders,
    title: 'Relaxed Consistency (Equities)',
    desc: 'Lower your consistency requirement to 33% or 50%.',
  },
  {
    Icon: ShieldCheck,
    title: 'Payout Protector',
    desc: 'Protect payout eligibility during evaluation and funded phases.',
  },
];

const platforms = ['cTrader', 'DXTrade', 'GooeyPro', 'MTR', 'DXFutures', 'Volumetrica'];

function SectionHeader({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
}) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="w-12 h-px bg-gold/40" />
        <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
          {eyebrow}
        </span>
        <div className="w-12 h-px bg-gold/40" />
      </div>
      <h2 className="font-display text-3xl md:text-4xl tracking-wider">
        <span className="gold-text-gradient">{title}</span>
        {accent ? (
          <>
            {' '}
            <span className="text-foreground">{accent}</span>
          </>
        ) : null}
      </h2>
    </div>
  );
}

export default function CapitalFundingOverview() {
  return (
    <>
      {/* Asset Class Cards */}
      <section className="relative py-20">
        <div className="absolute inset-0 tartan-texture opacity-[0.06]" />
        <div className="container mx-auto px-6 relative z-10">
          <SectionHeader
            eyebrow="Asset Class Overview"
            title="Choose Your"
            accent="Trading Domain"
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {assets.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border border-gold/15 bg-highland/40 backdrop-blur-sm rounded-sm p-7 hover:border-gold/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <a.Icon className="w-7 h-7 text-gold" strokeWidth={1.25} />
                  <h3 className="font-display text-2xl tracking-wider gold-text-gradient uppercase">
                    {a.name}
                  </h3>
                </div>
                <p className="font-body text-sm text-wool-muted leading-relaxed mb-5">
                  {a.narrative}
                </p>

                <div className="space-y-4 border-t border-gold/15 pt-5">
                  <div>
                    <div className="font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
                      Account Sizes
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.sizes.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 font-display text-xs rounded-sm border border-gold/25 text-wool/85"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
                      Account Types
                    </div>
                    <ul className="space-y-1.5">
                      {a.types.map((t) => (
                        <li
                          key={t}
                          className="flex items-start gap-2 font-body text-sm text-wool/85"
                        >
                          <TradingCandle variant="green" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
                      Add-Ons
                    </div>
                    <ul className="space-y-1.5">
                      {a.addons.map((t) => (
                        <li
                          key={t}
                          className="flex items-start gap-2 font-body text-sm text-wool/85"
                        >
                          <TradingCandle variant="green" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-display text-xs tracking-[0.2em] uppercase text-gold/80 mb-2">
                      Platforms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-3 py-1 font-display text-[11px] tracking-[0.18em] uppercase rounded-sm border border-gold/25 text-wool/85"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons grid */}
      <section className="relative py-20 bg-navy/30">
        <div className="absolute inset-0 tartan-texture opacity-5" />
        <div className="container mx-auto px-6 relative z-10">
          <SectionHeader
            eyebrow="Enhancements"
            title="Enhance Your"
            accent="Capital Journey"
          />
          <p className="font-body text-wool-muted text-center max-w-2xl mx-auto -mt-6 mb-12 text-sm tracking-wide">
            Add-ons allow traders to customize their evaluation and funded experience.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {addonItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="border border-gold/15 bg-highland/40 rounded-sm p-6 hover:border-gold/40 transition-all"
              >
                <item.Icon className="w-6 h-6 text-gold mb-3" strokeWidth={1.25} />
                <h3 className="font-display text-sm tracking-wider text-gold mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-wool-muted leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Evaluation + Scaling explanation */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="border border-gold/15 bg-highland/40 rounded-sm p-7">
              <h3 className="font-display text-lg tracking-wider gold-text-gradient uppercase mb-3">
                How Does the Evaluation Work?
              </h3>
              <p className="font-body text-sm text-wool-muted leading-relaxed">
                Each asset class offers its own evaluation path — One Step, Two Step, Instant
                Funding, Instant Lite, or the multi-phase Funded Futures Plan. Traders must
                meet profit targets, respect daily and total loss limits, and demonstrate
                disciplined risk management. Successful traders receive real trading capital
                with up to a 90% profit split.
              </p>
            </div>
            <div className="border border-gold/15 bg-highland/40 rounded-sm p-7">
              <h3 className="font-display text-lg tracking-wider gold-text-gradient uppercase mb-3">
                Is There a Scaling Plan?
              </h3>
              <p className="font-body text-sm text-wool-muted leading-relaxed">
                Yes. Duncan Funded offers a progressive scaling framework that increases your
                capital allocation as you demonstrate consistency and disciplined performance.
                Scaling thresholds and capital increases vary by asset class and account type.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="relative py-20 bg-navy/30">
        <div className="absolute inset-0 tartan-texture opacity-5" />
        <div className="container mx-auto px-6 relative z-10">
          <SectionHeader
            eyebrow="Supported Platforms"
            title="Professional"
            accent="Trading Suite"
          />
          <p className="font-body text-wool-muted text-center max-w-2xl mx-auto -mt-6 mb-10 text-sm tracking-wide">
            Duncan Funded supports a curated suite of professional trading platforms across
            all asset classes.
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {platforms.map((p) => (
              <span
                key={p}
                className="px-5 py-2.5 font-display text-xs tracking-[0.22em] uppercase rounded-sm border border-gold/30 text-wool/90 bg-highland/40"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="font-body text-xs text-wool-muted/70 text-center mt-6 italic">
            Platform availability varies by asset class and account type.
          </p>
        </div>
      </section>
    </>
  );
}
