import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BarChart, DonutChart, LineChart, type Point } from '../components/Charts'
import './dashboard.css'

/* ── Data shapes (as returned by /v1/admin/*) ────────────────────────── */
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
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
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

/* ── Formatting helpers ──────────────────────────────────────────────── */
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/** Indian-style compact: ₹980 · ₹42.5K · ₹1.4L · ₹2.1Cr (trailing .0 trimmed) */
function inrCompact(n: number): string {
  const abs = Math.abs(n)
  const t = (x: number) => String(Math.round(x * 10) / 10)
  if (abs >= 1e7) return `₹${t(n / 1e7)}Cr`
  if (abs >= 1e5) return `₹${t(n / 1e5)}L`
  if (abs >= 1e3) return `₹${t(n / 1e3)}K`
  return `₹${Math.round(n)}`
}

function relTime(iso?: string): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Credit / debit / neutral classification for feed styling. */
function txnDir(type?: string): 'cr' | 'dr' | 'na' {
  const t = (type ?? '').toLowerCase()
  if (/credit|recharge|top.?up|refund|cashback|bonus/.test(t)) return 'cr'
  if (/debit|charge|consult|spend|withdraw/.test(t)) return 'dr'
  return 'na'
}

/* ── Count-up animation for KPI numbers ──────────────────────────────── */
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setVal(target))
      return () => cancelAnimationFrame(raf)
    }
    const start = from.current
    const delta = target - start
    if (delta === 0) return
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(start + delta * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => {
      from.current = target
      cancelAnimationFrame(raf)
    }
  }, [target, duration])

  return val
}

/* ── Icons (inline SVG, stroke = currentColor) ───────────────────────── */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}
const IconUsers = () => (
  <Svg>
    <circle cx="9.5" cy="8" r="3.4" />
    <path d="M3.5 19.5c.7-3.6 3.2-5.4 6-5.4s5.3 1.8 6 5.4" />
    <path d="M16.2 4.9a3.4 3.4 0 0 1 0 6.2M18.4 14.5c1.5.8 2.5 2.2 2.9 4.4" />
  </Svg>
)
const IconStar = () => (
  <Svg>
    <path d="M12 3.5 13.9 9.2 19.6 11.1 13.9 13 12 18.7 10.1 13 4.4 11.1 10.1 9.2Z" />
    <path d="M18.5 17l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" strokeWidth="1.4" />
  </Svg>
)
const IconChat = () => (
  <Svg>
    <path d="M4.5 4.5h15A1.5 1.5 0 0 1 21 6v8.5a1.5 1.5 0 0 1-1.5 1.5H9.6L5 19.5V16H4.5A1.5 1.5 0 0 1 3 14.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="M7.5 9h9M7.5 12h5.5" />
  </Svg>
)
const IconTicket = () => (
  <Svg>
    <path d="M4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.6a2.4 2.4 0 0 0 0 4.8v2.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2.6a2.4 2.4 0 0 0 0-4.8V7.5A1.5 1.5 0 0 1 4.5 6Z" />
    <path d="M13.5 8v1.7M13.5 11.7v1.7M13.5 15.4V17" strokeDasharray="0.1 2.6" />
  </Svg>
)
const IconAlert = () => (
  <Svg>
    <path d="M12 4.2 21.3 19.8H2.7L12 4.2Z" />
    <path d="M12 10.2v4M12 17.2v.1" />
  </Svg>
)
const IconArrow = () => (
  <Svg>
    <path d="M7 17 17 7M9.5 7H17v7.5" />
  </Svg>
)

/* ── Decorative star field for the hero ──────────────────────────────── */
const STARS: { l: number; t: number; s: number; d: number; warm?: boolean; violet?: boolean }[] = [
  { l: 38, t: 22, s: 2.5, d: 0 },
  { l: 47, t: 68, s: 2, d: 0.7 },
  { l: 55, t: 14, s: 3, d: 1.4, warm: true },
  { l: 62, t: 80, s: 2, d: 0.3 },
  { l: 68, t: 30, s: 2, d: 2.1 },
  { l: 74, t: 55, s: 2.5, d: 1.0, violet: true },
  { l: 81, t: 18, s: 2, d: 1.8 },
  { l: 86, t: 72, s: 3, d: 0.5, warm: true },
  { l: 92, t: 40, s: 2, d: 2.5 },
  { l: 30, t: 78, s: 2, d: 1.2, violet: true },
  { l: 22, t: 12, s: 2.5, d: 2.8, warm: true },
  { l: 45, t: 40, s: 1.8, d: 0.9 },
  { l: 75, t: 85, s: 2, d: 1.5 },
  { l: 15, t: 45, s: 2.5, d: 2.0, warm: true },
]

