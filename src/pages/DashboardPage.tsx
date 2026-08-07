import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BarChart, DonutChart, LineChart, type Point } from '../components/Charts'

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

/* Demo dataset — shown only when the API is unreachable, so the console
   can be reviewed as a design preview without the backend running. */
const DEMO_OVERVIEW: Overview = { customers: 12480, astrologers: 342, pending_approvals: 8, online_astrologers: 27, consultations: 4850, active_sessions: 12, pending_payouts: 3, coupons: 42, banners: 9 }
const DEMO_TYPES = ['consultation_fee','wallet_recharge','refund','cashback','withdrawal','gift_received','subscription']
function demoTxns(): Txn[] {
  const out: Txn[] = []
  const now = Date.now()
  for (let i=0;i<220;i++){
    const d = new Date(now - Math.floor(Math.random()*13*86400000))
    out.push({
      type: DEMO_TYPES[Math.floor(Math.random()*DEMO_TYPES.length)],
      amount: Math.round((Math.random()*12000 + 99) * 100) / 100,
      created_at: d.toISOString(),
    })
  }
  return out
}

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

/* Heritage tint recipes for KPI tiles */
const TINTS = {
  peacock: 'bg-[rgba(14,79,69,0.09)] text-[#0E4F45] border-[rgba(14,79,69,0.22)]',
  gold:    'bg-[rgba(200,147,42,0.10)] text-[#A87A1D] border-[rgba(200,147,42,0.28)]',
  terracotta: 'bg-[rgba(192,91,60,0.10)] text-[#B3402E] border-[rgba(192,91,60,0.26)]',
  rose:    'bg-[rgba(166,58,94,0.09)] text-[#A63A5E] border-[rgba(166,58,94,0.24)]',
} as const

