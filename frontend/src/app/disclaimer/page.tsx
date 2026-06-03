import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Risk Disclaimer — Duncan Funded',
  description:
    'Important risk disclosures regarding trading, evaluations, and the relationship between Duncan Funded and Prop Account, LLC.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalPageLayout
      eyebrow="Important"
      title="RISK DISCLAIMER"
      subtitle="Trading involves significant risk. Please read carefully before participating."
    >
      <p>
        Duncan Funded is an affiliate of Prop Account, LLC. All live assessments are provided by
        Prop Account, LC, and all assessment fees are paid to Prop Account, LLC. If you qualify
        for a Live Account, you will be required to enter into a Trader Agreement with Prop
        Account LC. Neither Prop Account, LLC nor Prop Account LC provides any trading education
        or other services. All such services are provided by Duncan Funded.
      </p>
      <p>
        Trading financial instruments — including forex, equities, futures, and crypto-assets —
        involves a substantial risk of loss and is not suitable for every investor. The valuation
        of these instruments may fluctuate, and you may sustain losses in excess of your initial
        deposit. Past performance is not indicative of future results.
      </p>
      <p>
        The information presented on this website is for educational and informational purposes
        only. It does not constitute investment, financial, legal, or tax advice and should not be
        relied upon as such. You should seek independent professional advice tailored to your own
        circumstances before making any trading or investment decision.
      </p>
      <p>
        Evaluation accounts provided by Duncan Funded are demo accounts. They do not represent
        live capital and are intended solely to evaluate a trader's skill and risk management.
      </p>
    </LegalPageLayout>
  );
}
