import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { adminApi } from '../api/endpoints'
import { StatusBadge } from './Badge'
import type { AstrologerDetail, CustomerDetail } from '../api/types'

const money = (v: unknown) => `₹${v ?? '0.00'}`
const dateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : '—')
const dateOnly = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : '—')
const text = (v: unknown) => (v==null||v==='' ? <span className="text-ivory-faint">—</span> : String(v))
function durationLabel(s: unknown){ const n=Number(s); if(!Number.isFinite(n)||n<=0) return '—'; const m=Math.floor(n/60); const sec=Math.round(n%60); return m>0?`${m}m ${sec}s`:`${sec}s` }

export type DetailKind = 'customer' | 'astrologer'
interface Props { kind: DetailKind; id: string|null|undefined; onClose:()=>void }

export function DetailDrawer({ kind, id, onClose }: Props) {
  const [customer, setCustomer] = useState<CustomerDetail|null>(null)
  const [astrologer, setAstrologer] = useState<AstrologerDetail|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const load = useCallback(async()=>{
    if(!id) return
    setLoading(true); setError(null); setCustomer(null); setAstrologer(null)
    try{
      if(kind==='customer') setCustomer(await adminApi.customerDetail(id))
      else setAstrologer(await adminApi.astrologerDetail(id))
    } catch(e){ setError((e as Error).message) } finally{ setLoading(false) }
  },[kind,id])

  useEffect(()=>{ void load() },[load])
  useEffect(()=>{ if(!id) return; const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn) },[id,onClose])
  if(!id) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xl p-0 sm:p-4 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="flex max-h-[96vh] sm:max-h-[90vh] w-full sm:max-w-[860px] animate-pop-in flex-col overflow-hidden rounded-t-[28px] sm:rounded-[24px] border border-border-mid bg-surface-raised shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={e=>e.stopPropagation()}>
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1"><div className="h-1.5 w-10 rounded-full bg-border-soft" /></div>
        <div className="flex items-center justify-between border-b border-border-soft px-5 sm:px-6 py-4 shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-1 border border-border-soft">{kind==='customer' ? '👤' : '🔮'}</div>
            <h3 className="text-[15px] font-bold tracking-tight">{kind==='customer' ? 'Customer details' : 'Astrologer details'}</h3>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory-dim hover:bg-surface-2 hover:text-ivory transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading && <div className="py-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border-soft border-t-saffron" /><div className="mt-3 text-[13px] text-ivory-faint">Loading details…</div></div>}
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-[13px] text-red-300">{error}</div>}
          {!loading && !error && customer && <CustomerBody data={customer} />}
          {!loading && !error && astrologer && <AstrologerBody data={astrologer} />}
        </div>
        <div className="border-t border-border-soft/60 px-5 sm:px-6 py-3 bg-surface-1/50 flex justify-between items-center">
          <span className="text-[11px] text-ivory-faint">Press ESC to close • Details are read-only</span>
          <button onClick={onClose} className="h-8 rounded-full border border-border-soft bg-surface-raised px-4 text-[12px] font-semibold">Close</button>
        </div>
      </div>
    </div>
  )
}

function Section({ children }: { children: ReactNode }) { return <div className="mt-7 text-[11px] font-bold uppercase tracking-[0.1em] text-ivory-faint border-b border-border-soft/60 pb-2.5 flex items-center gap-2"><span className="h-px w-6 bg-border-soft"/>{children}</div> }
function Stat({ label, value }: { label:string; value:string }) {
  return <div className="rounded-[14px] border border-border-soft bg-surface-1 p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-ivory-faint">{label}</div><div className="mt-1.5 font-display text-[20px] font-bold tracking-tight text-amber-300">{value}</div></div>
}

