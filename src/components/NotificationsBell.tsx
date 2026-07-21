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
    { label: 'Pending KYC submissions', count: kyc, to: '/approval' },
    { label: 'Pending payout requests', count: payouts, to: '/payouts' },
  ]

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <span aria-hidden>🔔</span>
        {total > 0 && <span className="notif-badge">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div className="notif-panel card">
          <div className="notif-head">Action required</div>
          {total === 0 ? (
            <div className="notif-empty faint">You're all caught up.</div>
          ) : (
            items
              .filter((i) => i.count > 0)
              .map((i) => (
                <button key={i.to} className="notif-item" onClick={() => go(i.to)}>
                  <span>{i.label}</span>
                  <span className="notif-count">{i.count}</span>
                </button>
              ))
          )}
        </div>
      )}
    </div>
  )
}
