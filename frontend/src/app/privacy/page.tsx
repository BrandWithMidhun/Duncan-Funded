import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Duncan Funded',
  description:
    'How Duncan Funded collects, uses, and protects the personal information of website visitors and traders.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="PRIVACY POLICY"
      subtitle="How we collect, use, and protect your personal information."
    >
      <p>
        This Privacy Policy describes how Duncan Funded collects, uses, and protects information
        you provide when you visit our website or use our services. We respect your privacy and
        are committed to handling your information transparently.
      </p>
      <p>
        We collect information you provide directly to us (such as account details and contact
        information), information collected automatically as you browse (such as device and usage
        data), and information from third-party services where applicable (such as payment
        processors and identity verification partners).
      </p>
      <p>
        We use this information to provide and improve our services, to fulfill regulatory and
        contractual obligations, to communicate with you about your account, and — where you have
        opted in — to send you marketing communications. You can opt out of marketing emails at
        any time.
      </p>
      <p className="font-accent italic text-wool-muted/70">
        A full Privacy Policy, including details on data retention, your rights, and how to
        contact us about your personal data, will be published here shortly.
      </p>
    </LegalPageLayout>
  );
}
