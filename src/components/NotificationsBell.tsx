import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface Overview { pending_approvals: number; pending_payouts: number; }

const POLL_MS = 60000

export default function NotificationsBell() {
  const [counts, setCounts] = useState<Overview | null>(null)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => { api<Overview>('/admin/overview').then(setCounts).catch(()=>{}) }, [])
  useEffect(()=>{ load() }, [load, location.pathname])
  useEffect(()=>{ const id=setInterval(load,POLL_MS); return()=>clearInterval(id) }, [load])
  useEffect(()=>{
    const fn=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn)
  },[])

  const kyc = counts?.pending_approvals ?? 0
  const payouts = counts?.pending_payouts ?? 0
  const total = kyc + payouts

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} className="relative grid h-9 w-9 place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory-dim transition-colors hover:bg-surface-2 hover:text-ivory hover:border-border-mid" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 6 5 6 10H0s6-3 6-10" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {total>0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-[0_0_10px_var(--color-danger-glow)]">{total>99?'99+':total}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[340px] max-w-[92vw] overflow-hidden rounded-2xl border border-border-mid bg-surface-raised shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-pop-in">
          <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
            <h4 className="text-[13px] font-semibold">Action required</h4>
            <span className="rounded-full bg-saffron-soft px-2 py-0.5 text-[11px] font-bold text-saffron">{total} pending</span>
          </div>

          {total===0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-success-bg text-success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="text-[13px] text-ivory-faint">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-2">
              {kyc>0 && (
                <button onClick={()=>{setOpen(false); navigate('/approval')}} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-1">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-bg text-gold border border-gold/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    <div><div className="text-[13px] font-medium">KYC submissions</div><div className="text-[11px] text-ivory-faint">Needs review</div></div>
                  </div>
                  <span className="rounded-full bg-gold-bg px-2.5 py-1 text-[12px] font-bold text-gold">{kyc}</span>
                </button>
              )}
              {payouts>0 && (
                <button onClick={()=>{setOpen(false); navigate('/payouts')}} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-1">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-saffron-soft text-saffron-bright border border-saffron/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 0 0 0 4h4v-4h-4z"/></svg></div>
                    <div><div className="text-[13px] font-medium">Payout requests</div><div className="text-[11px] text-ivory-faint">Awaiting approval</div></div>
                  </div>
                  <span className="rounded-full bg-saffron-soft px-2.5 py-1 text-[12px] font-bold text-saffron-bright">{payouts}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
