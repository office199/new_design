import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import NotificationsBell from './NotificationsBell'
import ThemeSwitcher from './ThemeSwitcher'

interface NavItem { to: string; label: string; end?: boolean; icon: ReactNode; badge?: number }
interface NavGroup { heading: string; items: NavItem[] }

function I({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

const ICON = {
  dash: <I><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></I>,
  users: <I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></I>,
  stars: <I><path d="M12 2l2.4 5.9L21 9.3l-5 4.8 1.2 6.9L12 17.8 6.8 21l1.2-6.9L3 9.3l6.6-1.4L12 2z"/></I>,
  charges: <I><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></I>,
  award: <I><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></I>,
  check: <I><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></I>,
  list: <I><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></I>,
  wallet: <I><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 0 0 0 4h4v-4h-4z"/></I>,
  book: <I><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></I>,
  payout: <I><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6"/><path d="M12 8v8"/></I>,
  refund: <I><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5A2.5 2.5 0 0 1 17 11.5v7.5"/><path d="M20 9v2"/><path d="M20 14v2"/><path d="M20 19v2"/></I>,
  video: <I><path d="M16 16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12z"/><path d="M18 9l4-2v10l-4-2"/></I>,
  chat: <I><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></I>,
  star: <I><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></I>,
  tag: <I><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6a2 2 0 0 0-2 2c0 1.1.9 2 2 2h12v-4H4z"/><path d="M20 12a2 2 0 0 1-2 2H6a2 2 0 0 0-2 2c0 1.1.9 2 2 2h12v-4"/></I>,
  image: <I><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></I>,
  sparkles: <I><path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3z"/><path d="M19 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/><path d="M5 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></I>,
  gift: <I><rect x="3" y="8" width="18" height="14" rx="1"/><path d="M12 8v14"/><path d="M19 8v-2a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v2"/><path d="M3 12h18"/></I>,
  clapper: <I><rect x="2" y="2" width="20" height="20" rx="2.15"/><path d="M7 2v5"/><path d="M17 2v5"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 12h5"/><path d="M17 17h5"/></I>,
  globe: <I><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></I>,
  mic: <I><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></I>,
  key: <I><circle cx="7.5" cy="7.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5h.01"/></I>,
  percent: <I><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></I>,
  wrench: <I><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></I>,
  flame: <I><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></I>,
  menu: <I><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></I>,
  search: <I><circle cx="11" cy="11" r="7"/><path d="m21 21-3.5-3.5"/></I>,
  close: <I><path d="M18 6L6 18"/><path d="M6 6l12 12"/></I>,
  logout: <I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></I>,
  chevron: <I><polyline points="15 18 9 12 15 6"/></I>,
  collapse: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9l-3 3 3 3"/></I>,
}

const NAV_GROUPS: NavGroup[] = [
  { heading: 'Overview', items: [{ to: '/', label: 'Dashboard', end: true, icon: ICON.dash }] },
  { heading: 'Users', items: [{ to: '/customers', label: 'Customers', icon: ICON.users }] },
  {
    heading: 'Astrologers',
    items: [
      { to: '/astrologers', label: 'All Astrologers', icon: ICON.stars },
      { to: '/charges', label: 'Pricing', icon: ICON.charges },
      { to: '/top', label: 'Top Rated', icon: ICON.award },
      { to: '/approval', label: 'KYC Queue', icon: ICON.check },
      { to: '/approval-status', label: 'KYC Status', icon: ICON.list },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { to: '/wallet', label: 'Wallet Overview', icon: ICON.wallet },
      { to: '/wallet-transactions', label: 'Transactions', icon: ICON.book },
      { to: '/wallet-ledger', label: 'Ledger', icon: ICON.book },
      { to: '/payouts', label: 'Payouts', icon: ICON.payout },
      { to: '/refunds', label: 'Refunds', icon: ICON.refund },
    ],
  },
  {
    heading: 'Sessions',
    items: [
      { to: '/sessions', label: 'Sessions', icon: ICON.video },
      { to: '/chat-rooms', label: 'Chat Rooms', icon: ICON.chat },
      { to: '/reviews', label: 'Reviews', icon: ICON.star },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/coupons', label: 'Coupons', icon: ICON.tag },
      { to: '/banners', label: 'Banners', icon: ICON.image },
      { to: '/cosmic-services', label: 'Cosmic Services', icon: ICON.sparkles },
      { to: '/live-gifts', label: 'Live Gifts', icon: ICON.gift },
      { to: '/promo-videos', label: 'Promo Videos', icon: ICON.clapper },
      { to: '/astrologer-videos', label: 'Astro Videos', icon: ICON.clapper },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { to: '/social-links', label: 'Social Links', icon: ICON.globe },
      { to: '/agora', label: 'Agora', icon: ICON.mic },
      { to: '/razorpay', label: 'Razorpay', icon: ICON.key },
      { to: '/commission', label: 'Commission', icon: ICON.percent },
      { to: '/maintenance', label: 'Maintenance', icon: ICON.wrench },
      { to: '/firebase-config', label: 'Firebase', icon: ICON.flame },
    ],
  },
]

function useActiveLabel() {
  const { pathname } = useLocation()
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.end ? pathname===i.to : pathname.startsWith(i.to)) return { label: i.label, group: g.heading }
  return { label: 'Dashboard', group: 'Overview' }
}

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('hj_sidebar_collapsed') === '1' } catch { return false }
  })
  const [query, setQuery] = useState('')
  const [userMenu, setUserMenu] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const topSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key==='/' && !/^(INPUT|TEXTAREA|SELECT)$/i.test((e.target as HTMLElement)?.tagName)) { e.preventDefault(); (window.innerWidth >= 1024 ? topSearchRef : searchRef).current?.focus() }
      if (e.key==='Escape') { setDrawerOpen(false); setUserMenu(false) }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { setDrawerOpen(false); setUserMenu(false) }, [location.pathname])
  useEffect(() => { document.body.style.overflow = drawerOpen ? 'hidden' : ''; return () => { document.body.style.overflow='' } }, [drawerOpen])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false) }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [])
  useEffect(() => { try { localStorage.setItem('hj_sidebar_collapsed', collapsed ? '1' : '0') } catch {} }, [collapsed])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV_GROUPS
    return NAV_GROUPS.map(g=>({...g, items: g.items.filter(i=>i.label.toLowerCase().includes(q) || g.heading.toLowerCase().includes(q))})).filter(g=>g.items.length>0)
  }, [query])

  const initials = (admin?.name||admin?.email||'A').split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'A'
  const { label: activeLabel, group: activeGroup } = useActiveLabel()

  const sidebarWidth = collapsed ? 'lg:w-[78px]' : 'lg:w-[294px]'
  const mainPadding = collapsed ? 'lg:pl-[78px]' : 'lg:pl-[294px]'

  return (
    <div className="app-frame min-h-screen bg-bg-0 text-ivory antialiased">
      {/* Mobile scrim */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in" onClick={()=>setDrawerOpen(false)} />}

      {/* Sidebar - desktop & mobile */}
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-[rgba(227,178,60,0.16)] ${sidebarWidth} transition-all duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${drawerOpen ? 'translate-x-0 shadow-[20px_0_80px_rgba(0,0,0,0.45)]' : '-translate-x-full lg:translate-x-0'} `}>
        {/* Brand */}
        <div className="relative z-10 flex h-[68px] items-center gap-3 border-b border-[rgba(227,178,60,0.14)] px-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center brand-mark rounded-[14px]">
              <span className="relative text-[19px] leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">✦</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[16px] font-semibold tracking-tight leading-none text-[#F7EDD7]">Hindustani Jyotish</span>
                  <span className="hidden xl:inline-flex items-center rounded-full border border-[rgba(227,178,60,0.35)] bg-[rgba(227,178,60,0.12)] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-[#EBCE7E]">Admin</span>
                </div>
                <div className="mt-1 text-[10.5px] text-[rgba(247,237,215,0.55)] tracking-wide">Astrology Console</div>
              </div>
            )}
          </div>
        </div>

        {/* Search in sidebar */}
        {!collapsed && (
          <div className="relative z-10 px-3 py-3">
            <div className="relative group">
              <input
                ref={searchRef}
                value={query}
                onChange={e=>setQuery(e.target.value)}
                placeholder="Search pages… ⌘K"
                className="h-[40px] w-full rounded-full border border-[rgba(227,178,60,0.18)] bg-[rgba(255,253,246,0.07)] pl-11 pr-10 text-[13px] text-[#F7EDD7] placeholder:text-[rgba(247,237,215,0.4)] focus:border-[rgba(227,178,60,0.5)] focus:bg-[rgba(255,253,246,0.12)] focus:shadow-[0_0_0_4px_rgba(227,178,60,0.12)] outline-none transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(247,237,215,0.45)]">{ICON.search}</span>
              {query && <button onClick={()=>setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full bg-[rgba(255,253,246,0.1)] text-[rgba(247,237,215,0.6)] hover:text-[#F7EDD7]">{ICON.close}</button>}
            </div>
          </div>
        )}

        {/* Collapsed search icon */}
        {collapsed && (
          <div className="relative z-10 p-3 hidden lg:block">
            <button onClick={()=>setCollapsed(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(255,253,246,0.07)] border border-[rgba(227,178,60,0.18)] text-[rgba(247,237,215,0.6)] hover:text-[#F7EDD7] hover:border-[rgba(227,178,60,0.35)] transition-colors">
              {ICON.search}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin] scrollbar-thin">
          {filtered.length===0 && !collapsed && <div className="px-3 py-10 text-center text-[13px] text-[rgba(247,237,215,0.5)]">No results for “{query}”</div>}
          <div className="flex flex-col gap-6 py-1">
            {filtered.map(group=>(
              <div key={group.heading}>
                {!collapsed && (
                  <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[rgba(235,206,126,0.75)]">
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[#E3B23C] shadow-[0_0_6px_rgba(227,178,60,0.6)]" />
                    {group.heading}
                  </div>
                )}
                {collapsed && <div className="mx-3 my-2 h-px bg-[rgba(227,178,60,0.14)] hidden lg:block" />}
                <div className="flex flex-col gap-1">
                  {group.items.map(item=>(
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({isActive})=>
                        `group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] font-medium transition-all border ${
                          isActive
                            ? 'bg-[linear-gradient(135deg,rgba(227,178,60,0.22),rgba(200,147,42,0.10))] text-[#F9F1DC] border-[rgba(227,178,60,0.35)] shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'text-[rgba(247,237,215,0.68)] hover:bg-[rgba(255,253,246,0.07)] hover:text-[#F7EDD7] border-transparent hover:border-[rgba(227,178,60,0.16)]'
                        } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`
                      }
                    >
                      {({isActive})=>(
                        <>
                          {isActive && !collapsed && <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#F0C763] to-[#B07D1F] shadow-[0_0_10px_rgba(227,178,60,0.6)]" />}
                          <span className={`shrink-0 transition-colors ${isActive?'text-[#EBCE7E]':''}`}>{item.icon}</span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {/* Tooltip for collapsed */}
                          {collapsed && (
                            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[rgba(227,178,60,0.3)] bg-[#0D4239] px-3 py-1.5 text-[12px] font-medium text-[#F7EDD7] shadow-xl lg:group-hover:block z-50">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="relative z-10 border-t border-[rgba(227,178,60,0.14)] p-2.5">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-[linear-gradient(180deg,rgba(255,253,246,0.08),rgba(255,253,246,0.03))] border border-[rgba(227,178,60,0.16)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#F0C763] to-[#B07D1F] text-[13px] font-bold text-[#33240A] shadow-[0_4px_14px_rgba(227,178,60,0.3)]">{initials}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold leading-tight text-[#F7EDD7]">{admin?.name || admin?.email?.split('@')[0] || 'Admin'}</div>
                <div className="truncate text-[11px] text-[rgba(247,237,215,0.5)]">{admin?.email}</div>
              </div>
              <button onClick={()=>{logout(); navigate('/login')}} className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(255,253,246,0.07)] border border-[rgba(227,178,60,0.18)] text-[rgba(247,237,215,0.6)] hover:text-[#F7EDD7] hover:border-[rgba(227,178,60,0.35)] transition-colors" title="Sign out">{ICON.logout}</button>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#F0C763] to-[#B07D1F] text-[13px] font-bold text-[#33240A]">{initials}</div>
              <button onClick={()=>{logout(); navigate('/login')}} className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(255,253,246,0.07)] border border-[rgba(227,178,60,0.18)] text-[rgba(247,237,215,0.6)] hover:text-[#F7EDD7]" title="Sign out">{ICON.logout}</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`transition-all duration-300 ${mainPadding}`}>
        {/* Topbar */}
        <header className="app-topbar sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-border-soft bg-bg-1/90 backdrop-blur-2xl px-4 lg:px-6 supports-[backdrop-filter]:bg-bg-1/75">
          <button onClick={()=>setDrawerOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-surface-1 border border-border-mid text-ivory-dim hover:text-ivory lg:hidden">{ICON.menu}</button>

          <div className="hidden lg:flex items-center gap-3 min-w-0 flex-1">
            <button onClick={()=>setCollapsed(v=>!v)} className="grid h-9 w-9 place-items-center rounded-full bg-surface-1 border border-border-mid text-ivory-faint hover:text-ivory hover:border-border-strong lg:hidden xl:grid">
              {collapsed ? <span className="rotate-180">{ICON.chevron}</span> : ICON.collapse}
            </button>
            <div className="h-5 w-px bg-border-mid hidden xl:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-ivory-faint font-semibold tracking-wide uppercase text-[10.5px]">{activeGroup}</span>
                <span className="text-[#C8932A]">/</span>
                <span className="font-display font-semibold text-[15px] text-ivory">{activeLabel}</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-ivory-faint mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E7A54] animate-pulse shadow-[0_0_6px_rgba(30,122,84,0.6)]" />
                {new Date().toLocaleDateString('en-IN',{weekday:'short', day:'numeric', month:'short', year:'numeric'})}
              </div>
            </div>
          </div>

          {/* Mobile title */}
          <div className="lg:hidden min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ivory-faint">{activeGroup}</div>
            <h1 className="font-display text-[16px] font-semibold leading-none tracking-tight truncate">{activeLabel}</h1>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Global search - desktop */}
            <div className="hidden lg:flex items-center gap-1 rounded-full border border-border-mid bg-surface-1 p-1">
              <input
                ref={topSearchRef}
                value={query}
                onChange={e=>setQuery(e.target.value)}
                placeholder="Search…  /"
                className="w-[140px] xl:w-[180px] bg-transparent border-none text-[13px] px-3 py-1.5 placeholder:text-ivory-faint focus:outline-none"
              />
              <span className="text-ivory-faint pr-1">{ICON.search}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 rounded-full border border-border-mid bg-surface-1 p-1">
              <ThemeSwitcher />
              <div className="h-5 w-px bg-border-mid" />
              <NotificationsBell />
            </div>

            <div className="flex sm:hidden items-center gap-1">
              <ThemeSwitcher />
              <NotificationsBell />
            </div>

            <div className="relative" ref={userMenuRef}>
              <button onClick={()=>setUserMenu(v=>!v)} className="group flex items-center gap-2 rounded-full border border-border-mid bg-surface-1 pl-1 pr-1 lg:pr-3 py-1 hover:border-border-strong transition-colors">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#0E4F45] to-[#17806F] text-[12px] font-bold text-[#FFFDF6] shadow-[0_2px_10px_rgba(14,79,69,0.35)] ring-1 ring-[rgba(200,147,42,0.4)]">{initials}</span>
                <span className="hidden lg:block text-left leading-tight">
                  <span className="block text-[12px] font-semibold truncate max-w-[120px]">{admin?.name || admin?.email?.split('@')[0]}</span>
                  <span className="block text-[10px] text-ivory-faint">{admin?.id === 'preview' ? 'Preview mode' : 'Admin'}</span>
                </span>
                <span className="hidden lg:grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-ivory-faint group-hover:text-ivory ml-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </button>
              {userMenu && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[300px] overflow-hidden rounded-[20px] border border-border-mid bg-surface-raised shadow-[0_24px_80px_rgba(94,72,38,0.25)] backdrop-blur-2xl animate-pop-in z-50">
                  <div className="relative overflow-hidden p-5 hero-green">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(227,178,60,0.25),transparent_65%)]" />
                    <div className="relative flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#F0C763] to-[#B07D1F] text-[14px] font-bold text-[#33240A]">{initials}</div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[#F7EDD7]">{admin?.name || 'Administrator'}</div>
                        <div className="mt-0.5 truncate text-[12px] text-[rgba(247,237,215,0.65)]">{admin?.email}</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(63,191,139,0.15)] border border-[rgba(63,191,139,0.35)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7DE0B5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3FBF8B] animate-pulse" /> {admin?.id === 'preview' ? 'Design preview' : 'Active session'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border-soft">
                    <button onClick={()=>{setUserMenu(false); navigate('/')}} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ivory-dim hover:bg-surface-1 hover:text-ivory transition-colors">
                      {ICON.dash} Dashboard
                    </button>
                    <button onClick={()=>{logout(); navigate('/login')}} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#B3402E] hover:bg-[rgba(179,64,46,0.08)] hover:text-[#96291B] transition-colors">
                      {ICON.logout} Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer quick */}
        <footer className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 pb-8 pt-2">
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-2 overflow-hidden rounded-2xl border border-border-soft bg-surface-raised px-4 py-3 text-[11px] text-ivory-faint shadow-[var(--shadow-1)]">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#1E7A54] animate-pulse shadow-[0_0_6px_rgba(30,122,84,0.5)]" /> System operational · All services running</span>
            <span className="flex items-center gap-2">Crafted with <span className="text-[#C05B3C]">✦</span> · © {new Date().getFullYear()} Hindustani Jyotish</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
