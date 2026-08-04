import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BarChart, DonutChart, LineChart, type Point } from '../components/Charts'
import { PageHeader } from '../components/ui/PageShell'

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
interface Txn { amount?: string|number; type?: string; created_at?: string }

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const p = (payload ?? {}) as { items?: T[]; results?: T[]; data?: T[] }
  return p.items ?? p.results ?? p.data ?? []
}
function dailySeries(txns: Txn[], days: number): { amount: Point[]; count: Point[] } {
  const today=new Date()
  const buckets: { key:string; label:string; amount:number; count:number }[]=[]
  for(let i=days-1;i>=0;i--){ const d=new Date(today); d.setDate(today.getDate()-i); buckets.push({ key:d.toISOString().slice(0,10), label:d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}), amount:0, count:0 }) }
  const idx=new Map(buckets.map((b,i)=>[b.key,i]))
  for(const t of txns){ if(!t.created_at) continue; const key=new Date(t.created_at).toISOString().slice(0,10); const i=idx.get(key); if(i==null) continue; buckets[i].count++; buckets[i].amount+=Math.abs(Number(t.amount)||0) }
  return { amount: buckets.map(b=>({label:b.label,value:Math.round(b.amount)})), count: buckets.map(b=>({label:b.label,value:b.count})) }
}

const inr=(n:number)=>`₹${Math.round(n).toLocaleString('en-IN')}`
function inrCompact(n:number){ const abs=Math.abs(n); const t=(x:number)=>String(Math.round(x*10)/10); if(abs>=1e7) return `₹${t(n/1e7)}Cr`; if(abs>=1e5) return `₹${t(n/1e5)}L`; if(abs>=1e3) return `₹${t(n/1e3)}K`; return `₹${Math.round(n)}` }
function relTime(iso?:string){ if(!iso) return '—'; const t=new Date(iso).getTime(); if(Number.isNaN(t)) return '—'; const m=Math.max(0,Math.round((Date.now()-t)/60000)); if(m<1) return 'just now'; if(m<60) return `${m}m ago`; const h=Math.floor(m/60); if(h<24) return `${h}h ago`; const d=Math.floor(h/24); if(d<7) return `${d}d ago`; return new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) }
function greeting(){ const h=new Date().getHours(); if(h<5) return 'Working late'; if(h<12) return 'Good morning'; if(h<17) return 'Good afternoon'; return 'Good evening' }
function txnDir(type?:string){ const t=(type??'').toLowerCase(); if(/credit|recharge|top.?up|refund|cashback|bonus/.test(t)) return 'cr'; if(/debit|charge|consult|spend|withdraw/.test(t)) return 'dr'; return 'na' }

function useCountUp(target:number, duration=900){
  const [val,setVal]=useState(0)
  const from=useRef(0)
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ const raf=requestAnimationFrame(()=>setVal(target)); return()=>cancelAnimationFrame(raf) }
    const start=from.current; const delta=target-start; if(delta===0) return; let raf:number; const t0=performance.now()
    const tick=(now:number)=>{ const p=Math.min((now-t0)/duration,1); const eased=1-Math.pow(1-p,3); setVal(Math.round(start+delta*eased)); if(p<1) raf=requestAnimationFrame(tick); else from.current=target }
    raf=requestAnimationFrame(tick); return()=>{ from.current=target; cancelAnimationFrame(raf) }
  },[target,duration])
  return val
}

function Svg({children}:{children:ReactNode}){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg> }
const IconUsers=()=><Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>
const IconStar=()=><Svg><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>
const IconChat=()=><Svg><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></Svg>
const IconTicket=()=><Svg><path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M9 9h.01"/><path d="M15 9h.01"/></Svg>
const IconAlert=()=><Svg><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const IconCheck=()=><Svg><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const IconArrowUp=()=><Svg><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>
const IconArrowRight=()=><Svg><path d="M7 17L17 7M8 7h9v9"/></Svg>
const IconBarChart=()=><Svg><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></Svg>
const IconGlobe=()=><Svg><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>
const IconCalendar=()=><Svg><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
const IconWallet=()=><Svg><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></Svg>
const IconSparkle=()=><Svg><path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707"/><circle cx="12" cy="12" r="4"/></Svg>

