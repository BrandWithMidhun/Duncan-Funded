'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { fetchMe, logout, getToken, type AdminUser } from '@/lib/adminApi';

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Posts', href: '/admin/posts' },
  { label: 'FAQ', href: '/admin/faq' },
  { label: 'SEO', href: '/admin/seo' },
  { label: 'Subscribers', href: '/admin/subscribers' },
  { label: 'Messages', href: '/admin/messages' },
  { label: 'Settings', href: '/admin/settings' },
];

/**
 * Wraps every authenticated admin page. Verifies the session on mount,
 * redirects to /admin/login if missing/expired, and renders the admin
 * chrome (header + nav) around the page content.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        router.replace('/admin/login');
        return;
      }
      const me = await fetchMe();
      if (!active) return;
      if (!me) {
        logout();
        router.replace('/admin/login');
        return;
      }
      setUser(me);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-accent text-lg text-wool-muted italic">Verifying session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gold/15 bg-pine/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="font-display text-lg gold-text-gradient font-bold tracking-wider">
            DUNCAN ADMIN
          </Link>
          <div className="flex items-center gap-5">
            <span className="font-body text-xs text-wool-muted hidden sm:inline">
              {user?.email}
            </span>
            <Link
              href="/"
              className="font-body text-xs tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="font-body text-xs tracking-wider text-gold border border-gold/40 px-4 py-1.5 rounded-sm hover:bg-gold/5 transition-all uppercase"
            >
              Log Out
            </button>
          </div>
        </div>
        {/* Nav */}
        <div className="container mx-auto px-6">
          <nav className="flex items-center gap-6 h-11">
            {adminNav.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-body text-xs tracking-wider uppercase transition-colors ${
                    active ? 'text-gold' : 'text-wool-muted hover:text-gold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
