import type { Metadata } from 'next';
import './globals.css';
import { JsonLd, organizationSchema, websiteSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/api';
import Analytics, { AnalyticsNoscript } from '@/components/Analytics';
import ChatWidget from '@/components/ChatWidget';
import NewsletterPopup from '@/components/NewsletterPopup';
import ExitIntentPopup from '@/components/ExitIntentPopup';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Duncan Funded — Trade with Honour, Profit with Legacy',
    template: '%s | Duncan Funded',
  },
  description:
    'Duncan Funded is a premium proprietary trading firm powered by FPFX technology. Prove your skill, earn your funding, and keep up to 90% of your profits.',
  keywords: [
    'prop trading firm',
    'funded trading account',
    'forex prop firm',
    'trading challenge',
    'FPFX',
    'funded trader',
    'proprietary trading',
  ],
  authors: [{ name: 'Duncan Funded' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Duncan Funded',
    title: 'Duncan Funded — Trade with Honour, Profit with Legacy',
    description:
      'A premium proprietary trading firm powered by FPFX technology. Prove your skill, earn your funding.',
    url: SITE_URL,
    images: [{ url: '/assets/hero-bg.jpg', width: 1920, height: 1080, alt: 'Duncan Funded' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duncan Funded — Trade with Honour, Profit with Legacy',
    description:
      'A premium proprietary trading firm powered by FPFX technology. Prove your skill, earn your funding.',
    images: ['/assets/hero-bg.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  // icons handled by app/icon.png (and apple-icon.png) file conventions
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Fonts load at runtime via Google Fonts (the visitor's browser fetches
          them). next/font is intentionally avoided because it fetches fonts at
          build time, which fails in restricted-network build environments.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700;800&family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-pine">
        <AnalyticsNoscript />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {children}
        <ChatWidget />
        <NewsletterPopup />
        <ExitIntentPopup />
        <Analytics />
      </body>
    </html>
  );
}
