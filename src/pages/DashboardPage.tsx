import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BarChart, DonutChart, LineChart, type Point } from '../components/Charts'

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

/* ── Icons ───────────────────────────────────────────────────────────── */
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

/* ── Decorative stars ────────────────────────────────────────────────── */
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

  const tintClasses = {
    saffron: 'bg-gradient-to-br from-saffron-soft to-saffron-glow text-saffron-bright shadow-[0_0_20px_var(--color-saffron-soft)]',
    gold: 'bg-gradient-to-br from-gold-bg to-gold-glow text-gold shadow-[0_0_20px_var(--color-gold-glow)]',
    violet: 'bg-gradient-to-br from-violet-bg to-violet/20 text-violet shadow-[0_0_20px_var(--color-violet-bg)]',
    copper: 'bg-gradient-to-br from-copper/20 to-copper/30 text-[#df9f6b] shadow-[0_0_20px_rgba(199,123,74,0.2)]',
  }

  return (
    <Link
      to={to}
      className="relative overflow-hidden block text-inherit bg-surface-raised border border-border-soft rounded-[--radius-xl] p-5 shadow-[--shadow-1] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-border-mid hover:shadow-[--shadow-2] hover:shadow-saffron/10 hover:no-underline"
      style={rise(index)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-soft to-transparent to-violet-bg opacity-0 transition-opacity duration-300 hover:opacity-50" />
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-saffron via-violet to-transparent scale-x-0 origin-left transition-transform duration-300 hover:scale-x-100" />

      <div className="flex items-center justify-between relative z-10">
        <span className={`w-12 h-12 rounded-[--radius-md] flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:-rotate-3 ${tintClasses[tint]}`}>
          {icon}
        </span>
        <span className="opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 text-ivory-faint hover:text-saffron-bright">
          <IconArrow />
        </span>
      </div>
      <div className="font-display text-[36px] font-semibold mt-4 leading-none tracking-tight" style={{ letterSpacing: '-0.025em' }}>
        {animated.toLocaleString('en-IN')}
      </div>
      <div className="text-[13.5px] text-ivory-dim mt-2 font-medium relative z-10">{label}</div>
      <div className="flex items-center gap-2 text-[12.5px] text-ivory-faint mt-4 pt-3.5 border-t border-border-soft relative z-10">
        {subDot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subDot, boxShadow: `0 0 8px ${subDot}` }} />}
        {sub}
      </div>
    </Link>
  )
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-1 border border-border-soft rounded-[--radius-xl] ${className}`}>
      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-surface-3 to-transparent animate-[shimmer_1.6s_infinite]" />
    </div>
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
      <div className="flex flex-col gap-6">
        <Skeleton className="h-60 rounded-[--radius-2xl]" />
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-lg:grid-cols-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[170px]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex gap-3 p-4 rounded-[--radius-md] bg-danger-bg border border-danger/30 text-danger-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {data && (
        <section
          className="relative overflow-hidden border border-border-soft rounded-[--radius-2xl] p-10 lg:p-11 bg-[radial-gradient(ellipse_700px_400px_at_2%_-30%,color-mix(in_srgb,var(--color-saffron)_30%,transparent),transparent_70%),radial-gradient(ellipse_700px_400px_at_100%_-20%,var(--color-bg-glow),transparent_70%),radial-gradient(ellipse_400px_300px_at_80%_120%,var(--color-bg-glow-3),transparent_60%),linear-gradient(145deg,var(--color-bg-2),var(--color-bg-1))] shadow-[--shadow-2] grid grid-cols-[1.6fr_1fr] gap-10 items-center max-lg:grid-cols-1 max-lg:gap-7"
          style={rise(0)}
        >
          {/* Orbit rings */}
          <span className="absolute right-[-140px] top-[-180px] w-[400px] h-[400px] rounded-full border border-dashed opacity-35 pointer-events-none animate-[spin_100s_linear_infinite]" style={{ borderColor: 'var(--color-saffron)' }} />
          <span className="absolute right-[-60px] top-[-110px] w-[280px] h-[280px] rounded-full border border-solid opacity-20 pointer-events-none animate-[spin_70s_linear_infinite_reverse]" style={{ borderColor: 'var(--color-saffron)' }} />

          {/* Stars */}
          {STARS.map((s, i) => (
            <span
              key={i}
              className={`absolute rounded-full pointer-events-none animate-[twinkle_3.5s_ease-in-out_infinite] ${s.warm ? 'bg-saffron-bright shadow-[0_0_12px_var(--color-saffron)]' : s.violet ? 'bg-violet shadow-[0_0_12px_var(--color-violet)]' : 'bg-ivory/70 shadow-[0_0_8px_currentColor]'}`}
              style={{
                left: `${s.l}%`,
                top: `${s.t}%`,
                width: s.s,
                height: s.s,
                animationDelay: `${s.d}s`,
              }}
            />
          ))}

          <div className="relative">
            <div className="inline-flex items-center gap-2.5 font-mono text-[11.5px] tracking-widest uppercase font-semibold text-saffron-bright mb-3">
              <span className="animate-[twinkle-icon_2s_ease-in-out_infinite]">✦</span>
              Mission control
            </div>
            <h1 className="font-display text-[clamp(28px,3.8vw,40px)] font-semibold mb-3.5 leading-tight tracking-tight bg-gradient-to-r from-ivory to-saffron-bright bg-clip-text text-transparent">
              {greeting()}{name ? `, ${name}` : ''}
            </h1>
            <p className="text-[15px] max-w-[50ch] leading-relaxed text-ivory-dim">
              {today} — here's what's happening across the platform today.
            </p>

            {attention.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <span className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-widest text-gold px-3.5 py-1.5 bg-gold-bg rounded-full border border-gold/30">
                  <IconAlert /> Needs attention
                </span>
                {attention.map((a) => (
                  <Link key={a.to} to={a.to} className="inline-flex items-center gap-2.5 py-2.5 px-4 rounded-full text-[13.5px] font-semibold text-ivory bg-gradient-to-r from-gold-bg to-transparent border border-gold/35 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_4px_20px_var(--color-gold-glow)] hover:no-underline">
                    <b className="font-mono text-gold">{a.n.toLocaleString('en-IN')}</b>
                    {a.label}
                    <IconArrow />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Live pulse */}
          <div className="relative bg-gradient-to-br from-surface-1 to-surface-2 border border-border-soft rounded-[--radius-xl] p-5 backdrop-blur-[10px] shadow-[--shadow-1]">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-widest uppercase font-semibold text-ivory-faint mb-4">
              <span className="relative w-2.5 h-2.5 shrink-0 rounded-full bg-success shadow-[0_0_8px_var(--color-success)] after:absolute after:inset-[-5px] after:rounded-full after:border-2 after:border-success after:animate-[ping_2s_ease-out_infinite]" />
              Live pulse
            </div>
            <div className="grid grid-cols-1 gap-3.5 max-sm:grid-cols-1">
              <div className="flex gap-3 items-start">
                <span className="relative w-2.5 h-2.5 shrink-0 rounded-full bg-success shadow-[0_0_8px_var(--color-success)] mt-1" />
                <div>
                  <div className="font-display text-[26px] font-semibold leading-tight whitespace-nowrap" style={{ letterSpacing: '-0.02em' }}>{data.online_astrologers.toLocaleString('en-IN')}</div>
                  <div className="text-[11.5px] text-ivory-faint mt-1 leading-relaxed">astrologers online</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="relative w-2.5 h-2.5 shrink-0 rounded-full bg-saffron shadow-[0_0_8px_var(--color-saffron)] mt-1" />
                <div>
                  <div className="font-display text-[26px] font-semibold leading-tight whitespace-nowrap" style={{ letterSpacing: '-0.02em' }}>{data.active_sessions.toLocaleString('en-IN')}</div>
                  <div className="text-[11.5px] text-ivory-faint mt-1 leading-relaxed">sessions in progress</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="relative w-2.5 h-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)] mt-1" />
                <div>
                  <div className="font-display text-[26px] font-semibold leading-tight whitespace-nowrap text-gold" style={{ letterSpacing: '-0.02em' }}>{todayVolume == null ? '—' : inr(todayVolume)}</div>
                  <div className="text-[11.5px] text-ivory-faint mt-1 leading-relaxed">wallet volume today</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── KPI grid ─────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-lg:gap-3.5 max-md:grid-cols-1 lg:gap-4">
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
            subDot={data.online_astrologers > 0 ? 'var(--color-success)' : undefined}
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
            subDot={data.active_sessions > 0 ? 'var(--color-saffron)' : undefined}
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
          <div className="grid grid-cols-12 gap-5 max-lg:grid-cols-1">
            <section className="col-span-8 bg-surface-raised border border-border-soft rounded-[--radius-xl] p-6 min-w-0 shadow-[--shadow-1] transition-all duration-300 hover:border-border-mid hover:shadow-[--shadow-2] hover:-translate-y-0.5 max-lg:col-span-1 max-xl:col-span-12">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-[16px] font-bold">Wallet volume</h3>
                <span className="font-mono text-[11px] text-ivory-faint bg-surface-2 border border-border-soft px-3 py-1 rounded-full whitespace-nowrap">₹ / day · last 14 days</span>
              </div>
              {series ? (
                <LineChart data={series.amount} formatValue={inr} />
              ) : (
                <div className="text-center py-12 text-ivory-faint text-[14px] bg-surface-1 rounded-[--radius-xl] border border-dashed border-border-soft p-8">Loading…</div>
              )}
            </section>

            <section className="col-span-4 bg-surface-raised border border-border-soft rounded-[--radius-xl] p-6 min-w-0 shadow-[--shadow-1] transition-all duration-300 hover:border-border-mid hover:shadow-[--shadow-2] hover:-translate-y-0.5 max-lg:col-span-1 max-xl:col-span-12">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-[16px] font-bold">Astrologer network</h3>
                <span className="font-mono text-[11px] text-ivory-faint bg-surface-2 border border-border-soft px-3 py-1 rounded-full whitespace-nowrap">{data.astrologers.toLocaleString('en-IN')} total</span>
              </div>
              <DonutChart
                centerSub="astrologers"
                slices={[
                  { label: 'Online now', value: data.online_astrologers, color: 'var(--color-success)' },
                  { label: 'KYC pending', value: data.pending_approvals, color: 'var(--color-gold)' },
                  {
                    label: 'Registered',
                    value: Math.max(data.astrologers - data.online_astrologers - data.pending_approvals, 0),
                    color: 'var(--color-saffron)',
                  },
                ]}
              />
            </section>
          </div>

          <div className="grid grid-cols-12 gap-5 max-lg:grid-cols-1">
            <section className="col-span-7 bg-surface-raised border border-border-soft rounded-[--radius-xl] p-6 min-w-0 shadow-[--shadow-1] transition-all duration-300 hover:border-border-mid hover:shadow-[--shadow-2] hover:-translate-y-0.5 max-lg:col-span-1 max-xl:col-span-12">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-[16px] font-bold">Daily transactions</h3>
                <span className="font-mono text-[11px] text-ivory-faint bg-surface-2 border border-border-soft px-3 py-1 rounded-full whitespace-nowrap">count / day · 14 days</span>
              </div>
              {series ? (
                <BarChart data={series.count} formatValue={(v) => v.toLocaleString('en-IN')} />
              ) : (
                <div className="text-center py-12 text-ivory-faint text-[14px] bg-surface-1 rounded-[--radius-xl] border border-dashed border-border-soft p-8">Loading…</div>
              )}
            </section>

            <section className="col-span-5 bg-surface-raised border border-border-soft rounded-[--radius-xl] p-6 min-w-0 shadow-[--shadow-1] transition-all duration-300 hover:border-border-mid hover:shadow-[--shadow-2] hover:-translate-y-0.5 max-lg:col-span-1 max-xl:col-span-12">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-[16px] font-bold">Latest wallet activity</h3>
                <span className="font-mono text-[11px] text-ivory-faint bg-surface-2 border border-border-soft px-3 py-1 rounded-full whitespace-nowrap">transactions</span>
              </div>
              {series == null ? (
                <div className="text-center py-12 text-ivory-faint text-[14px] bg-surface-1 rounded-[--radius-xl] border border-dashed border-border-soft p-8">Loading…</div>
              ) : txns.length === 0 ? (
                <div className="text-center py-12 text-ivory-faint text-[14px]">No recent transactions.</div>
              ) : (
                <>
                  <div className="flex flex-col -mx-2 -my-1">
                    {txns.map((t, i) => {
                      const dir = txnDir(t.type)
                      const amt = Math.abs(Number(t.amount) || 0)
                      return (
                        <div key={i} className="flex items-center gap-3.5 py-3.5 px-2 border-b border-border-soft last:border-b-0 transition-all duration-150 hover:bg-surface-1 rounded-[--radius-sm]">
                          <span
                            className={`w-9 h-9 rounded-[--radius-md] flex items-center justify-center font-bold font-mono text-[16px] transition-transform duration-200 ${
                              dir === 'cr' ? 'bg-success-bg text-success shadow-[0_0_15px_var(--color-success-glow)]' :
                              dir === 'dr' ? 'bg-danger-bg text-danger shadow-[0_0_15px_var(--color-danger-glow)]' :
                              'bg-gold-bg text-gold shadow-[0_0_15px_var(--color-gold-glow)]'
                            }`}
                          >
                            {dir === 'cr' ? '+' : dir === 'dr' ? '−' : '•'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-semibold capitalize truncate">{(t.type ?? 'transaction').replace(/_/g, ' ')}</div>
                            <div className="text-[12px] text-ivory-faint mt-0.5">{relTime(t.created_at)}</div>
                          </div>
                          <span className={`font-mono text-[14px] whitespace-nowrap font-bold ${
                            dir === 'cr' ? 'text-success' : dir === 'dr' ? 'text-danger' : 'text-ivory'
                          }`}>
                            {dir === 'cr' ? '+' : dir === 'dr' ? '−' : ''}
                            {inrCompact(amt)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <Link to="/wallet-transactions" className="inline-flex items-center gap-2 mt-4 py-2.5 px-4 text-[13.5px] font-semibold text-saffron-bright bg-saffron-soft rounded-full transition-all duration-200 hover:bg-saffron hover:text-on-accent hover:-translate-x-1 hover:no-underline">
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
