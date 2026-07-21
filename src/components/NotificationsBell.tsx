import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface Overview {
  pending_approvals: number
  pending_payouts: number
}

const POLL_MS = 60_000

/**
 * Header bell surfacing actionable pending items — pending KYC submissions and
 * pending payout requests. Counts come from `/admin/overview` (which aggregates
 * `/approvals` and `/payouts`); refreshed on navigation and every minute.
 */
export default function NotificationsBell() {
  const [counts, setCounts] = useState<Overview | null>(null)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    api<Overview>('/admin/overview').then(setCounts).catch(() => {})
  }, [])

  // Refresh on navigation.
  useEffect(() => {
    load()
  }, [load, location.pathname])

  // Poll on an interval.
  useEffect(() => {
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const kyc = counts?.pending_approvals ?? 0
  const payouts = counts?.pending_payouts ?? 0
  const total = kyc + payouts

  const items = [
    { label: 'Pending KYC submissions', count: kyc, to: '/approval', icon: 'user' },
    { label: 'Pending payout requests', count: payouts, to: '/payouts', icon: 'wallet' },
  ]

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {total > 0 && <span className="notif-badge">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div className="notif-panel card">
          <div className="notif-head">Action required</div>
          {total === 0 ? (
            <div className="notif-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="faint">You're all caught up!</span>
            </div>
          ) : (
            items
              .filter((i) => i.count > 0)
              .map((i) => (
                <button key={i.to} className="notif-item" onClick={() => go(i.to)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: 'var(--gold-bg)', color: 'var(--gold)', display: 'grid', placeItems: 'center' }}>
                      {i.icon === 'user' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M6 12h.01M18 12h.01" />
                        </svg>
                      )}
                    </span>
                    {i.label}
                  </span>
                  <span className="notif-count">{i.count}</span>
                </button>
              ))
          )}
        </div>
      )}
    </div>
  )
}
