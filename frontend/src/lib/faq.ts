/** FAQ content — shared by the FAQSection client component and JSON-LD schema. */
export interface FaqItem {
  q: string;
  a: string;
}

export const faqData: FaqItem[] = [
  {
    q: 'What is Duncan Funded?',
    a: 'Duncan Funded is a proprietary trading firm that provides talented traders with funded accounts. We partner with FPFX to offer institutional-grade infrastructure, real liquidity, and competitive trading conditions.',
  },
  {
    q: 'How does the evaluation work?',
    a: 'Our evaluation consists of one or two phases depending on your chosen program. You must hit the profit target while staying within daily and total drawdown limits. There are no time limits — trade at your pace.',
  },
  {
    q: 'What instruments can I trade?',
    a: 'You can trade Forex pairs, indices, commodities, and metals. All instruments are available through our FPFX-powered platform with tight spreads and fast execution.',
  },
  {
    q: 'How do payouts work?',
    a: 'Once funded, you can request payouts every two weeks. We offer up to 90% profit split, with higher splits available through our scaling plan for consistent performers.',
  },
  {
    q: 'Is there a scaling plan?',
    a: 'Yes. Consistent traders can scale their accounts up to $2M in funded capital with improved profit splits. Scaling is based on consecutive profitable periods.',
  },
  {
    q: 'What platforms are supported?',
    a: 'We support MetaTrader 4, MetaTrader 5, and cTrader through our FPFX integration. Choose the platform that suits your trading style.',
  },
];
