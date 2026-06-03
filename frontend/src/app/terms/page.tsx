import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Duncan Funded',
  description:
    'The Terms and Conditions governing your use of Duncan Funded services, evaluations, and funded accounts.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="TERMS & CONDITIONS"
      subtitle="The rules of engagement for traders evaluated and funded by Duncan Funded."
    >
      <p>
        These Terms and Conditions govern your access to and use of the Duncan Funded website,
        evaluations, funded accounts, and related services. By creating an account, purchasing an
        evaluation, or otherwise using our services, you confirm that you have read, understood,
        and agree to be bound by these Terms.
      </p>
      <p>
        Duncan Funded provides educational and evaluation services for traders. Live trading
        accounts and assessment fees are provided and processed by Prop Account, LLC. You may be
        required to enter into a separate Trader Agreement with Prop Account, LC upon qualifying
        for a Live Account.
      </p>
      <p className="font-accent italic text-wool-muted/70">
        The full Terms and Conditions document will be published here shortly. For specific
        questions in the interim, please contact us at the address listed on the Contact page.
      </p>
    </LegalPageLayout>
  );
}
