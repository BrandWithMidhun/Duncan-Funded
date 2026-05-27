/** FAQ content — shared by the FAQSection client component and JSON-LD schema. */
export interface FaqItem {
  q: string;
  a: string;
}

export const faqData: FaqItem[] = [
  {
    q: 'What is Duncan Funded?',
    a: 'Duncan Funded is a proprietary trading firm that provides talented traders with the opportunity to earn funded accounts. Our platform is built on institutional-grade trading technology, delivering real liquidity, reliable execution, and competitive trading conditions.',
  },
  {
    q: 'How does the evaluation work?',
    a: 'Evaluations use simulated 1-Step and 2-Step accounts. Passing requires hitting the profit target while staying within all defined daily and overall drawdown limits.',
  },
  {
    q: 'What instruments can I trade?',
    a: 'Trade Forex, Equities, Crypto, and Futures in a simulated environment with institutional-grade pricing and fast execution.',
  },
  {
    q: 'How do payouts work?',
    a: 'Funded traders may request payouts every 14 days. Profit splits scale up to 90% based on consistent performance.',
  },
  {
    q: 'Is there a scaling plan?',
    a: 'Consistent traders may qualify for account scaling based on performance and risk compliance. Scaling increases account size over time and follows the rules defined for each program.',
  },
  {
    q: 'What platforms are supported?',
    a: 'Our trading infrastructure supports MT4/5, TradeLocker, MatchTrader, DXtrade, cTrader, GooeyPro, DXT, and Rithmic. Choose the platform that fits your trading style.',
  },
];
