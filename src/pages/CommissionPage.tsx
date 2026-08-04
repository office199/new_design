import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

interface Commission { rate:number }

export default function CommissionPage(){
  const [percent,setPercent]=useState('')
  const [error,setError]=useState<string|null>(null)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)

  const load=useCallback(async()=>{
    try{ const c=await api<Commission>('/admin/settings/commission'); setPercent(String(Math.round((Number(c.rate)||0)*10000)/100)); setError(null) }
    catch(e){ setError((e as Error).message) }
  },[])
  useEffect(()=>{ void load() },[load])

  async function save(){
    setError(null); setSaved(false)
    const pct=Number(percent)
    if(Number.isNaN(pct)||pct<0||pct>100){ setError('Commission must be 0-100%'); return }
    setSaving(true)
    try{ await api('/admin/settings/commission',{method:'PUT',body:{rate:pct/100}}); setSaved(true) }
    catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }

  return (
    <div className="page-shell space-y-6 max-w-[680px]">
      <PageHeader title="Platform Commission" subtitle="Share of every consultation the platform keeps. Affects astrologer payouts automatically." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}
      {saved && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-emerald-400 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>Saved successfully.</div>}

      <Card className="p-7 sm:p-8">
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ivory-faint">Commission rate</div><div className="mt-1 text-[13px] text-ivory-faint">Applied to all payout splits</div></div>
          <span className="rounded-full bg-amber-500/12 border border-amber-500/25 px-3 py-1.5 text-[11px] font-bold text-amber-400">Live setting</span>
        </div>

        <div className="mt-7 flex flex-wrap items-end gap-5">
          <div className="relative">
            <input type="number" min={0} max={100} step="0.1" value={percent} onChange={e=>{setSaved(false); setPercent(e.target.value)}} className="h-[60px] w-[200px] rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl px-5 pr-14 text-[24px] font-black outline-none focus:border-violet-400/50 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]" />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[20px] font-bold text-ivory-faint">%</span>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl px-5 py-3.5 text-[13px]">
            <div className="text-ivory-faint text-[11px] uppercase font-bold tracking-wide">Stored as</div>
            <div className="font-mono font-bold mt-1">{(Number(percent)/100||0).toFixed(4)}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 p-5 text-[13px] text-ivory-dim flex gap-3 backdrop-blur-xl">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>For example, 20% means platform keeps ₹20 on a ₹100 consultation, astrologer receives ₹80. This applies instantly to new sessions and payouts.</span>
        </div>

        <button disabled={saving} onClick={save} className="mt-7 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white px-7 text-[14px] font-bold hover:brightness-110 disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">{saving?'Saving…':'Save changes'}</button>
      </Card>
    </div>
  )
}
