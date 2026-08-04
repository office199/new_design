import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { MaintenanceApp, MaintenanceSetting } from '../api/types'
import { PageHeader, Card } from '../components/ui/PageShell'

const APPS: { app:MaintenanceApp; label:string; hint:string; icon:React.ReactNode }[]=[
  { app:'user', label:'User App', hint:'Customer-facing app maintenance — blocks all user traffic with custom message.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
  { app:'astro', label:'Astrologer App', hint:'Astrologer-facing app maintenance — shows maintenance screen to astrologers.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
]
const EMPTY: MaintenanceSetting={ enabled:false, message:'' }

export default function MaintenancePage(){
  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Maintenance" subtitle="Independently put user and astrologer apps into maintenance mode with custom messages. Changes propagate instantly via remote config." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>} />
      <div className="grid gap-5 md:grid-cols-2">
        {APPS.map(a=><AppCard key={a.app} app={a.app} label={a.label} hint={a.hint} icon={a.icon} />)}
      </div>
    </div>
  )
}

function AppCard({app,label,hint,icon}:{app:MaintenanceApp; label:string; hint:string; icon:React.ReactNode}){
  const [value,setValue]=useState<MaintenanceSetting>(EMPTY)
  const [error,setError]=useState<string|null>(null)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)

  const load=useCallback(async()=>{ try{ setValue(await adminApi.getMaintenance(app)); setError(null) } catch(e){ setError((e as Error).message) } },[app])
  useEffect(()=>{ void load() },[load])

  async function save(){
    setError(null); setSaved(false); setSaving(true)
    try{ const next=await adminApi.setMaintenance(app,value); setValue(next); setSaved(true); setTimeout(()=>setSaved(false),2500) }
    catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }

  return (
    <Card className="p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 border border-violet-500/20 text-violet-400">{icon}</div><div><h3 className="text-[16px] font-bold">{label}</h3><p className="mt-1.5 text-[13px] leading-relaxed text-ivory-faint max-w-[28ch]">{hint}</p></div></div>
        <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${value.enabled ? 'border-amber-500/25 bg-amber-500/12 text-amber-400' : 'border-emerald-500/25 bg-emerald-500/12 text-emerald-400'}`}>{value.enabled?'maintenance':'live'}</span>
      </div>
      {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {saved && <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-emerald-400">✓ Saved — clients will see update on next fetch.</div>}
      <label className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 cursor-pointer hover:bg-white/8 transition-colors">
        <span className="text-[14px] font-medium">Maintenance enabled</span>
        <input type="checkbox" checked={value.enabled} onChange={e=>setValue({...value,enabled:e.target.checked})} className="h-5 w-5 rounded" />
      </label>
      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Message<textarea rows={3} value={value.message} placeholder="We'll be back shortly… upgrades in progress." onChange={e=>setValue({...value,message:e.target.value})} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-[14px] outline-none focus:border-violet-400/50 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)] resize-none" /></label>
      <button disabled={saving} onClick={save} className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[14px] font-bold hover:brightness-110 disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">{saving?'Saving…':'Save configuration'}</button>
    </Card>
  )
}
