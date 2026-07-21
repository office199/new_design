import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import NotificationsBell from './NotificationsBell'
import ThemeSwitcher from './ThemeSwitcher'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: string
}

const ICONS: Record<string, ReactNode> = {
  dashboard: <Icon><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>,
  customers: <Icon><circle cx="9.5" cy="8" r="3.4" /><path d="M3.5 19.5c.7-3.6 3.2-5.4 6-5.4s5.3 1.8 6 5.4" /><path d="M16.2 4.9a3.4 3.4 0 0 1 0 6.2M18.4 14.5c1.5.8 2.5 2.2 2.9 4.4" /></Icon>,
  astrologers: <Icon><path d="M12 3.5 13.9 9.2 19.6 11.1 13.9 13 12 18.7 10.1 13 4.4 11.1 10.1 9.2Z" /><path d="M18.5 17l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" strokeWidth="1.4" /></Icon>,
  charges: <Icon><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></Icon>,
  star: <Icon><path d="M12 3.5 13.9 9.2 19.6 11.1 13.9 13 12 18.7 10.1 13 4.4 11.1 10.1 9.2Z" /></Icon>,
  approval: <Icon><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></Icon>,
  wallet: <Icon><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M16 14h2" /></Icon>,
  ledger: <Icon><path d="M4 4h13a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></Icon>,
  payout: <Icon><rect x="2.5" y="5" width="19" height="14" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9v6M18 9v6" /></Icon>,
  refund: <Icon><path d="M3 7v6h6" /><path d="M3.5 13a9 9 0 1 0 2.3-9.3L3 7" /></Icon>,
  sessions: <Icon><path d="M4.5 4.5h15A1.5 1.5 0 0 1 21 6v8.5a1.5 1.5 0 0 1-1.5 1.5H9.6L5 19.5V16H4.5A1.5 1.5 0 0 1 3 14.5V6a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M7.5 9h9M7.5 12h5.5" /></Icon>,
  chat: <Icon><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.5 8.5 0 1 1 21 11.5Z" /></Icon>,
  reviews: <Icon><path d="M12 3.5 13.9 9.2 19.6 11.1 13.9 13 12 18.7 10.1 13 4.4 11.1 10.1 9.2Z" /></Icon>,
  coupon: <Icon><path d="M4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.6a2.4 2.4 0 0 0 0 4.8v2.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2.6a2.4 2.4 0 0 0 0-4.8V7.5A1.5 1.5 0 0 1 4.5 6Z" /><path d="M13.5 8v1.7M13.5 11.7v1.7M13.5 15.4V17" strokeDasharray="0.1 2.6" /></Icon>,
  banner: <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5L5 21" /></Icon>,
  sparkle: <Icon><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Icon>,
  gift: <Icon><rect x="3.5" y="8" width="17" height="13" rx="1.5" /><path d="M3.5 12h17M12 8v13" /><path d="M12 8S10 3 7.5 4.5 9 8 12 8ZM12 8s2-5 4.5-3.5S15 8 12 8Z" /></Icon>,
  video: <Icon><rect x="2.5" y="6" width="13" height="12" rx="2" /><path d="m15.5 10 6-3v10l-6-3" /></Icon>,
  social: <Icon><circle cx="12" cy="12" r="9.5" /><path d="M3 12h17M12 2.5S8.5 6.5 8.5 12s3.5 9.5 3.5 9.5M12 2.5s3.5 4 3.5 9.5-3.5 9.5-3.5 9.5" /></Icon>,
  agora: <Icon><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>,
  razorpay: <Icon><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></Icon>,
  commission: <Icon><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>,
  maintenance: <Icon><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z" /></Icon>,
  firebase: <Icon><path d="m5 3 4.5 18 3-7 7.5-2L5 3Z" /><path d="m12.5 14 5-8" /></Icon>,
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  { heading: 'Overview', items: [{ to: '/', label: 'Dashboard', end: true, icon: 'dashboard' }] },
  { heading: 'Users', items: [{ to: '/customers', label: 'Customer Details', icon: 'customers' }] },
  {
    heading: 'Astrologers',
    items: [
      { to: '/astrologers', label: 'Astrologer Details', icon: 'astrologers' },
      { to: '/charges', label: 'Astrologer Charges', icon: 'charges' },
      { to: '/top', label: 'Top Astrologers', icon: 'star' },
      { to: '/approval', label: 'Astrologer Approval', icon: 'approval' },
      { to: '/approval-status', label: 'Approval Status', icon: 'ledger' },
    ],
  },
  {
    heading: 'Wallet',
    items: [
      { to: '/wallet', label: 'Wallet Management', icon: 'wallet' },
      { to: '/wallet-transactions', label: 'Wallet Transactions', icon: 'ledger' },
      { to: '/wallet-ledger', label: 'Wallet Ledger', icon: 'ledger' },
      { to: '/payouts', label: 'Withdraw Requests', icon: 'payout' },
      { to: '/refunds', label: 'Refund History', icon: 'refund' },
    ],
  },
  {
    heading: 'Sessions',
    items: [
      { to: '/sessions', label: 'Session Requests', icon: 'sessions' },
      { to: '/chat-rooms', label: 'Chat Message Rooms', icon: 'chat' },
      { to: '/reviews', label: 'Reviews', icon: 'reviews' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/coupons', label: 'Coupons', icon: 'coupon' },
      { to: '/banners', label: 'Banners', icon: 'banner' },
      { to: '/cosmic-services', label: 'Cosmic Services', icon: 'sparkle' },
      { to: '/live-gifts', label: 'Live Gifts', icon: 'gift' },
      { to: '/promo-videos', label: 'Feature Videos', icon: 'video' },
      { to: '/astrologer-videos', label: 'Astrologer Videos', icon: 'video' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { to: '/social-links', label: 'Social Links', icon: 'social' },
      { to: '/agora', label: 'Agora Settings', icon: 'agora' },
      { to: '/razorpay', label: 'Razorpay Credentials', icon: 'razorpay' },
      { to: '/commission', label: 'Platform Commission', icon: 'commission' },
      { to: '/maintenance', label: 'Under Maintenance', icon: 'maintenance' },
      { to: '/firebase-config', label: 'Firebase Config', icon: 'firebase' },
    ],
  },
]

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

function useActiveLabel(): string {
  const { pathname } = useLocation()
  for (const g of NAV_GROUPS) {
    for (const i of g.items) {
      if (i.end ? pathname === i.to : pathname.startsWith(i.to)) return i.label
    }
  }
  return 'Dashboard'
}

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/i.test((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setOpen(false)
    setQuery('')
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV_GROUPS
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0)
  }, [query])

  const initials =
    (admin?.name || admin?.email || 'A')
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || 'A'

  const title = useActiveLabel()

  return (
    <div className="grid grid-cols-[280px_1fr] min-h-screen">
      {/* Scrim overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-40 animate-fade-in md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-gradient-to-b from-bg-2 to-bg-1 border-r border-border-soft
          p-5 flex flex-col sticky top-0 h-screen z-40
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[300px]
          max-md:-translate-x-full transition-transform duration-[320ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]
          max-md:shadow-[0_24px_80px_rgba(2,2,12,0.6)]
          ${open ? 'max-md:translate-x-0' : ''}
        `}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-[radial-gradient(ellipse_at_50%_0%,var(--color-saffron-soft),transparent_70%)] opacity-50 pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3.5 px-2.5 pt-1.5 mb-7 relative z-10">
          <span className="text-[28px] w-12 h-12 flex items-center justify-center rounded-[--radius-md] bg-gradient-to-br from-saffron-soft to-transparent border border-border-soft shadow-[0_0_20px_var(--color-saffron-glow)] animate-[brand-glow_4s_ease-in-out_infinite]">
            🪔
          </span>
          <div>
            <div className="font-display text-[17px] font-semibold tracking-tight leading-tight">Hindustani Jyotish</div>
            <div className="text-[11px] tracking-widest uppercase mt-1 text-saffron font-medium max-md:hidden">Admin Console</div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="mb-3 mx-2 max-md:block hidden">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint">
              <Icon><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border-soft rounded-[--radius-sm] text-[14px]"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto -mx-2 px-2 pb-2 relative z-10">
          {groups.length === 0 && (
            <div className="text-center py-6 text-ivory-faint text-[14px]">No pages match "{query}".</div>
          )}
          {groups.map((group) => (
            <div key={group.heading} className="mb-1.5">
              <div className="text-[10px] tracking-widest uppercase text-ivory-faint px-3.5 pt-4 pb-1.5 font-bold">
                {group.heading}
              </div>
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `
                    flex items-center gap-3 text-ivory-dim
                    py-[11px] px-3.5 rounded-[--radius-sm]
                    font-semibold text-[13.5px]
                    transition-all duration-200
                    relative overflow-hidden
                    hover:bg-surface-1 hover:text-ivory hover:no-underline
                    ${isActive ? 'bg-gradient-to-r from-saffron-soft to-transparent text-ivory' : ''}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-gradient-to-b from-saffron-bright to-saffron rounded-full shadow-[0_0_12px_var(--color-saffron-glow)]" />
                      )}
                      <span aria-hidden>{ICONS[n.icon]}</span>
                      {n.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-soft pt-4 px-2.5 pb-1 flex items-center gap-3 mt-3 relative z-10">
          <span className="w-10 h-10 rounded-[--radius-md] flex items-center justify-center font-bold text-[15px] text-on-accent bg-gradient-to-br from-saffron-bright to-saffron shadow-[0_0_20px_var(--color-saffron-glow)] shrink-0" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{admin?.email}</div>
            <div className="text-[11px] text-saffron mt-0.5 font-medium">Administrator</div>
          </div>
          <button
            className="w-9 h-9 rounded-[--radius-sm] bg-surface-2 border border-border-soft flex items-center justify-center text-ivory hover:bg-surface-3 hover:border-border-mid transition-all shrink-0"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex flex-col" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.02))' }}>
        {/* Topbar */}
        <div className="sticky top-0 z-30 flex items-center gap-4 px-9 py-4 bg-bg-1/85 backdrop-blur-[20px] saturate-150 border-b border-border-soft max-lg:px-5 max-md:px-4">
          {/* Mobile menu button */}
          <button
            className="hidden max-lg:flex w-11 h-11 rounded-[--radius-md] bg-surface-2 border border-border-soft items-center justify-center text-ivory"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Icon><path d="M3 6h18M3 12h18M3 18h18" /></Icon>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-[500px] relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint transition-colors focus-within:text-saffron">
              <Icon><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
            </span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title}…`}
              className="w-full rounded-full py-3 px-4 pl-11 pr-16 bg-surface-1 border border-border-soft text-[14px] transition-all focus:outline-none focus:bg-surface-2 focus:border-saffron focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ivory-faint bg-surface-2 border border-border-soft rounded-[--radius-xs] px-2 py-1 transition-all focus-within:bg-saffron-soft focus-within:border-saffron focus-within:text-saffron-bright">
              /
            </kbd>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 ml-auto">
            <ThemeSwitcher />
            <NotificationsBell />
          </div>
        </div>

        {/* Page content */}
        <div className="px-9 py-8 pb-16 max-w-[1400px] w-full max-lg:px-5 max-md:px-4 max-md:py-5 max-md:pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
