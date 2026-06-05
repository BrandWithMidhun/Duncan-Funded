import Link from 'next/link';
import Image from 'next/image';
import NewsletterForm from './NewsletterForm';
import { getContent } from '@/lib/api';

const footerLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Risk Disclaimer', href: '/disclaimer' },
];

const DEFAULT_COPYRIGHT =
  '© 2026 Duncan Funded. Built on institutional-grade trading technology. All rights reserved.';
const DEFAULT_DISCLAIMER =
  'Disclaimer: Duncan Funded is an affiliate of Prop Account, LLC. All live assessments are provided by Prop Account, LC and all assessment fees are paid to Prop Account, LLC. If you qualify for a Live Account, you will be required to enter into a Trader Agreement with Prop Account LC. Neither Prop Account, LLC nor Prop Account LC provides any trading education or other services. All such services are provided by Duncan Funded. Duncan Funded is a trade name of Superb Choice LLC.';

export default async function Footer() {
  const c = await getContent();
  const pick = (key: string, fb: string) => (c[key] && c[key].trim()) || fb;

  const newsletterHeading = pick('footer.newsletter_heading', 'Join the Duncan Roll');
  const newsletterParagraph = pick(
    'footer.newsletter_paragraph',
    'Trading insight, evaluation tips, and clan updates — straight to your inbox.',
  );
  const copyright = pick('footer.copyright', DEFAULT_COPYRIGHT);
  const disclaimer = pick('footer.disclaimer', DEFAULT_DISCLAIMER);

  return (
    <footer className="py-16 border-t border-gold/10 relative bg-pine">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Image
              src="/assets/duncan-crest.png"
              alt="Duncan Funded"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mb-6 opacity-60"
            />
            <div className="font-display text-lg tracking-[0.2em] gold-text-gradient mb-2">
              DUNCAN FUNDED
            </div>
            <p className="font-accent text-sm text-wool-muted italic mb-6">
              Trade with Honour. Profit with Legacy.
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center md:justify-start">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-xs tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex justify-center md:justify-end">
            <NewsletterForm heading={newsletterHeading} paragraph={newsletterParagraph} />
          </div>
        </div>

        <div className="flex flex-col items-center text-center border-t border-gold/10 pt-8">
          <p className="font-body text-xs text-wool-muted/60 tracking-wide">{copyright}</p>
          <p className="font-body text-[10px] text-wool-muted/40 mt-3 max-w-2xl tracking-wide leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
