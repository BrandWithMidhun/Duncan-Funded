import { getContent } from '@/lib/api';
import HeroContent from './HeroContent';

/**
 * Server component — fetches admin-edited content and hands it to the
 * client component for animated rendering. Falls back to baked-in
 * defaults if any block is empty or the API is unreachable.
 */
const DEFAULTS = {
  titleGold: 'Capital Funding',
  titleWhite: 'for Disciplined Traders',
  tagline: 'discere pati — learn to endure.',
  paragraph:
    'A premium capital allocation firm built on discipline, transparency, and trader excellence.',
  ctaPrimaryLabel: 'Start Your Journey',
  ctaPrimaryHref: '/programs',
  ctaSecondaryLabel: 'Explore Capital Funding',
  ctaSecondaryHref: '/programs',
};

export default async function HeroSection() {
  const content = await getContent();
  const pick = (key: string, fallback: string) =>
    (content[key] && content[key].trim()) || fallback;

  return (
    <HeroContent
      titleGold={pick('home.hero.title.line1', DEFAULTS.titleGold)}
      titleWhite={pick('home.hero.title.line2', DEFAULTS.titleWhite)}
      tagline={pick('home.hero.tagline', DEFAULTS.tagline)}
      paragraph={pick('home.hero.paragraph', DEFAULTS.paragraph)}
      ctaPrimaryLabel={pick('home.hero.cta_primary_label', DEFAULTS.ctaPrimaryLabel)}
      ctaPrimaryHref={pick('home.hero.cta_primary_href', DEFAULTS.ctaPrimaryHref)}
      ctaSecondaryLabel={pick('home.hero.cta_secondary_label', DEFAULTS.ctaSecondaryLabel)}
      ctaSecondaryHref={pick('home.hero.cta_secondary_href', DEFAULTS.ctaSecondaryHref)}
      stats={[
        { value: pick('home.hero.stat1_value', '$400K'), label: pick('home.hero.stat1_label', 'Maximum Capital Allocation') },
        { value: pick('home.hero.stat2_value', '90%'), label: pick('home.hero.stat2_label', 'Profit Split') },
        { value: pick('home.hero.stat3_value', '4'), label: pick('home.hero.stat3_label', 'Asset Classes') },
        { value: pick('home.hero.stat4_value', 'Available'), label: pick('home.hero.stat4_label', 'Payout Protection') },
      ]}
    />
  );
}
