import { getContent } from '@/lib/api';
import { HowItWorksClient, WhyDuncanClient } from './SectionsClient';

const STEP_DEFAULTS = [
  { number: 'I', title: 'Choose Your Capital', description: 'Select your capital size and asset class to begin your journey.' },
  { number: 'II', title: 'Select Your Asset Class', description: 'Each asset class offers its own account types, sizes, and add-ons.' },
  { number: 'III', title: 'Prove Your Skill', description: 'Trade within defined parameters, meet profit targets, and demonstrate disciplined risk management.' },
  { number: 'IV', title: 'Receive Trading Capital', description: 'Successful traders access real trading capital with up to a 90% profit split and payout protection.' },
  { number: 'V', title: 'Scale & Earn', description: "Advance through Duncan's progressive scaling framework as you demonstrate consistency." },
];

const REASON_DEFAULTS = [
  { title: 'Institutional-Grade Trading Infrastructure', description: 'Built on proven, exchange-connected technology with stable execution, transparent pricing, and multi-asset support.' },
  { title: 'Performance-Based Profit Split', description: 'Earn up to 90% of profits with payout protection and scaling incentives.' },
  { title: 'Trade Without Deadlines', description: 'No artificial time limits. Focus on performance, not pressure.' },
  { title: 'Flexible Payouts', description: 'Withdraw profits on a bi-weekly schedule or under payout protection terms.' },
  { title: 'Progressive Scaling', description: 'Consistent traders qualify for increased capital allocation across supported asset classes.' },
  { title: 'Trader-Focused Assistance', description: 'Support designed around real trader needs — clear answers, fast resolutions, and a commitment to transparency.' },
];

const pick = (c: Record<string, string>, key: string, fallback: string) =>
  (c[key] && c[key].trim()) || fallback;

export async function HowItWorksSection() {
  const c = await getContent();
  const steps = STEP_DEFAULTS.map((d, i) => ({
    number: d.number,
    title: pick(c, `home.how.step${i + 1}_title`, d.title),
    description: pick(c, `home.how.step${i + 1}_desc`, d.description),
  }));
  return (
    <HowItWorksClient
      eyebrow={pick(c, 'home.how.eyebrow', 'The Duncan Pathway')}
      titleGold={pick(c, 'home.how.title.line1', 'How It')}
      titleWhite={pick(c, 'home.how.title.line2', 'Works')}
      steps={steps}
    />
  );
}

export async function WhyDuncanSection() {
  const c = await getContent();
  const reasons = REASON_DEFAULTS.map((d, i) => ({
    title: pick(c, `home.why.r${i + 1}_title`, d.title),
    description: pick(c, `home.why.r${i + 1}_desc`, d.description),
  }));
  return (
    <WhyDuncanClient
      eyebrow={pick(c, 'home.why.eyebrow', 'The Duncan Standard')}
      titleGold={pick(c, 'home.why.title.line1', 'Why')}
      titleWhite={pick(c, 'home.why.title.line2', 'Duncan Funded')}
      reasons={reasons}
    />
  );
}
