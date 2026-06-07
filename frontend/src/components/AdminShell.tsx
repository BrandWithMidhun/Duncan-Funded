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
  MessagesSquare,
  ShieldCheck,
  Settings,
  FileEdit,
  Package,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Plus,
  List,
  ScrollText,
  KeyRound,
  Ban,
} from 'lucide-react';
import { fetchMe, logout, getToken, type AdminUser } from '@/lib/adminApi';

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
  { label: 'Content', href: '/admin/content', Icon: FileEdit },
  {
    label: 'Programs',
    href: '/admin/programs',
    Icon: Package,
    children: [
      { label: 'All Programs', href: '/admin/programs', Icon: List },
      { label: 'New Program', href: '/admin/programs/new', Icon: Plus },
    ],
  },
  {
    label: 'Posts',
    href: '/admin/posts',
    Icon: FileText,
    children: [
      { label: 'All Posts', href: '/admin/posts', Icon: List },
      { label: 'New Post', href: '/admin/posts/new', Icon: Plus },
    ],
  },
  { label: 'FAQ', href: '/admin/faq', Icon: HelpCircle },
  { label: 'SEO', href: '/admin/seo', Icon: Search },
  { label: 'Subscribers', href: '/admin/subscribers', Icon: Users },
  { label: 'Messages', href: '/admin/messages', Icon: MessageSquare },
  {
    label: 'Chats',
    href: '/admin/chats',
    Icon: MessagesSquare,
    children: [
      { label: 'Conversations', href: '/admin/chats', Icon: MessagesSquare },
      { label: 'Restrictions', href: '/admin/chat-restrictions', Icon: Ban },
    ],
  },
  {
    label: 'Audit',
    href: '/admin/audit',
    Icon: ShieldCheck,
    children: [
      { label: 'Actions', href: '/admin/audit', Icon: ScrollText },
      { label: 'Login Attempts', href: '/admin/audit?tab=logins', Icon: KeyRound },
    ],
  },
  { label: 'Settings', href: '/admin/settings', Icon: Settings },
];

type IconType = typeof LayoutDashboard;
interface NavChild {
  label: string;
  href: string;
  Icon: IconType;
}
interface NavItem {
  label: string;
  href: string;
  Icon: IconType;
  children?: NavChild[];
}

// localStorage key for remembering manual collapse state per parent.
// Children of an item we're currently navigating into auto-expand
// regardless; this is for everything else.
const COLLAPSE_KEY = 'df.admin.nav.collapsed';

function loadCollapsed(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCollapsed(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

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

  const NavList = ({ collapsed = false }: { collapsed?: boolean }) => {
    const [manualCollapsed, setManualCollapsed] = useState<Record<string, boolean>>({});

    // Load saved state once on mount
    useEffect(() => {
      setManualCollapsed(loadCollapsed());
    }, []);

    const isOnChild = (item: NavItem) =>
      !!item.children?.some((c) => pathname.startsWith(c.href.split('?')[0]));

    const isParentActive = (item: NavItem) =>
      item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

    // A parent's sub-menu is open if:
    //   - the user manually toggled it open (manualCollapsed[href] === false)
    //   - OR we're currently on one of its children (auto-expand)
    // Manual collapse always wins over auto-expand IF the user explicitly
    // collapsed it during this session.
    const isExpanded = (item: NavItem) => {
      if (!item.children) return false;
      const manual = manualCollapsed[item.href];
      if (manual === false) return true; // explicit open
      if (manual === true) return false; // explicit close
      return isParentActive(item) || isOnChild(item); // default: auto by route
    };

    const toggleExpand = (href: string, currentlyOpen: boolean) => {
      const next = { ...manualCollapsed, [href]: currentlyOpen };
      setManualCollapsed(next);
      saveCollapsed(next);
    };

    return (
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {adminNav.map((item) => {
          const active = isParentActive(item);
          const hasChildren = !!item.children?.length;
          const expanded = hasChildren && isExpanded(item);

          return (
            <div key={item.href}>
              <div
                className={`group flex items-center rounded-sm font-body text-sm tracking-wide transition-all ${
                  active && !isOnChild(item)
                    ? 'bg-gold/10 text-gold border-l-2 border-gold'
                    : 'text-wool-muted hover:text-gold hover:bg-gold/5 border-l-2 border-transparent'
                }`}
              >
                <Link
                  href={item.href}
                  className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
                  onClick={() => {
                    // Clicking the parent label also opens its sub-menu
                    if (hasChildren && !expanded) toggleExpand(item.href, false);
                  }}
                >
                  <item.Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {hasChildren && !collapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpand(item.href, expanded);
                    }}
                    aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
                    aria-expanded={expanded}
                    className="px-2 py-2 text-wool-muted/60 hover:text-gold"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        expanded ? 'rotate-90' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                )}
              </div>

              {/* Sub-menu */}
              {hasChildren && expanded && !collapsed && (
                <div className="mt-0.5 mb-1.5 ml-4 pl-3 border-l border-gold/15 space-y-0.5">
                  {item.children!.map((child) => {
                    const childActive =
                      pathname === child.href.split('?')[0] ||
                      (child.href.includes('?') && pathname + '?' === child.href.split('?')[0] + '?');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-body text-xs tracking-wide transition-all ${
                          childActive
                            ? 'text-gold bg-gold/8'
                            : 'text-wool-muted/80 hover:text-gold hover:bg-gold/5'
                        }`}
                      >
                        <child.Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

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