function CustomerBody({ data }: { data: CustomerDetail }) {
  const { profile, wallet, transactions, consultations } = data
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-[18px] border border-border-soft bg-surface-1 p-4">
        <div className="flex gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 text-[16px] font-bold text-violet-400">{(profile.name||'U')[0].toUpperCase()}</div><div><div className="text-[18px] font-bold tracking-tight">{profile.name ?? 'Unnamed customer'}</div><div className="mt-1 font-mono text-[11px] text-ivory-faint">{profile.mobile ?? '—'}{profile.email ? ` · ${profile.email}` : ''}</div></div></div>
        <span className={`self-start rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${profile.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{profile.is_active ? 'active' : 'inactive'}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[16px] border border-border-soft bg-surface-1 p-4 text-[13px] sm:grid-cols-[130px_1fr] [&>.k]:text-[11px] [&>.k]:font-bold [&>.k]:uppercase [&>.k]:tracking-wide [&>.k]:text-ivory-faint">
        <div className="k">Language</div><div>{text(profile.language)}</div>
        <div className="k">Gender</div><div>{text(profile.gender)}</div>
        <div className="k">DOB</div><div>{dateOnly(profile.dob)}</div>
        <div className="k">Birth place</div><div>{text(profile.birth_place)}</div>
        <div className="k">Joined</div><div>{dateTime(profile.created_at)}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Wallet" value={money(wallet.balance)} />
        <Stat label="Credited" value={money(wallet.total_credit)} />
        <Stat label="Debited" value={money(wallet.total_debit)} />
        <Stat label="Spent" value={money(consultations.total_spent)} />
      </div>

      <Section>Recent transactions</Section>
      <div className="mt-3 overflow-hidden rounded-xl border border-border-soft">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-1 text-[11px] uppercase tracking-wide text-ivory-faint"><tr><th className="px-3 py-2.5 text-left">Type</th><th className="px-3 py-2.5 text-left">Amount</th><th className="px-3 py-2.5 text-left">Balance</th><th className="px-3 py-2.5 text-left">When</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">{transactions.length===0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-ivory-faint">No records</td></tr> : transactions.map(t=><tr key={t.id} className="hover:bg-surface-1/50"><td className="px-3 py-2.5">{text(t.type)}</td><td className="px-3 py-2.5 font-mono font-bold">{money(t.amount)}</td><td className="px-3 py-2.5">{money(t.balance_after)}</td><td className="px-3 py-2.5 text-ivory-faint">{dateTime(t.created_at)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="sm:hidden divide-y divide-border-soft/60">
          {transactions.length===0 ? <div className="py-8 text-center text-[13px] text-ivory-faint">No records</div> : transactions.map(t=><div key={t.id} className="p-3 flex justify-between text-[12px]"><span>{text(t.type)}</span><span className="font-bold">{money(t.amount)}</span></div>)}
        </div>
      </div>

      <Section>Consultations ({consultations.completed}/{consultations.total})</Section>
      <div className="mt-3 overflow-hidden rounded-xl border border-border-soft">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-1 text-[11px] uppercase tracking-wide text-ivory-faint"><tr><th className="px-3 py-2.5 text-left">Astrologer</th><th className="px-3 py-2.5 text-left">Type</th><th className="px-3 py-2.5 text-left">Charged</th><th className="px-3 py-2.5 text-left">When</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">{consultations.recent.length===0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-ivory-faint">No records</td></tr> : consultations.recent.map(c=><tr key={c.id} className="hover:bg-surface-1/50"><td className="px-3 py-2.5">{text(c.astrologer_name)}</td><td className="px-3 py-2.5">{text(c.type)}</td><td className="px-3 py-2.5">{money(c.amount_charged)}</td><td className="px-3 py-2.5 text-ivory-faint">{dateTime(c.created_at)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="sm:hidden divide-y divide-border-soft/60">
          {consultations.recent.length===0 ? <div className="py-8 text-center text-ivory-faint">No records</div> : consultations.recent.map(c=><div key={c.id} className="p-3 flex justify-between text-[12px]"><span>{text(c.astrologer_name)}</span><span className="font-bold">{money(c.amount_charged)}</span></div>)}
        </div>
      </div>
    </div>
  )
}

function AstrologerBody({ data }: { data: AstrologerDetail }) {
  const { profile, kyc, earnings, consultations, payouts } = data
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-[18px] border border-border-soft bg-surface-1 p-4">
        <div className="flex gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/20 font-bold text-amber-400">{(profile.display_name||'A')[0].toUpperCase()}</div><div><div className="text-[18px] font-bold tracking-tight">{profile.display_name ?? 'Unnamed astrologer'}</div><div className="mt-1 font-mono text-[11px] text-ivory-faint">{profile.mobile ?? '—'}{profile.email ? ` · ${profile.email}` : ''}</div></div></div>
        <div className="flex gap-2"><StatusBadge status={profile.kyc_status} /><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${profile.is_online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-2 text-ivory-faint border-border-soft'}`}>{profile.is_online ? 'online' : 'offline'}</span></div>
      </div>

      <div className="mt-4 grid gap-2.5 rounded-[16px] border border-border-soft bg-surface-1 p-4 text-[13px] sm:grid-cols-[130px_1fr] [&>.k]:text-[11px] [&>.k]:font-bold [&>.k]:uppercase [&>.k]:text-ivory-faint">
        <div className="k">Skills</div><div>{profile.skills?.length ? profile.skills.join(', ') : <span className="text-ivory-faint">—</span>}</div>
        <div className="k">Languages</div><div>{profile.languages?.length ? profile.languages.join(', ') : <span className="text-ivory-faint">—</span>}</div>
        <div className="k">Experience</div><div>{profile.years_experience!=null ? `${profile.years_experience} yrs` : <span className="text-ivory-faint">—</span>}</div>
        <div className="k">Rates</div><div className="font-mono text-[12px]">Chat {money(profile.rate_chat_per_msg)}/msg · Call {money(profile.rate_call_per_min)}/min · Video {money(profile.rate_video_per_min)}/min</div>
        <div className="k">Rating</div><div>⭐ {profile.avg_rating} ({profile.review_count} reviews) · {profile.followers} followers</div>
        <div className="k">Bio</div><div className="leading-relaxed">{text(profile.bio)}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Available" value={money(earnings.available_balance)} />
        <Stat label="Earned" value={money(earnings.earned_consultations)} />
        <Stat label="Super chat" value={money(earnings.live_super_chat_gross)} />
        <Stat label="Gifts" value={money(earnings.live_gift_gross)} />
        <Stat label="Paid out" value={money(earnings.total_paid_out)} />
        <Stat label="Pending payouts" value={String(earnings.pending_payout_requests)} />
      </div>

      {kyc && (
        <>
          <Section>KYC Verification</Section>
          <div className="mt-3 grid gap-2.5 rounded-[16px] border border-border-soft bg-surface-1 p-4 text-[13px] sm:grid-cols-[130px_1fr] [&>.k]:text-[11px] [&>.k]:font-bold [&>.k]:uppercase [&>.k]:text-ivory-faint">
            <div className="k">Full name</div><div className="font-semibold">{text(kyc.full_name)}</div>
            <div className="k">DOB</div><div>{dateOnly(kyc.dob)}</div>
            <div className="k">PAN / Aadhaar</div><div className="font-mono text-[12px]">{text(kyc.pan_number)} {kyc.aadhaar_last4 ? `· •••• ${kyc.aadhaar_last4}` : ''}</div>
            <div className="k">Bank</div><div className="font-mono text-[12px]">{kyc.bank_account_holder ?? ''} {kyc.bank_account_last4 ? `•••• ${kyc.bank_account_last4}` : '—'} {kyc.bank_ifsc ?? ''}</div>
            <div className="k">Submitted / Reviewed</div><div className="text-[12px]">{dateTime(kyc.submitted_at)} / {dateTime(kyc.reviewed_at)}</div>
            <div className="k">Notes</div><div>{text(kyc.reviewer_notes)}</div>
          </div>
        </>
      )}

      <Section>Recent payouts</Section>
      <div className="mt-3 overflow-hidden rounded-xl border border-border-soft">
        <table className="w-full text-[12.5px]"><thead className="bg-surface-1 text-[11px] uppercase text-ivory-faint"><tr><th className="px-3 py-2.5 text-left">Amount</th><th className="px-3 py-2.5 text-left">Status</th><th className="px-3 py-2.5 text-left">When</th></tr></thead>
        <tbody className="divide-y divide-border-soft/60">{payouts.recent.length===0 ? <tr><td colSpan={3} className="py-8 text-center text-ivory-faint">No records</td></tr> : payouts.recent.map(p=><tr key={p.id}><td className="px-3 py-2.5 font-bold">{money(p.amount)}</td><td className="px-3 py-2.5">{text(p.status)}</td><td className="px-3 py-2.5 text-ivory-faint">{dateTime(p.created_at)}</td></tr>)}</tbody></table>
      </div>

      <Section>Recent consultations</Section>
      <div className="mt-3 overflow-hidden rounded-xl border border-border-soft">
        <table className="w-full text-[12.5px]"><thead className="bg-surface-1 text-[11px] uppercase text-ivory-faint"><tr><th className="px-3 py-2.5 text-left">Customer</th><th className="px-3 py-2.5 text-left">Type</th><th className="px-3 py-2.5 text-left">Charged</th><th className="px-3 py-2.5 text-left">Duration</th></tr></thead>
        <tbody className="divide-y divide-border-soft/60">{consultations.recent.length===0 ? <tr><td colSpan={4} className="py-8 text-center text-ivory-faint">No records</td></tr> : consultations.recent.map(c=><tr key={c.id}><td className="px-3 py-2.5">{text(c.user_name)}</td><td className="px-3 py-2.5">{text(c.type)}</td><td className="px-3 py-2.5">{money(c.amount_charged)}</td><td className="px-3 py-2.5">{durationLabel(c.duration_seconds)}</td></tr>)}</tbody></table>
      </div>
    </div>
  )
}