function KpiCard({label,value,to,tint,icon,sub,subDot,trend}:{label:string; value:number; to:string; tint:'violet'|'gold'|'pink'|'emerald'; icon:ReactNode; sub:string; subDot?:string; trend?:string}){
  const animated=useCountUp(value)
  const tints={
    violet:'from-violet-500/25 via-purple-400/20 to-violet-500/15 text-violet-400 border-violet-500/25 shadow-[0_0_35px_rgba(139,92,246,0.18)]',
    gold:'from-amber-400/25 via-yellow-400/20 to-amber-500/15 text-amber-400 border-amber-400/25 shadow-[0_0_35px_rgba(251,191,36,0.18)]',
    pink:'from-pink-400/25 via-rose-400/20 to-pink-500/15 text-pink-400 border-pink-400/25 shadow-[0_0_35px_rgba(244,114,182,0.18)]',
    emerald:'from-emerald-400/25 via-teal-400/20 to-emerald-500/15 text-emerald-400 border-emerald-400/25 shadow-[0_0_35px_rgba(52,211,153,0.18)]'
  } as const
  return (
    <Link to={to} className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl p-[1px] shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/18 no-underline">
      <div className="relative h-full rounded-[25px] bg-white/4 p-6 overflow-hidden">
        <div className={`pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br blur-xl opacity-50 group-hover:opacity-70 transition-opacity ${tints[tint].split(' ').slice(0,3).join(' ')}`} />
        <div className="relative flex items-start justify-between">
          <div className={`grid h-[56px] w-[56px] place-items-center rounded-[16px] border bg-gradient-to-br backdrop-blur-xl ${tints[tint]}`}>{icon}</div>
          <div className="flex items-center gap-2">
            {trend && <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400"><IconArrowUp />{trend}</span>}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/6 border border-white/10 text-ivory-faint opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
              <IconArrowRight />
            </span>
          </div>
        </div>
        <div className="relative mt-5 font-display text-[36px] font-black leading-none tracking-tight">{animated.toLocaleString('en-IN')}</div>
        <div className="relative mt-2 flex items-center gap-2">
          <div className="text-[14px] font-bold text-ivory">{label}</div>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-2 hidden sm:block" />
        </div>
        <div className="relative mt-3 flex items-center gap-2 border-t border-white/8 pt-3 text-[12px] text-ivory-faint">
          {subDot && <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{background:subDot, boxShadow:`0 0 12px ${subDot}`}} />}
          {sub}
        </div>
      </div>
    </Link>
  )
}

function Skeleton({className=''}:{className?:string}) {
  return <div className={`relative overflow-hidden rounded-[26px] border border-white/10 bg-white/5 ${className} animate-pulse`}><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.6s_infinite]" /></div>
}

