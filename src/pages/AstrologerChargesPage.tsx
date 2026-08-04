import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'
import { SearchBox } from '../components/ListControls'

interface Charge { id:string; name:string|null; chat_per_msg:string; call_per_min:string; video_per_min:string }
interface Draft { chat_per_msg:string; call_per_min:string; video_per_min:string }

export default function AstrologerChargesPage(){
  const [rows,setRows]=useState<Charge[]>([])
  const [drafts,setDrafts]=useState<Record<string,Draft>>({})
  const [error,setError]=useState<string|null>(null)
  const [savedId,setSavedId]=useState<string|null>(null)
  const [savingId,setSavingId]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const list=await api<Charge[]>('/admin/astrologers/charges')
      setRows(list)
      setDrafts(Object.fromEntries(list.map(c=>[c.id,{chat_per_msg:c.chat_per_msg,call_per_min:c.call_per_min,video_per_min:c.video_per_min}])))
      setError(null)
    }catch(e){ setError((e as Error).message) } finally{ setLoading(false) }
  },[])
  useEffect(()=>{ void load() },[load])

  const filtered = rows.filter(r=> !query.trim() || (r.name||'').toLowerCase().includes(query.toLowerCase()))

  function edit(id:string,key:keyof Draft,val:string){ setSavedId(null); setDrafts(d=>({...d,[id]:{...d[id],[key]:val}})) }
  async function save(c:Charge){
    const d=drafts[c.id]; if(!d) return
    setSavingId(c.id); setSavedId(null); setError(null)
    try{ await api(`/admin/astrologers/${c.id}/charges`,{method:'PATCH',body:{rate_chat_per_msg:Number(d.chat_per_msg)||0, rate_call_per_min:Number(d.call_per_min)||0, rate_video_per_min:Number(d.video_per_min)||0}}); setSavedId(c.id); await load() }
    catch(e){ setError((e as Error).message) } finally{ setSavingId(null) }
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Astrologer Pricing"
        subtitle="Edit per-astrologer chat, call and video rates. Changes apply instantly to new consultations."
        icon={<span className="text-[18px]">💲</span>}
        actions={<><SearchBox value={query} onChange={setQuery} placeholder="Search astrologer…" /><button onClick={load} className="h-[42px] rounded-full border border-border-soft bg-surface-raised px-5 text-[13px] font-semibold shadow-sm">↻ Refresh</button></>}
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      {loading && rows.length===0 ? <Card><div className="p-10 text-center text-ivory-faint">Loading pricing…</div></Card> : rows.length===0 ? <Card><div className="p-16 text-center text-ivory-faint">No approved astrologers.</div></Card> : (
        <Card className="overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Astrologer</th><th className="px-5 py-3.5">Chat / msg</th><th className="px-5 py-3.5">Call / min</th><th className="px-5 py-3.5">Video / min</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-border-soft/60">
                {filtered.map(c=>{
                  const d=drafts[c.id]
                  return (
                    <tr key={c.id} className="hover:bg-surface-1/50">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-saffron-soft border border-saffron/15 text-saffron font-bold text-[11px]">{(c.name||'A')[0].toUpperCase()}</div><span className="font-semibold text-[13.5px]">{c.name ?? <span className="text-ivory-faint">—</span>}</span></div></td>
                      <td className="px-5 py-4"><div className="relative w-[130px]"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-ivory-faint">₹</span><input value={d?.chat_per_msg ?? ''} onChange={e=>edit(c.id,'chat_per_msg',e.target.value)} className="h-9 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold outline-none focus:border-saffron focus:bg-surface-2" /></div></td>
                      <td className="px-5 py-4"><div className="relative w-[130px]"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-ivory-faint">₹</span><input value={d?.call_per_min ?? ''} onChange={e=>edit(c.id,'call_per_min',e.target.value)} className="h-9 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold outline-none focus:border-saffron" /></div></td>
                      <td className="px-5 py-4"><div className="relative w-[130px]"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-ivory-faint">₹</span><input value={d?.video_per_min ?? ''} onChange={e=>edit(c.id,'video_per_min',e.target.value)} className="h-9 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold outline-none focus:border-saffron" /></div></td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {savedId===c.id && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Saved</span>}
                          <button disabled={savingId===c.id} onClick={()=>save(c)} className="h-8 rounded-full bg-ivory text-bg-0 px-4 text-[12px] font-bold hover:bg-white disabled:opacity-50">{savingId===c.id?'Saving…':'Save'}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {filtered.map(c=>{
              const d=drafts[c.id]
              return (
                <div key={c.id} className="rounded-[16px] border border-border-soft bg-surface-1 p-4">
                  <div className="font-semibold text-[14px]">{c.name ?? '—'}</div>
                  <div className="mt-3 grid gap-2">
                    <label className="text-[11px]">Chat ₹<input value={d?.chat_per_msg ?? ''} onChange={e=>edit(c.id,'chat_per_msg',e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-raised px-3 text-[13px] font-bold" /></label>
                    <label className="text-[11px]">Call ₹<input value={d?.call_per_min ?? ''} onChange={e=>edit(c.id,'call_per_min',e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-raised px-3 text-[13px] font-bold" /></label>
                    <label className="text-[11px]">Video ₹<input value={d?.video_per_min ?? ''} onChange={e=>edit(c.id,'video_per_min',e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-raised px-3 text-[13px] font-bold" /></label>
                  </div>
                  <button disabled={savingId===c.id} onClick={()=>save(c)} className="mt-3 w-full h-10 rounded-xl bg-ivory text-bg-0 text-[12px] font-bold">{savingId===c.id?'Saving…':'Save pricing'}</button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