const rise = (i: number) => ({ '--i': i }) as CSSProperties

/* ── KPI card ────────────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  to,
  tint,
  icon,
  sub,
  subDot,
  index,
}: {
  label: string
  value: number
  to: string
  tint: 'saffron' | 'gold' | 'violet' | 'copper'
  icon: ReactNode
  sub: string
  subDot?: string
  index: number
}) {
  const animated = useCountUp(value)
  return (
    <Link to={to} className="db-kpi db-rise" style={rise(index)}>
      <div className="db-kpi-top">
        <span className="db-kpi-ico" data-tint={tint}>
          {icon}
        </span>
        <span className="db-kpi-goto">
          <IconArrow />
        </span>
      </div>
      <div className="db-kpi-value">{animated.toLocaleString('en-IN')}</div>
      <div className="db-kpi-label">{label}</div>
      <div className="db-kpi-sub">
        {subDot && <span className="db-dot" style={{ '--c': subDot } as CSSProperties} />}
        {sub}
      </div>
    </Link>
  )
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { admin } = useAuth()
  const [data, setData] = useState<Overview | null>(null)
  const [series, setSeries] = useState<{ amount: Point[]; count: Point[] } | null>(null)
  const [txns, setTxns] = useState<Txn[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Overview>('/admin/overview').then(setData).catch((e) => setError(e.message))
    api<unknown>('/admin/wallet/transactions?page=1&size=500')
      .then((p) => {
        const list = unwrap<Txn>(p)
        setSeries(dailySeries(list, 14))
        setTxns(
          [...list]
            .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
            .slice(0, 6),
        )
      })
      .catch(() => {
        setSeries({ amount: [], count: [] })
        setTxns([])
      })
  }, [])

  const name =
    admin?.name?.trim() ||
    admin?.email
      ?.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ||
    ''
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const attention = data
    ? [
        {
          n: data.pending_approvals,
          label: data.pending_approvals === 1 ? 'KYC approval pending' : 'KYC approvals pending',
          to: '/approval',
        },
        {
          n: data.pending_payouts,
          label: data.pending_payouts === 1 ? 'payout request waiting' : 'payout requests waiting',
          to: '/payouts',
        },
      ].filter((a) => a.n > 0)
    : []

  const todayVolume = series?.amount.length ? series.amount[series.amount.length - 1].value : null

  if (!data && !error) {
    return (
      <div className="db-wrap">
        <div className="db-skel hero" />
        <div className="db-kpis">
          {[0, 1, 2, 3].map((i) => (
            <div className="db-skel kpi" key={i} />
          ))}
        </div>
        <div className="db-main">
          <div className="db-skel block db-col-8" />
          <div className="db-skel block db-col-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="db-wrap">
      {error && <div className="error-banner">{error}</div>}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {data && (
        <section className="db-hero db-rise" style={rise(0)}>
          <span className="db-ring" aria-hidden />
          <span className="db-ring r2" aria-hidden />
          {STARS.map((s, i) => (
            <span
              key={i}
              className={`db-star${s.warm ? ' warm' : ''}${s.violet ? ' violet' : ''}`}
              aria-hidden
              style={
                {
                  left: `${s.l}%`,
                  top: `${s.t}%`,
                  width: s.s,
                  height: s.s,
                  '--d': `${s.d}s`,
                } as CSSProperties
              }
            />
          ))}

          <div className="db-hero-main">
            <span className="db-eyebrow">Mission control</span>
            <h1 className="db-title">
              {greeting()}
              {name ? `, ${name}` : ''}
            </h1>
            <p className="db-sub muted">
              {today} — here’s what’s happening across the platform today.
            </p>

            {attention.length > 0 && (
              <div className="db-attn">
                <span className="db-attn-tag">
                  <IconAlert /> Needs attention
                </span>
                {attention.map((a) => (
                  <Link key={a.to} to={a.to} className="db-attn-item">
                    <b>{a.n.toLocaleString('en-IN')}</b> {a.label} <IconArrow />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="db-pulse">
            <div className="db-pulse-head">
              <span className="db-dot" /> Live pulse
            </div>
            <div className="db-pulse-grid">
              <div className="db-pulse-item">
                <span className="db-dot" />
                <div>
                  <div className="db-pulse-val">{data.online_astrologers.toLocaleString('en-IN')}</div>
                  <div className="db-pulse-label">astrologers online</div>
                </div>
              </div>
              <div className="db-pulse-item">
                <span className="db-dot" style={{ '--c': 'var(--saffron)' } as CSSProperties} />
                <div>
                  <div className="db-pulse-val">{data.active_sessions.toLocaleString('en-IN')}</div>
                  <div className="db-pulse-label">sessions in progress</div>
                </div>
              </div>
              <div className="db-pulse-item">
                <span className="db-dot" style={{ '--c': 'var(--gold)' } as CSSProperties} />
                <div>
                  <div className="db-pulse-val">{todayVolume == null ? '—' : inr(todayVolume)}</div>
                  <div className="db-pulse-label">wallet volume today</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── KPI grid ─────────────────────────────────────────────────── */}
      {data && (
        <div className="db-kpis">
          <KpiCard
            index={1}
            label="Customers"
            value={data.customers}
            to="/customers"
            tint="saffron"
            icon={<IconUsers />}
            sub="Registered seekers"
          />
          <KpiCard
            index={2}
            label="Astrologers"
            value={data.astrologers}
            to="/astrologers"
            tint="gold"
            icon={<IconStar />}
            sub={
              data.online_astrologers > 0
                ? `${data.online_astrologers.toLocaleString('en-IN')} online right now`
                : 'Nobody online at the moment'
            }
            subDot={data.online_astrologers > 0 ? 'var(--success)' : undefined}
          />
          <KpiCard
            index={3}
            label="Consultations"
            value={data.consultations}
            to="/sessions"
            tint="violet"
            icon={<IconChat />}
            sub={
              data.active_sessions > 0
                ? `${data.active_sessions.toLocaleString('en-IN')} live sessions running`
                : 'No live sessions right now'
            }
            subDot={data.active_sessions > 0 ? 'var(--saffron)' : undefined}
          />
          <KpiCard
            index={4}
            label="Coupons"
            value={data.coupons}
            to="/coupons"
            tint="copper"
            icon={<IconTicket />}
            sub="Promo codes configured"
          />
        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────────── */}
      {data && (
        <>
          <div className="db-main">
            <section className="db-card db-col-8 db-rise" style={rise(5)}>
              <div className="db-card-head">
                <h3>Wallet volume</h3>
                <span className="db-chip">₹ / day · last 14 days</span>
              </div>
              {series ? (
                <LineChart data={series.amount} formatValue={inr} />
              ) : (
                <div className="empty">Loading…</div>
              )}
            </section>

            <section className="db-card db-col-4 db-rise" style={rise(6)}>
              <div className="db-card-head">
                <h3>Astrologer network</h3>
                <span className="db-chip">{data.astrologers.toLocaleString('en-IN')} total</span>
              </div>
              <DonutChart
                centerSub="astrologers"
                slices={[
                  { label: 'Online now', value: data.online_astrologers, color: 'var(--success)' },
                  { label: 'KYC pending', value: data.pending_approvals, color: 'var(--gold)' },
                  {
                    label: 'Registered',
                    value: Math.max(data.astrologers - data.online_astrologers - data.pending_approvals, 0),
                    color: 'var(--saffron)',
                  },
                ]}
              />
            </section>
          </div>

          <div className="db-main">
            <section className="db-card db-col-7 db-rise" style={rise(7)}>
              <div className="db-card-head">
                <h3>Daily transactions</h3>
                <span className="db-chip">count / day · 14 days</span>
              </div>
              {series ? (
                <BarChart data={series.count} formatValue={(v) => v.toLocaleString('en-IN')} />
              ) : (
                <div className="empty">Loading…</div>
              )}
            </section>

            <section className="db-card db-col-5 db-rise" style={rise(8)}>
              <div className="db-card-head">
                <h3>Latest wallet activity</h3>
                <span className="db-chip">transactions</span>
              </div>
              {series == null ? (
                <div className="empty">Loading…</div>
              ) : txns.length === 0 ? (
                <div className="db-feed-empty">No recent transactions.</div>
              ) : (
                <>
                  <div className="db-feed">
                    {txns.map((t, i) => {
                      const dir = txnDir(t.type)
                      const amt = Math.abs(Number(t.amount) || 0)
                      return (
                        <div className="db-feed-row" key={i}>
                          <span className="db-feed-ico" data-dir={dir}>
                            {dir === 'cr' ? '+' : dir === 'dr' ? '−' : '•'}
                          </span>
                          <div className="db-feed-body">
                            <div className="db-feed-title">{(t.type ?? 'transaction').replace(/_/g, ' ')}</div>
                            <div className="db-feed-sub">{relTime(t.created_at)}</div>
                          </div>
                          <span className="db-feed-amt" data-dir={dir}>
                            {dir === 'cr' ? '+' : dir === 'dr' ? '−' : ''}
                            {inrCompact(amt)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <Link to="/wallet-transactions" className="db-feed-more">
                    View all transactions <IconArrow />
                  </Link>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
