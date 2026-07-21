import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import NotificationsBell from './NotificationsBell'
import ThemeSwitcher from './ThemeSwitcher'
import './layout.css'

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

/** Walk the nav tree to find a label for the current path (topbar title). */
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

  // Focus the search bar when "/" is pressed (command-palette style).
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

  // Close the drawer + clear search on every navigation.
  useEffect(() => {
    // Intentional: reset transient UI state when the route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
    setQuery('')
  }, [location.pathname])

  // Lock body scroll while the drawer is open.
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
    <div className="layout">
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden />}

      <aside className="sidebar" data-open={open}>
        <div className="brand">
          <span className="brand-mark">🪔</span>
          <div>
            <div className="brand-name">Hindustani Jyotish</div>
            <div className="brand-sub faint">Admin Console</div>
          </div>
        </div>

        <div className="topbar-search topbar-search-mobile" style={{ margin: '0 8px 12px', maxWidth: 'none' }}>
          <Icon><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages…" />
        </div>

        <nav>
          {groups.length === 0 && <div className="empty" style={{ padding: 24 }}>No pages match “{query}”.</div>}
          {groups.map((group) => (
            <div className="nav-group" key={group.heading}>
              <div className="nav-heading">{group.heading}</div>
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span aria-hidden>{ICONS[n.icon]}</span>
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="sidebar-avatar" aria-hidden>{initials}</span>
          <div className="sidebar-user">
            <div className="email">{admin?.email}</div>
            <div className="role faint">Administrator</div>
          </div>
          <button className="btn-ghost btn-icon" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <button className="btn-ghost btn-icon menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon><path d="M3 6h18M3 12h18M3 18h18" /></Icon>
          </button>

          <div className="topbar-search">
            <Icon><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title}…`} />
            <kbd>/</kbd>
          </div>

          <div className="topbar-actions">
            <ThemeSwitcher />
            <NotificationsBell />
          </div>
        </div>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