function KpiCard({label,value,to,tint,icon,sub,subDot,trend}:{label:string; value:number; to:string; tint:keyof typeof TINTS; icon:ReactNode; sub:string; subDot?:string; trend?:string}){
  const animated=useCountUp(value)
  return (
    <Link to={to} className="sheen-sweep group relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,147,42,0.4)] hover:shadow-[var(--shadow-2)] no-underline">
      {/* gold zari hairline on hover */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.6)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-[54px] w-[54px] place-items-center rounded-[15px] border ${TINTS[tint]}`}>{icon}</div>
        <div className="flex items-center gap-2">
          {trend && <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[rgba(30,122,84,0.10)] border border-[rgba(30,122,84,0.25)] px-2.5 py-1 text-[10px] font-bold text-[#1E7A54]"><IconArrowUp />{trend}</span>}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 border border-border-soft text-ivory-faint opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
            <IconArrowRight />
          </span>
        </div>
      </div>
      <div className="kpi-num relative mt-5 text-[34px] font-bold leading-none tracking-tight">{animated.toLocaleString('en-IN')}</div>
      <div className="relative mt-2.5 flex items-center gap-2">
        <div className="text-[13.5px] font-bold text-ivory">{label}</div>
        <div className="h-px flex-1 bg-gradient-to-r from-[rgba(200,147,42,0.35)] to-transparent ml-2 hidden sm:block" />
      </div>
      <div className="relative mt-3 flex items-center gap-2 border-t border-border-soft pt-3 text-[12px] text-ivory-faint">
        {subDot && <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{background:subDot, boxShadow:`0 0 12px ${subDot}`}} />}
        {sub}
      </div>
    </Link>
  )
}

function Skeleton({className=''}:{className?:string}) {
  return <div className={`relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised shadow-[var(--shadow-1)] ${className} animate-pulse`}><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.08)] to-transparent animate-[shimmer_1.6s_infinite]" /></div>
}

export default function DashboardPage(){
  const { admin }=useAuth()
  const [data,setData]=useState<Overview|null>(null)
  const [series,setSeries]=useState<{amount:Point[]; count:Point[]}|null>(null)
  const [txns,setTxns]=useState<Txn[]>([])
  const [error,setError]=useState<string|null>(null)
  const [demo,setDemo]=useState(false)

  useEffect(()=>{
    api<Overview>('/admin/overview')
      .then(setData)
      .catch((e: Error)=>{ setError(e.message); setData(DEMO_OVERVIEW); setDemo(true) })
    api<unknown>('/admin/wallet/transactions?page=1&size=500')
      .then(p=>{
        const list=unwrap<Txn>(p); setSeries(dailySeries(list,14)); setTxns([...list].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).slice(0,6))
      })
      .catch(()=>{ const list=demoTxns(); setSeries(dailySeries(list,14)); setTxns([...list].sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')).slice(0,6)); setDemo(true) })
  },[])

  const name=admin?.name?.trim() || admin?.email?.split('@')[0].replace(/[._-]+/g,' ').trim().split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ') || ''
  const today=new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'})
  const attention=data ? [{n:data.pending_approvals,label:data.pending_approvals===1?'KYC pending':'KYC pending',to:'/approval',icon:<IconAlert />},{n:data.pending_payouts,label:data.pending_payouts===1?'Payout pending':'Payouts pending',to:'/payouts',icon:<IconWallet />}].filter(a=>a.n>0) : []
  const todayVolume=series?.amount.length ? series.amount[series.amount.length-1].value : null
  const progressOnline = data ? Math.round((data.online_astrologers / Math.max(data.astrologers,1))*100) : 0

  if(!data && !error){
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] rounded-[28px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-[200px]" />)}</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12"><Skeleton className="h-[400px] lg:col-span-8" /><Skeleton className="h-[400px] lg:col-span-4" /></div>
      </div>
    )
  }

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="page-eyebrow">Hindustani Jyotish · Admin</div>
          <h1 className="mt-2 font-display text-[26px] sm:text-[32px] font-bold tracking-tight leading-tight">Dashboard</h1>
          <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-ivory-dim">Customers, astrologers, consultations, wallet volume and network pulse — in one command center.</p>
          <div className="mt-3 zari-line w-24" />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(30,122,84,0.25)] bg-[rgba(30,122,84,0.08)] px-3 py-1.5 text-[11px] font-bold text-[#1E7A54]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E7A54] animate-pulse" /> Live · updated just now
          </span>
        </div>
      </div>

      {demo && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[rgba(200,147,42,0.35)] bg-[rgba(200,147,42,0.09)] px-4 py-3 text-[12.5px] font-semibold text-[#8A6218]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(200,147,42,0.15)]">✦</span>
          Backend unreachable — showing sample data so you can review the design.
        </div>
      )}

      <div className="dashboard-command-center relative space-y-6">
      {error && !demo && <div className="flex gap-3 rounded-2xl border border-[rgba(179,64,46,0.25)] bg-[rgba(179,64,46,0.08)] px-5 py-4 text-[14px] text-[#96291B]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

      {data && (
        <>
          {/* HERO — deep peacock silk panel */}
          <section className="hero-glow sheen-sweep relative overflow-hidden rounded-[28px] border border-[rgba(227,178,60,0.22)] hero-green p-7 sm:p-9 lg:p-11 shadow-[0_20px_70px_rgba(10,53,46,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
            <div className="motif pointer-events-none absolute inset-0 opacity-[0.14]" />
            <div className="pointer-events-none absolute -right-[16%] -top-[30%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(227,178,60,0.16),transparent_68%)]" />
            <div className="pointer-events-none absolute -left-[8%] bottom-[-25%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(30,122,84,0.22),transparent_68%)]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(227,178,60,0.4)] bg-[rgba(227,178,60,0.10)] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#EBCE7E] shadow-[0_0_24px_rgba(227,178,60,0.10)]">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3B23C] opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E3B23C]"></span></span>
                  Console · Live
                </div>
                <h1 className="mt-5 font-display text-[30px] sm:text-[38px] lg:text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-[#F9F1DC]">
                  <em className="font-medium italic text-[#EBCE7E]">{greeting()}</em>
                  {name ? `, ${name}` : ''} <span className="text-[rgba(235,206,126,0.7)] text-[0.65em] align-top">✦</span>
                </h1>
                <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.65] text-[rgba(247,237,215,0.72)]">{today} — here's what's happening across your celestial marketplace, at a glance.</p>

                {attention.length>0 ? (
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(227,178,60,0.4)] bg-[rgba(227,178,60,0.10)] px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#EBCE7E]"><IconAlert /> Needs attention</span>
                    {attention.map(a=>(
                      <Link key={a.to} to={a.to} className="group inline-flex items-center gap-3 rounded-full border border-[rgba(247,237,215,0.16)] bg-[rgba(255,253,246,0.07)] backdrop-blur-xl px-5 py-3 text-[13px] font-semibold text-[#F7EDD7] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:border-[rgba(227,178,60,0.5)] hover:bg-[rgba(255,253,246,0.12)] no-underline">
                        <span className="text-[#EBCE7E]">{a.icon}</span> <b className="font-mono text-[#F0C763] text-[14px]">{a.n.toLocaleString('en-IN')}</b> {a.label} <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(255,253,246,0.1)] border border-[rgba(227,178,60,0.3)] group-hover:bg-[#E3B23C] group-hover:text-[#33240A] transition-colors"><IconArrowRight /></span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[rgba(63,191,139,0.4)] bg-[rgba(63,191,139,0.12)] px-4 py-2 text-[12px] font-medium text-[#7DE0B5]">
                    <IconCheck /> All clear — no pending actions
                  </div>
                )}
              </div>

              {/* Live pulse card */}
              <div className="relative flex items-center justify-center lg:min-h-[320px]">
                <div className="pointer-events-none absolute h-[280px] w-[280px] rounded-full border border-[rgba(227,178,60,0.2)] [transform:rotate(-22deg)] before:absolute before:inset-[-18px] before:rounded-full before:border before:border-[rgba(227,178,60,0.12)] before:[transform:rotate(52deg)] after:absolute after:inset-[24px] after:rounded-full after:border after:border-[rgba(63,191,139,0.18)] after:[transform:rotate(78deg)]">
                  <span className="absolute -right-1 top-1/2 h-3 w-3 rounded-full bg-[#E3B23C] shadow-[0_0_20px_6px_rgba(227,178,60,0.45)]" />
                  <span className="absolute bottom-7 left-8 h-2.5 w-2.5 rounded-full bg-[#D98A7F] shadow-[0_0_18px_5px_rgba(192,91,60,0.4)]" />
                </div>
                <div className="relative w-full rounded-[24px] border border-[rgba(227,178,60,0.22)] bg-[rgba(255,253,246,0.06)] backdrop-blur-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_40px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[rgba(247,237,215,0.6)]"><span className="relative grid h-2.5 w-2.5 place-items-center"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-[#3FBF8B]/60"/><span className="relative h-2.5 w-2.5 rounded-full bg-[#3FBF8B] shadow-[0_0_12px_rgba(63,191,139,0.8)]"/></span> Live pulse</div>
                    <span className="rounded-full border border-[rgba(227,178,60,0.35)] bg-[rgba(227,178,60,0.12)] px-3 py-1 text-[10px] font-mono font-bold text-[#EBCE7E]">LIVE</span>
                  </div>
                  <div className="mt-5 grid gap-4">
                    {[
                      { label:'astrologers online', value:data.online_astrologers.toLocaleString('en-IN'), sub:`${progressOnline}% of network`, dot:'bg-[#3FBF8B]', bar: progressOnline },
                      { label:'sessions active', value:data.active_sessions.toLocaleString('en-IN'), sub: data.active_sessions>0 ? 'Live consultations ongoing' : 'No active calls', dot:'bg-[#E3B23C]', bar: Math.min(data.active_sessions*12,100) },
                      { label:'wallet volume today', value: todayVolume==null ? '—' : inr(todayVolume), sub: 'Gross transaction volume', dot:'bg-[#D98A7F]', gold:true, bar: 72 },
                    ].map(r=>(
                      <div key={r.label}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`h-3 w-3 rounded-full ${r.dot} shadow-[0_0_12px_currentColor]`} />
                            <div><div className={`kpi-num text-[22px] font-bold leading-none ${r.gold ? 'text-[#F0C763]' : 'text-[#F9F1DC]'}`}>{r.value}</div><div className="mt-1 text-[10.5px] uppercase tracking-wide text-[rgba(247,237,215,0.55)]">{r.label}</div></div>
                          </div>
                          <div className="text-[10px] font-mono text-[rgba(247,237,215,0.45)]">{r.bar}%</div>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,253,246,0.1)] border border-[rgba(255,253,246,0.06)]">
                          <div className={`h-full rounded-full transition-all duration-1000 ${r.dot} shadow-[0_0_10px_currentColor]`} style={{ width: `${r.bar}%` }} />
                        </div>
                        <div className="mt-2 text-[11px] text-[rgba(247,237,215,0.5)]">{r.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Link to="/astrologers" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F0C763] to-[#C8932A] text-[#33240A] text-[12px] font-extrabold shadow-[0_4px_16px_rgba(227,178,60,0.3)] hover:brightness-110 transition-all no-underline">View astrologers →</Link>
                    <Link to="/wallet" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[rgba(247,237,215,0.2)] bg-[rgba(255,253,246,0.06)] text-[#F7EDD7] text-[12px] font-semibold hover:bg-[rgba(255,253,246,0.12)] transition-colors no-underline">Financials</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Customers" value={data.customers} to="/customers" tint="peacock" icon={<IconUsers/>} sub="Registered seekers" trend="+8%" />
            <KpiCard label="Astrologers" value={data.astrologers} to="/astrologers" tint="gold" icon={<IconStar/>} sub={data.online_astrologers>0 ? `${data.online_astrologers} online now` : 'No one online'} subDot={data.online_astrologers>0 ? '#1E7A54' : undefined} trend="+3%" />
            <KpiCard label="Consultations" value={data.consultations} to="/sessions" tint="terracotta" icon={<IconChat/>} sub={data.active_sessions>0 ? `${data.active_sessions} live sessions` : 'No live sessions'} subDot={data.active_sessions>0 ? '#B3402E' : undefined} trend="+12%" />
            <KpiCard label="Coupons" value={data.coupons} to="/coupons" tint="rose" icon={<IconTicket/>} sub="Active promo codes" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 sm:p-7 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] lg:col-span-8">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.5)] to-transparent" />
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(14,79,69,0.09)] border border-[rgba(14,79,69,0.22)] text-[#0E4F45]"><IconBarChart /></div>
                  <div><h3 className="font-display text-[16px] font-semibold tracking-tight">Wallet volume</h3><p className="text-[12px] text-ivory-faint">Daily gross across all transactions</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border-mid bg-surface-1 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wide text-ivory-dim">₹ / day · 14d</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[rgba(30,122,84,0.08)] border border-[rgba(30,122,84,0.25)] px-3 py-1.5 text-[11px] font-bold text-[#1E7A54]"><span className="h-1.5 w-1.5 rounded-full bg-[#1E7A54] animate-pulse"/>Live data</span>
                </div>
              </div>
              {series ? <LineChart data={series.amount} formatValue={inr} /> : <div className="grid place-items-center rounded-2xl border border-dashed border-border-mid bg-surface-1 p-10 text-[14px] text-ivory-faint">Loading…</div>}
            </section>
            <section className="relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 sm:p-7 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] lg:col-span-4">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.5)] to-transparent" />
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(200,147,42,0.10)] border border-[rgba(200,147,42,0.28)] text-[#A87A1D]"><IconGlobe /></div>
                  <div><h3 className="font-display text-[16px] font-semibold tracking-tight">Network</h3><p className="text-[12px] text-ivory-faint">{data.astrologers.toLocaleString('en-IN')} total astrologers</p></div>
                </div>
                <span className="rounded-full border border-border-mid bg-surface-1 px-3 py-1 font-mono text-[10px] font-bold text-ivory-dim">{progressOnline}% online</span>
              </div>
              <DonutChart centerSub="astrologers" slices={[{label:'Online now', value:data.online_astrologers, color:'#1E7A54'},{label:'KYC pending', value:data.pending_approvals, color:'#C8932A'},{label:'Registered', value:Math.max(data.astrologers - data.online_astrologers - data.pending_approvals,0), color:'#0E4F45'}]} />
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  { k:'Online', v:data.online_astrologers, dot:'bg-[#1E7A54]' },
                  { k:'Pending', v:data.pending_approvals, dot:'bg-[#C8932A]' },
                  { k:'Total', v:data.astrologers, dot:'bg-[#0E4F45]' }
                ].map(s=>(
                  <div key={s.k} className="rounded-2xl bg-surface-1 border border-border-soft px-2 py-3">
                    <div className="kpi-num text-[20px] font-bold leading-none">{s.v}</div>
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ivory-faint"><span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.k}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 sm:p-7 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] lg:col-span-7">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.5)] to-transparent" />
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(192,91,60,0.10)] border border-[rgba(192,91,60,0.26)] text-[#B3402E]"><IconCalendar /></div>
                  <div><h3 className="font-display text-[16px] font-semibold tracking-tight">Daily transactions</h3><p className="text-[12px] text-ivory-faint">Count per day · last 14 days</p></div>
                </div>
                <span className="rounded-full border border-border-mid bg-surface-1 px-3 py-1.5 font-mono text-[10px] font-bold text-ivory-dim">count / day</span>
              </div>
              {series ? <BarChart data={series.count} formatValue={v=>v.toLocaleString('en-IN')} /> : <div className="grid place-items-center rounded-2xl border border-dashed border-border-mid bg-surface-1 p-10 text-[14px] text-ivory-faint">Loading…</div>}
            </section>
            <section className="relative flex flex-col overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 sm:p-7 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] lg:col-span-5">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,147,42,0.5)] to-transparent" />
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(166,58,94,0.09)] border border-[rgba(166,58,94,0.24)] text-[#A63A5E]"><IconUsers /></div>
                  <div><h3 className="font-display text-[16px] font-semibold tracking-tight">Latest activity</h3><p className="text-[12px] text-ivory-faint">Recent wallet movements</p></div>
                </div>
                <Link to="/wallet-transactions" className="rounded-full bg-gradient-to-r from-[#0E4F45] to-[#1E8C78] text-[#FFFDF6] px-4 py-1.5 text-[11px] font-bold no-underline hover:brightness-110 transition-all">View all</Link>
              </div>
              {series==null ? <div className="grid place-items-center rounded-2xl border border-dashed border-border-mid bg-surface-1 p-10 text-[14px] text-ivory-faint">Loading…</div> : txns.length===0 ? <div className="py-10 text-center text-[14px] text-ivory-faint">No recent transactions.</div> : (
                <div className="divide-y divide-border-soft -mx-1">
                  {txns.map((t,i)=>{
                    const dir=txnDir(t.type); const amt=Math.abs(Number(t.amount)||0)
                    const chip = dir==='cr' ? 'bg-[rgba(30,122,84,0.09)] text-[#1E7A54] border-[rgba(30,122,84,0.25)]' : dir==='dr' ? 'bg-[rgba(179,64,46,0.09)] text-[#B3402E] border-[rgba(179,64,46,0.25)]' : 'bg-[rgba(200,147,42,0.10)] text-[#A87A1D] border-[rgba(200,147,42,0.28)]'
                    return (
                      <div key={i} className="flex items-center gap-4 py-4 px-2 group hover:bg-surface-1 rounded-2xl transition-colors">
                        <span className={`grid h-11 w-11 place-items-center rounded-[13px] font-mono text-[15px] font-bold border shadow-sm group-hover:scale-105 transition-transform ${chip}`}>{dir==='cr'?'+':dir==='dr'?'−':'•'}</span>
                        <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold capitalize">{(t.type??'transaction').replace(/_/g,' ')}</div><div className="flex items-center gap-2 text-[11px] text-ivory-faint mt-1"><span className="h-1 w-1 rounded-full bg-[rgba(200,147,42,0.6)]"/>{relTime(t.created_at)}</div></div>
                        <span className={`font-mono text-[13px] font-bold px-3 py-1.5 rounded-full border ${chip}`}>{dir==='cr'?'+':dir==='dr'?'−':''}{inrCompact(amt)}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-auto pt-6">
                <div className="relative overflow-hidden rounded-2xl hero-green border border-[rgba(227,178,60,0.22)] p-5 flex items-center justify-between shadow-[0_8px_28px_rgba(10,53,46,0.3)]">
                  <div className="motif pointer-events-none absolute inset-0 opacity-[0.12]" />
                  <div className="relative flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#F0C763] to-[#B07D1F] text-[#33240A] font-bold shadow-[0_4px_16px_rgba(227,178,60,0.35)]"><IconSparkle /></div>
                    <div className="text-[#F7EDD7]"><div className="text-[13px] font-bold">Pro tip</div><div className="text-[12px] text-[rgba(247,237,215,0.65)]">Check KYC queue daily for faster approvals.</div></div>
                  </div>
                  <Link to="/approval" className="relative grid h-9 w-9 place-items-center rounded-full bg-[rgba(227,178,60,0.18)] border border-[rgba(227,178,60,0.35)] text-[#EBCE7E] no-underline hover:bg-[#E3B23C] hover:text-[#33240A] transition-colors"><IconArrowRight /></Link>
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
