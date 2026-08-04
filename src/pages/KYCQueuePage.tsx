import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { KYCReviewItem, KYCStatus } from '../api/types'
import { StatusBadge } from '../components/Badge'
import { PageHeader, Card } from '../components/ui/PageShell'

const FILTERS: { label:string; value:KYCStatus|'' }[]=[{label:'Pending',value:'pending'},{label:'Approved',value:'approved'},{label:'Rejected',value:'rejected'},{label:'All',value:''}]

export default function KYCQueuePage(){
  const [filter,setFilter]=useState<KYCStatus|''>('pending')
  const [items,setItems]=useState<KYCReviewItem[]>([])
  const [error,setError]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [active,setActive]=useState<KYCReviewItem|null>(null)

  const load=useCallback(()=>{ setLoading(true); adminApi.listAstrologers(filter||undefined).then(setItems).catch(e=>setError(e.message)).finally(()=>setLoading(false)) },[filter])
  useEffect(()=>{ void load() },[load])

  async function decide(id:string, approve:boolean, notes:string){
    try{ if(approve) await adminApi.approve(id,notes); else await adminApi.reject(id,notes); setActive(null); load() }
    catch(e){ setError((e as Error).message) }
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="KYC Review"
        subtitle="Verify astrologer applications — check PAN, Aadhaar, bank proofs and approve or reject with audit notes."
        icon={<span className="text-[18px]">🪪</span>}
        actions={
          <div className="flex items-center gap-2 rounded-full border border-border-soft bg-surface-1 p-1 shadow-sm">
            {FILTERS.map(f=><button key={f.label} onClick={()=>setFilter(f.value)} className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all ${filter===f.value ? 'bg-ivory text-bg-0 shadow-sm border border-border-soft' : 'text-ivory-faint hover:text-ivory hover:bg-surface-2'}`}>{f.label}</button>)}
          </div>
        }
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      <Card className="overflow-hidden">
        {loading ? <div className="p-12 text-center text-[13px] text-ivory-faint">Loading KYC queue…</div> : items.length===0 ? <div className="p-16 text-center"><div className="grid place-items-center h-14 w-14 mx-auto rounded-2xl bg-surface-1 border border-border-soft">📭</div><div className="mt-3 font-semibold">No applications</div><div className="text-[13px] text-ivory-faint mt-1">No astrologers in this filter.</div></div> : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Applicant</th><th className="px-5 py-3.5">Contact</th><th className="px-5 py-3.5">PAN</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">Submitted</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-border-soft/60">
                  {items.map(it=>(
                    <tr key={it.astrologer_id} className="hover:bg-surface-1/50 transition-colors">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-400 font-bold text-[12px]">{(it.full_name||it.display_name||'A')[0].toUpperCase()}</div><div className="font-semibold text-[13.5px]">{it.full_name || it.display_name || <span className="text-ivory-faint">—</span>}</div></div></td>
                      <td className="px-5 py-4 font-mono text-[12px]">{it.mobile || '—'}</td>
                      <td className="px-5 py-4 font-mono text-[12px]"><span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1">{it.pan_number || '—'}</span></td>
                      <td className="px-5 py-4"><StatusBadge status={it.kyc_status} /></td>
                      <td className="px-5 py-4 text-[12px] text-ivory-faint">{it.submitted_at ? new Date(it.submitted_at).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-4 text-right"><button onClick={()=>setActive(it)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-soft bg-ivory text-bg-0 px-4 text-[12px] font-bold hover:bg-white transition-colors">Review →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="grid gap-3 p-3 md:hidden">
              {items.map(it=>(
                <div key={it.astrologer_id} className="rounded-[16px] border border-border-soft bg-surface-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-400 font-bold">{(it.full_name||'A')[0].toUpperCase()}</div><div><div className="font-semibold text-[14px]">{it.full_name || it.display_name || '—'}</div><div className="font-mono text-[11px] text-ivory-faint">{it.mobile || ''}</div></div></div>
                    <StatusBadge status={it.kyc_status} />
                  </div>
                  <button onClick={()=>setActive(it)} className="mt-3 w-full h-9 rounded-full bg-ivory text-bg-0 text-[12px] font-bold">Review application</button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {active && <ReviewModal item={active} onClose={()=>setActive(null)} onDecide={decide} />}
    </div>
  )
}

function ReviewModal({item,onClose,onDecide}:{item:KYCReviewItem; onClose:()=>void; onDecide:(id:string, approve:boolean, notes:string)=>void}){
  const [notes,setNotes]=useState('')
  const prof=item.professional as Record<string,unknown>
  const pending=item.kyc_status==='pending'
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-xl p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[560px] animate-pop-in rounded-[22px] border border-border-mid bg-surface-raised p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.5)]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-bold">{(item.full_name||'A')[0].toUpperCase()}</div><div><h3 className="text-[17px] font-bold">{item.full_name || item.display_name || 'Applicant'}</h3><p className="mt-1 font-mono text-[11px] text-ivory-faint">{item.mobile || ''} {item.email ? `· ${item.email}` : ''}</p></div></div>
          <StatusBadge status={item.kyc_status} />
        </div>

        <div className="mt-6 grid gap-3 rounded-[16px] border border-border-soft bg-surface-1 p-4 text-[13px] sm:grid-cols-[110px_1fr] [&>.k]:text-[11px] [&>.k]:font-bold [&>.k]:uppercase [&>.k]:text-ivory-faint">
          <div className="k">PAN</div><div className="font-mono text-[12px] font-semibold">{item.pan_number || '—'}</div>
          <div className="k">Aadhaar</div><div className="font-mono text-[12px]">{item.aadhaar_last4 ? `•••• ${item.aadhaar_last4}` : '—'}</div>
          <div className="k">Bank</div><div className="font-mono text-[12px]">{item.bank_account_last4 ? `•••• ${item.bank_account_last4}` : '—'} {item.bank_ifsc || ''}</div>
          <div className="k">Experience</div><div>{String(prof?.years_experience ?? '—')} yrs</div>
          <div className="k">Skills</div><div className="line-clamp-2">{Array.isArray(prof?.skills) ? (prof.skills as string[]).join(', ') : '—'}</div>
          <div className="k">Languages</div><div>{Array.isArray(prof?.languages) ? (prof.languages as string[]).join(', ') : '—'}</div>
        </div>

        {pending ? (
          <>
            <label className="mt-5 block text-[12px] font-semibold text-ivory-dim">Reviewer notes (optional)<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add context for audit trail…" className="mt-2 w-full rounded-xl border border-border-soft bg-surface-1 p-3.5 text-[13px] outline-none focus:border-saffron focus:bg-surface-2" /></label>
            <div className="mt-5 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px] font-medium">Cancel</button><button onClick={()=>onDecide(item.astrologer_id,false,notes)} className="h-10 rounded-full bg-red-500/10 border border-red-500/20 px-5 text-[13px] font-bold text-red-400 hover:bg-red-500/15">Reject</button><button onClick={()=>onDecide(item.astrologer_id,true,notes)} className="h-10 rounded-full bg-emerald-500 px-6 text-[13px] font-bold text-white hover:brightness-110">Approve</button></div>
          </>
        ) : <div className="mt-5 flex justify-end"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Close</button></div>}
      </div>
    </div>
  )
}
