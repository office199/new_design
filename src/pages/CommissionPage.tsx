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
    <div className="page-shell space-y-6 max-w-[640px]">
      <PageHeader title="Platform Commission" subtitle="Share of every consultation the platform keeps. Affects astrologer payouts automatically." icon={<span className="text-[18px]">💹</span>} />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-400 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>Saved successfully.</div>}

      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div><div className="text-[12px] font-bold uppercase tracking-widest text-ivory-faint">Commission rate</div><div className="mt-1 text-[12px] text-ivory-faint">Applied to all payout splits</div></div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-400">Live setting</span>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div className="relative">
            <input type="number" min={0} max={100} step="0.1" value={percent} onChange={e=>{setSaved(false); setPercent(e.target.value)}} className="h-[56px] w-[180px] rounded-[16px] border border-border-soft bg-surface-1 px-5 pr-12 text-[22px] font-bold outline-none focus:border-saffron focus:bg-surface-2 shadow-sm" />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-bold text-ivory-faint">%</span>
          </div>
          <div className="rounded-xl bg-surface-1 border border-border-soft px-4 py-3 text-[12px]">
            <div className="text-ivory-faint text-[11px] uppercase font-bold tracking-wide">Stored as</div>
            <div className="font-mono font-bold mt-0.5">{(Number(percent)/100||0).toFixed(4)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/15 p-4 text-[12px] text-ivory-dim flex gap-3">
          <span className="text-[16px]">💡</span>
          <span>For example, 20% means platform keeps ₹20 on a ₹100 consultation, astrologer receives ₹80. This applies instantly to new sessions and payouts.</span>
        </div>

        <button disabled={saving} onClick={save} className="mt-6 h-11 rounded-xl bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white disabled:opacity-50 shadow-sm">{saving?'Saving…':'Save changes'}</button>
      </Card>
    </div>
  )
}
