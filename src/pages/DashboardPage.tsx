import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { BarChart, LineChart, type Point } from '../components/Charts'

interface Overview {
  customers: number
  astrologers: number
  pending_approvals: number
  online_astrologers: number
  consultations: number
  active_sessions: number
  pending_payouts: number
  coupons: number
  banners: number
}

interface Txn {
  amount?: string | number
  type?: string
  created_at?: string
}

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const p = (payload ?? {}) as { items?: T[]; results?: T[]; data?: T[] }
  return p.items ?? p.results ?? p.data ?? []
}

/** Build a per-day series for the last `days` days from wallet transactions. */
function dailySeries(txns: Txn[], days: number): { amount: Point[]; count: Point[] } {
  const today = new Date()
  const buckets: { key: string; label: string; amount: number; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      amount: 0,
      count: 0,
    })
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]))
  for (const t of txns) {
    if (!t.created_at) continue
    const key = new Date(t.created_at).toISOString().slice(0, 10)
    const i = index.get(key)
    if (i == null) continue
    buckets[i].count += 1
    buckets[i].amount += Math.abs(Number(t.amount) || 0)
  }
  return {
    amount: buckets.map((b) => ({ label: b.label, value: Math.round(b.amount) })),
    count: buckets.map((b) => ({ label: b.label, value: b.count })),
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [series, setSeries] = useState<{ amount: Point[]; count: Point[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Overview>('/admin/overview').then(setData).catch((e) => setError(e.message))
    api<unknown>('/admin/wallet/transactions?page=1&size=500')
      .then((p) => setSeries(dailySeries(unwrap<Txn>(p), 14)))
      .catch(() => setSeries({ amount: [], count: [] }))
  }, [])

  const cards: { label: string; value: number; to?: string }[] = data
    ? [
        { label: 'Customers', value: data.customers, to: '/customers' },
        { label: 'Astrologers', value: data.astrologers, to: '/astrologers' },
        { label: 'Pending approvals', value: data.pending_approvals, to: '/approval' },
        { label: 'Online astrologers', value: data.online_astrologers },
        { label: 'Consultations', value: data.consultations, to: '/sessions' },
        { label: 'Active sessions', value: data.active_sessions },
        { label: 'Pending payouts', value: data.pending_payouts, to: '/payouts' },
        { label: 'Coupons', value: data.coupons, to: '/coupons' },
      ]
    : []

  const composition: Point[] = data
    ? [
        { label: 'Astrologers', value: data.astrologers },
        { label: 'Online', value: data.online_astrologers },
        { label: 'Pending', value: data.pending_approvals },
        { label: 'Payouts', value: data.pending_payouts },
      ]
    : []

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="muted">Platform overview at a glance.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {!data && !error ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            {cards.map((c) => {
              const inner = (
                <div className="card stat" key={c.label}>
                  <div className="label">{c.label}</div>
                  <div className="value">{c.value}</div>
                </div>
              )
              return c.to ? (
                <Link key={c.label} to={c.to} style={{ color: 'inherit' }}>{inner}</Link>
              ) : (
                inner
              )
            })}
          </div>

          <div className="chart-grid" style={{ marginTop: 24 }}>
            <div className="card">
              <div className="row spread" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16 }}>Wallet volume · last 14 days</h3>
                <span className="faint" style={{ fontSize: 12 }}>₹ per day</span>
              </div>
              {series ? <LineChart data={series.amount} valuePrefix="₹" /> : <div className="empty">Loading…</div>}
            </div>

            <div className="card">
              <div className="row spread" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16 }}>Transactions · last 14 days</h3>
                <span className="faint" style={{ fontSize: 12 }}>count per day</span>
              </div>
              {series ? <LineChart data={series.count} stroke="#e8b547" /> : <div className="empty">Loading…</div>}
            </div>

            <div className="card">
              <div className="row spread" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16 }}>Astrologer activity</h3>
              </div>
              <BarChart data={composition} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
