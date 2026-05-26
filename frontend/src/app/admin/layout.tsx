import type { Metadata } from 'next';

// Admin pages must never be indexed by search engines.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-pine">{children}</div>;
}
