import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import NotificationsBell from './NotificationsBell'
import ThemeSwitcher from './ThemeSwitcher'
import './layout.css'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  { heading: 'Overview', items: [{ to: '/', label: 'Dashboard', end: true }] },
  {
    heading: 'Users',
    items: [{ to: '/customers', label: 'Customer Details' }],
  },
  {
    heading: 'Astrologers',
    items: [
      { to: '/astrologers', label: 'Astrologer Details' },
      { to: '/charges', label: 'Astrologer Charges' },
      { to: '/top', label: 'Top Astrologers' },
      { to: '/approval', label: 'Astrologer Approval' },
      { to: '/approval-status', label: 'Approval Status' },
    ],
  },
  {
    heading: 'Wallet',
    items: [
      { to: '/wallet', label: 'Wallet Management' },
      { to: '/wallet-transactions', label: 'Wallet Transactions' },
      { to: '/wallet-ledger', label: 'Wallet Ledger' },
      { to: '/payouts', label: 'Withdraw Requests' },
      { to: '/refunds', label: 'Refund History' },
    ],
  },
  {
    heading: 'Sessions',
    items: [
      { to: '/sessions', label: 'Session Requests' },
      { to: '/chat-rooms', label: 'Chat Message Rooms' },
      { to: '/reviews', label: 'Reviews' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/coupons', label: 'Coupons' },
      { to: '/banners', label: 'Banners' },
      { to: '/cosmic-services', label: 'Cosmic Services' },
      { to: '/live-gifts', label: 'Live Gifts' },
      { to: '/promo-videos', label: 'Feature Videos' },
      { to: '/astrologer-videos', label: 'Astrologer Videos' },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { to: '/social-links', label: 'Social Links' },
      { to: '/agora', label: 'Agora Settings' },
      { to: '/razorpay', label: 'Razorpay Credentials' },
      { to: '/commission', label: 'Platform Commission' },
      { to: '/maintenance', label: 'Under Maintenance' },
      { to: '/firebase-config', label: 'Firebase Config' },
    ],
  },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">🪔</span>
          <div>
            <div className="brand-name">Hindustani Jyotish</div>
            <div className="brand-sub faint">Admin Console</div>
          </div>
        </div>
        <nav>
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.heading}>
              <div className="nav-heading">{group.heading}</div>
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="muted" style={{ fontSize: 13 }}>{admin?.email}</div>
          <button className="btn-ghost" onClick={handleLogout} style={{ marginTop: 10, width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <div className="topbar">
          <ThemeSwitcher />
          <NotificationsBell />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