export default function DashboardPage(){
  const { admin }=useAuth()
  const [data,setData]=useState<Overview|null>(null)
  const [series,setSeries]=useState<{amount:Point[]; count:Point[]}|null>(null)
  const [txns,setTxns]=useState<Txn[]>([])
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    api<Overview>('/admin/overview').then(setData).catch(e=>setError(e.message))
    api<unknown>('/admin/wallet/transactions?page=1&size=500').then(p=>{
      const list=unwrap<Txn>(p); setSeries(dailySeries(list,14)); setTxns([...list].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).slice(0,6))
    }).catch(()=>{ setSeries({amount:[],count:[]}); setTxns([]) })
  },[])

  const name=admin?.name?.trim() || admin?.email?.split('@')[0].replace(/[._-]+/g,' ').trim().split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ') || ''
  const today=new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'})
  const attention=data ? [{n:data.pending_approvals,label:data.pending_approvals===1?'KYC pending':'KYC pending',to:'/approval',icon:<IconAlert />},{n:data.pending_payouts,label:data.pending_payouts===1?'Payout pending':'Payouts pending',to:'/payouts',icon:<IconWallet />}].filter(a=>a.n>0) : []
  const todayVolume=series?.amount.length ? series.amount[series.amount.length-1].value : null
  const progressOnline = data ? Math.round((data.online_astrologers / Math.max(data.astrologers,1))*100) : 0

  if(!data && !error){
    return (
      <div className="space-y-6">
        <Skeleton className="h-[280px] rounded-[32px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-[200px]" />)}</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12"><Skeleton className="h-[400px] lg:col-span-8" /><Skeleton className="h-[400px] lg:col-span-4" /></div>
      </div>
    )
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Mission Control"
        subtitle="Live platform overview — customers, astrologers, consultations, wallet volume and network pulse in one command center."
        icon={<IconSparkle />}
      />
      <div className="dashboard-command-center relative space-y-6">
      <div className="pointer-events-none absolute -inset-x-10 -top-10 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_20%_0%,rgba(139,92,246,.10),transparent_52%),radial-gradient(ellipse_at_80%_10%,rgba(236,72,153,.08),transparent_48%)]" />
      {error && <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

      {data && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-7 sm:p-9 lg:p-11 shadow-[0_20px_80px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="pointer-events-none absolute -right-[18%] -top-[28%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_68%)] blur-[1px]" />
            <div className="pointer-events-none absolute -left-[10%] bottom-[-22%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12),transparent_68%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.15]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-gradient-to-r from-amber-400/12 to-orange-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.12)]">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span> Mission Control · Live
                </div>
                <h1 className="mt-5 font-display text-[32px] sm:text-[40px] lg:text-[44px] font-black leading-[0.95] tracking-[-0.04em]">
                  {greeting()}{name ? `, ${name}` : ''} <span className="text-ivory-faint font-light text-[0.7em]">✦</span>
                </h1>
                <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.6] text-ivory-dim">{today} — here's what's happening across your celestial marketplace. Everything in one command center.</p>

                {attention.length>0 ? (
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/12 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-amber-400"><IconAlert /> Needs attention</span>
                    {attention.map(a=>(
                      <Link key={a.to} to={a.to} className="group inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 backdrop-blur-xl px-5 py-3 text-[13px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-[0_8px_28px_rgba(0,0,0,0.15)] no-underline">
                        <span className="text-violet-400">{a.icon}</span> <b className="font-mono text-violet-400 text-[14px]">{a.n.toLocaleString('en-IN')}</b> {a.label} <span className="grid h-6 w-6 place-items-center rounded-full bg-white/6 border border-white/10 group-hover:bg-violet-500 group-hover:text-white transition-colors"><IconArrowRight /></span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-4 py-2 text-[12px] font-medium text-emerald-400">
                    <IconCheck /> All clear — no pending actions
                  </div>
                )}
              </div>

              <div className="relative flex items-center justify-center lg:min-h-[320px]">
                <div className="pointer-events-none absolute h-[280px] w-[280px] rounded-full border border-violet-400/15 [transform:rotate(-22deg)] before:absolute before:inset-[-18px] before:rounded-full before:border before:border-pink-400/10 before:[transform:rotate(52deg)] after:absolute after:inset-[24px] after:rounded-full after:border after:border-emerald-400/8 after:[transform:rotate(78deg)]">
                  <span className="absolute -right-1 top-1/2 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_20px_6px_rgba(139,92,246,.5)]" />
                  <span className="absolute bottom-7 left-8 h-2.5 w-2.5 rounded-full bg-pink-400 shadow-[0_0_18px_5px_rgba(236,72,153,.4)]" />
                </div>
                <div className="relative w-full rounded-[26px] border border-white/12 bg-white/5 backdrop-blur-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ivory-faint"><span className="relative grid h-2.5 w-2.5 place-items-center"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500/60"/><span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_theme(colors.emerald.500)]"/></span> Live pulse</div>
                    <span className="rounded-full bg-white/6 border border-white/10 px-3 py-1 text-[10px] font-mono font-bold">LIVE</span>
                  </div>
                  <div className="mt-5 grid gap-4">
                    {[
                      { label:'astrologers online', value:data.online_astrologers.toLocaleString('en-IN'), sub:`${progressOnline}% of network`, dot:'bg-emerald-500', bar: progressOnline },
                      { label:'sessions active', value:data.active_sessions.toLocaleString('en-IN'), sub: data.active_sessions>0 ? 'Live consultations ongoing' : 'No active calls', dot:'bg-violet-500', bar: Math.min(data.active_sessions*12,100) },
                      { label:'wallet volume today', value: todayVolume==null ? '—' : inr(todayVolume), sub: 'Gross transaction volume', dot:'bg-amber-500', gold:true, bar: 72 },
                    ].map(r=>(
                      <div key={r.label} className="group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${r.dot} shadow-[0_0_12px_currentColor]`} />
                            <div><div className={`font-display text-[24px] font-black leading-none ${r.gold ? 'text-amber-300' : ''}`}>{r.value}</div><div className="mt-1 text-[11px] text-ivory-faint">{r.label}</div></div>
                          </div>
                          <div className="text-[10px] font-mono text-ivory-faint">{r.bar}%</div>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/6 border border-white/8">
                          <div className={`h-full rounded-full transition-all duration-1000 ${r.dot} shadow-[0_0_10px_currentColor]`} style={{ width: `${r.bar}%` }} />
                        </div>
                        <div className="mt-2 text-[11px] text-ivory-faint/80">{r.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Link to="/astrologers" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[12px] font-bold shadow-[0_4px_16px_rgba(139,92,246,0.25)] hover:brightness-110 transition-all no-underline">View astrologers →</Link>
                    <Link to="/wallet" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 text-[12px] font-semibold hover:bg-white/10 transition-colors no-underline">Financials</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Customers" value={data.customers} to="/customers" tint="violet" icon={<IconUsers/>} sub="Registered seekers" trend="+8%" />
            <KpiCard label="Astrologers" value={data.astrologers} to="/astrologers" tint="gold" icon={<IconStar/>} sub={data.online_astrologers>0 ? `${data.online_astrologers} online now` : 'No one online'} subDot={data.online_astrologers>0 ? 'var(--color-success)' : undefined} trend="+3%" />
            <KpiCard label="Consultations" value={data.consultations} to="/sessions" tint="pink" icon={<IconChat/>} sub={data.active_sessions>0 ? `${data.active_sessions} live sessions` : 'No live sessions'} subDot={data.active_sessions>0 ? 'var(--color-saffron)' : undefined} trend="+12%" />
            <KpiCard label="Coupons" value={data.coupons} to="/coupons" tint="emerald" icon={<IconTicket/>} sub="Active promo codes" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] lg:col-span-8 overflow-hidden">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/12 border border-violet-500/20 text-violet-400"><IconBarChart /></div>
                  <div><h3 className="text-[15px] font-bold tracking-tight">Wallet volume</h3><p className="text-[12px] text-ivory-faint">Daily gross across all transactions</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wide">₹ / day · 14d</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live data</span>
                </div>
              </div>
              {series ? <LineChart data={series.amount} formatValue={inr} /> : <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/4 p-10 text-[14px] text-ivory-faint">Loading…</div>}
            </section>
            <section className="rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] lg:col-span-4">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/12 border border-pink-500/20 text-pink-400"><IconGlobe /></div>
                  <div><h3 className="text-[15px] font-bold tracking-tight">Network</h3><p className="text-[12px] text-ivory-faint">{data.astrologers.toLocaleString('en-IN')} total astrologers</p></div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 font-mono text-[10px] font-bold">{progressOnline}% online</span>
              </div>
              <DonutChart centerSub="astrologers" slices={[{label:'Online now', value:data.online_astrologers, color:'var(--color-success)'},{label:'KYC pending', value:data.pending_approvals, color:'var(--color-gold)'},{label:'Registered', value:Math.max(data.astrologers - data.online_astrologers - data.pending_approvals,0), color:'var(--color-violet)'}]} />
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  { k:'Online', v:data.online_astrologers },
                  { k:'Pending', v:data.pending_approvals },
                  { k:'Total', v:data.astrologers }
                ].map(s=>(
                  <div key={s.k} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl px-2 py-3">
                    <div className="text-[20px] font-black leading-none">{s.v}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ivory-faint">{s.k}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] lg:col-span-7">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/12 border border-amber-500/20 text-amber-400"><IconCalendar /></div>
                  <div><h3 className="text-[15px] font-bold tracking-tight">Daily transactions</h3><p className="text-[12px] text-ivory-faint">Count per day · last 14 days</p></div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 font-mono text-[10px] font-bold">count / day</span>
              </div>
              {series ? <BarChart data={series.count} formatValue={v=>v.toLocaleString('en-IN')} /> : <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/4 p-10 text-[14px] text-ivory-faint">Loading…</div>}
            </section>
            <section className="rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] lg:col-span-5 flex flex-col">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/12 border border-emerald-500/20 text-emerald-400"><IconUsers /></div>
                  <div><h3 className="text-[15px] font-bold tracking-tight">Latest activity</h3><p className="text-[12px] text-ivory-faint">Recent wallet movements</p></div>
                </div>
                <Link to="/wallet-transactions" className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-4 py-1.5 text-[11px] font-bold no-underline hover:brightness-110 transition-all">View all</Link>
              </div>
              {series==null ? <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/4 p-10 text-[14px] text-ivory-faint">Loading…</div> : txns.length===0 ? <div className="py-10 text-center text-[14px] text-ivory-faint">No recent transactions.</div> : (
                <div className="divide-y divide-white/6 -mx-1">
                  {txns.map((t,i)=>{
                    const dir=txnDir(t.type); const amt=Math.abs(Number(t.amount)||0)
                    return (
                      <div key={i} className="flex items-center gap-4 py-4 px-2 group hover:bg-white/4 rounded-2xl transition-colors">
                        <span className={`grid h-11 w-11 place-items-center rounded-2xl font-mono text-[15px] font-bold border shadow-sm group-hover:scale-105 transition-transform ${dir==='cr' ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' : dir==='dr' ? 'bg-red-500/12 text-red-400 border-red-500/20' : 'bg-amber-500/12 text-amber-400 border-amber-500/20'}`}>{dir==='cr'?'+':dir==='dr'?'−':'•'}</span>
                        <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold capitalize">{(t.type??'transaction').replace(/_/g,' ')}</div><div className="flex items-center gap-2 text-[11px] text-ivory-faint mt-1"><span className="h-1 w-1 rounded-full bg-ivory-faint"/>{relTime(t.created_at)}</div></div>
                        <span className={`font-mono text-[13px] font-bold px-3 py-1.5 rounded-full border ${dir==='cr'?'text-emerald-400 bg-emerald-500/10 border-emerald-500/20':dir==='dr'?'text-red-400 bg-red-500/10 border-red-500/20':'text-ivory bg-white/6 border-white/10'}`}>{dir==='cr'?'+':dir==='dr'?'−':''}{inrCompact(amt)}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-auto pt-6">
                <div className="rounded-2xl bg-gradient-to-br from-violet-500/12 to-pink-500/10 border border-violet-500/20 p-5 flex items-center justify-between backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold shadow-[0_4px_16px_rgba(139,92,246,0.3)]"><IconSparkle /></div>
                    <div><div className="text-[13px] font-bold">Pro tip</div><div className="text-[12px] text-ivory-dim">Check KYC queue daily for faster approvals.</div></div>
                  </div>
                  <Link to="/approval" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white no-underline hover:bg-white/15 transition-colors"><IconArrowRight /></Link>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
    </div>
  )
}
