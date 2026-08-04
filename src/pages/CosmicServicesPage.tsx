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
    <div className="page-shell space-y-6">
      <PageHeader title="Cosmic Services" subtitle="Pricing for Kundli, matchmaking and insight tiles. Toggle availability and update prices instantly." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707"/><circle cx="12" cy="12" r="4"/></svg>} />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}

      <Card className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-white/10 bg-white/4 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-4">Service</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/6">
              {rows.map(s=>(
                <tr key={s.key} className="hover:bg-white/4">
                  <td className="px-5 py-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/12 border border-violet-500/20 text-violet-400"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span><span className="font-semibold text-[14px]">{s.name}</span></div></td>
                  <td className="px-5 py-5"><div className="flex items-center gap-2"><span className="text-[12px] text-ivory-faint">₹</span><input value={drafts[s.key] ?? ''} onChange={e=>setDrafts({...drafts,[s.key]:e.target.value})} className="h-10 w-[130px] rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 text-[14px] font-bold outline-none focus:border-violet-400/50" /></div></td>
                  <td className="px-5 py-5"><span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${s.is_active?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-white/10 bg-white/6 text-ivory-faint'}`}>{s.is_active?'active':'off'}</span></td>
                  <td className="px-5 py-5 text-right"><div className="inline-flex gap-2"><button disabled={saving===s.key} onClick={()=>save(s)} className="h-9 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-4 text-[12px] font-bold hover:brightness-110 disabled:opacity-50 shadow-sm">{saving===s.key?'Saving…':'Save'}</button><button onClick={()=>toggle(s)} className={`h-9 rounded-full border px-4 text-[12px] font-bold backdrop-blur-xl ${s.is_active?'border-amber-500/25 bg-amber-500/12 text-amber-400':'border-emerald-500/25 bg-emerald-500/12 text-emerald-400'}`}>{s.is_active?'Disable':'Enable'}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {rows.map(s=>(
            <div key={s.key} className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between"><div className="font-semibold text-[15px]">{s.name}</div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${s.is_active?'bg-emerald-500/12 text-emerald-400 border-emerald-500/25':'bg-white/6 text-ivory-faint border-white/10'}`}>{s.is_active?'active':'off'}</span></div>
              <div className="mt-3 flex gap-2"><input value={drafts[s.key] ?? ''} onChange={e=>setDrafts({...drafts,[s.key]:e.target.value})} className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 text-[14px] font-bold" placeholder="Price" /><button onClick={()=>save(s)} className="h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white px-5 text-[12px] font-bold shadow-sm">Save</button></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
