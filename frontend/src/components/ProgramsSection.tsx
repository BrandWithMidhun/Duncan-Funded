import { getContent } from '@/lib/api';
import ProgramsSectionClient from './ProgramsSectionClient';

const pick = (c: Record<string, string>, key: string, fallback: string) =>
  (c[key] && c[key].trim()) || fallback;

export default async function ProgramsSection() {
  const c = await getContent();
  return (
    <ProgramsSectionClient
      eyebrow={pick(c, 'home.programs.eyebrow', 'Asset Class Overview')}
      titleGold={pick(c, 'home.programs.title.line1', 'Choose Your')}
      titleWhite={pick(c, 'home.programs.title.line2', 'Trading Domain')}
      paragraph={pick(
        c,
        'home.programs.paragraph',
        'Duncan Funded provides capital access across four major asset classes. Each class offers unique account types, evaluation paths, and add-ons designed for disciplined traders.',
      )}
      classes={[
        { name: 'Forex', iconKey: 'forex', description: pick(c, 'home.programs.forex_desc', 'Trade global currencies with flexible evaluation models and capital scaling opportunities.') },
        { name: 'Futures', iconKey: 'futures', description: pick(c, 'home.programs.futures_desc', 'Access exchange-connected futures markets across CME, CBOT, NYMEX, and COMEX.') },
        { name: 'Crypto', iconKey: 'crypto', description: pick(c, 'home.programs.crypto_desc', 'Trade digital assets with instant funding options and payout protection.') },
        { name: 'Equities', iconKey: 'equities', description: pick(c, 'home.programs.equities_desc', 'Trade S&P 100 equities in a structured, session-based environment on GooeyPro.') },
      ]}
    />
  );
}
