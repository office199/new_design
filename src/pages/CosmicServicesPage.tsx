import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

interface Service { id:string; key:string; name:string; price:string; is_active:boolean }

export default function CosmicServicesPage(){
  const [rows,setRows]=useState<Service[]>([])
  const [error,setError]=useState<string|null>(null)
  const [drafts,setDrafts]=useState<Record<string,string>>({})
  const [saving,setSaving]=useState<string|null>(null)

  const load=useCallback(async()=>{
    try{ const list=await api<Service[]>('/admin/cosmic-services'); setRows(list); setDrafts(Object.fromEntries(list.map(s=>[s.key,s.price]))) }
    catch(e){ setError((e as Error).message) }
  },[])
  useEffect(()=>{ void load() },[load])

  async function save(s:Service){
    setSaving(s.key); setError(null)
    try{ await api(`/admin/cosmic-services/${s.key}`,{method:'PATCH',body:{price:drafts[s.key]}}); await load() }
    catch(e){ setError((e as Error).message) } finally{ setSaving(null) }
  }
  async function toggle(s:Service){ await api(`/admin/cosmic-services/${s.key}`,{method:'PATCH',body:{is_active:!s.is_active}}); await load() }

  return (
    <div className="space-y-6">
      <PageHeader title="Cosmic Services" subtitle="Pricing for Kundli, matchmaking and insight tiles. Toggle availability and update prices instantly." icon={<span className="text-[18px]">✨</span>} />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      <Card className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Service</th><th className="px-5 py-3.5">Price</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">
              {rows.map(s=>(
                <tr key={s.key} className="hover:bg-surface-1/50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 border border-violet-500/15">🔮</span><span className="font-semibold text-[13.5px]">{s.name}</span></div></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><span className="text-[12px] text-ivory-faint">₹</span><input value={drafts[s.key] ?? ''} onChange={e=>setDrafts({...drafts,[s.key]:e.target.value})} className="h-9 w-[120px] rounded-full border border-border-soft bg-surface-1 px-4 text-[13px] font-bold outline-none focus:border-saffron" /></div></td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${s.is_active?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-border-soft bg-surface-2 text-ivory-faint'}`}>{s.is_active?'active':'off'}</span></td>
                  <td className="px-5 py-4 text-right"><div className="inline-flex gap-2"><button disabled={saving===s.key} onClick={()=>save(s)} className="h-8 rounded-full bg-ivory text-bg-0 px-4 text-[12px] font-bold hover:bg-white disabled:opacity-50">{saving===s.key?'Saving…':'Save'}</button><button onClick={()=>toggle(s)} className={`h-8 rounded-full border px-4 text-[12px] font-bold ${s.is_active?'border-amber-500/20 bg-amber-500/10 text-amber-400':'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>{s.is_active?'Disable':'Enable'}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {rows.map(s=>(
            <div key={s.key} className="rounded-[16px] border border-border-soft bg-surface-1 p-4">
              <div className="flex items-center justify-between"><div className="font-semibold text-[14px]">{s.name}</div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${s.is_active?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-surface-2 text-ivory-faint border-border-soft'}`}>{s.is_active?'active':'off'}</span></div>
              <div className="mt-3 flex gap-2"><input value={drafts[s.key] ?? ''} onChange={e=>setDrafts({...drafts,[s.key]:e.target.value})} className="h-10 flex-1 rounded-xl border border-border-soft bg-surface-raised px-3 text-[13px] font-bold" placeholder="Price" /><button onClick={()=>save(s)} className="h-10 rounded-xl bg-ivory text-bg-0 px-4 text-[12px] font-bold">Save</button></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
