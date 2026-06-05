'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  Search,
  Users,
  MessageSquare,
  Settings,
  FileEdit,
  Package,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { fetchMe, logout, getToken, type AdminUser } from '@/lib/adminApi';

const adminNav = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
  { label: 'Content', href: '/admin/content', Icon: FileEdit },
  { label: 'Programs', href: '/admin/programs', Icon: Package },
  { label: 'Posts', href: '/admin/posts', Icon: FileText },
  { label: 'FAQ', href: '/admin/faq', Icon: HelpCircle },
  { label: 'SEO', href: '/admin/seo', Icon: Search },
  { label: 'Subscribers', href: '/admin/subscribers', Icon: Users },
  { label: 'Messages', href: '/admin/messages', Icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', Icon: Settings },
];

/**
 * Wraps every authenticated admin page. Verifies the session on mount,
 * redirects to /admin/login if missing/expired, and renders the admin
 * chrome (left sidebar + top bar) around the page content.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-pine flex items-center justify-center">
        <p className="font-accent italic text-wool-muted text-lg">Loading admin…</p>
      </div>
    );
  }

  const NavList = ({ collapsed = false }: { collapsed?: boolean }) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {adminNav.map((item) => {
        const isActive =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-body text-sm tracking-wide transition-all ${
              isActive
                ? 'bg-gold/10 text-gold border-l-2 border-gold pl-[10px]'
                : 'text-wool-muted hover:text-gold hover:bg-gold/5'
            }`}
          >
            <item.Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-pine flex">
      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-highland/95 backdrop-blur-md border-r border-gold/15 flex flex-col z-50 transform transition-transform lg:transform-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gold/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-gold to-gold-light flex items-center justify-center font-display text-pine font-bold text-sm">
              D
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm tracking-[0.2em] gold-text-gradient">
                DUNCAN
              </span>
              <span className="font-display text-[10px] tracking-[0.3em] text-wool-muted mt-0.5">
                ADMIN
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-wool-muted hover:text-gold"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <NavList />

        {/* User + Logout pinned at bottom */}
        <div className="border-t border-gold/10 p-4 space-y-3">
          {user && (
            <div className="px-2 py-1">
              <p className="font-body text-xs text-wool-muted/60 uppercase tracking-wider">
                Signed in as
              </p>
              <p className="font-body text-sm text-wool truncate" title={user.email}>
                {user.name || user.email}
              </p>
            </div>
          )}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-sm font-body text-xs tracking-wider text-wool-muted hover:text-gold hover:bg-gold/5 uppercase"
          >
            View Site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-sm font-body text-xs tracking-wider text-wool-muted hover:text-heritage hover:bg-heritage/10 uppercase transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-highland/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gold p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-sm tracking-[0.2em] gold-text-gradient">
            DUNCAN ADMIN
          </span>
          <span className="w-7" /> {/* spacer */}
        </div>

        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
