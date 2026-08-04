import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { MaintenanceApp, MaintenanceSetting } from '../api/types'
import { PageHeader, Card } from '../components/ui/PageShell'

const APPS: { app:MaintenanceApp; label:string; hint:string; icon:string }[]=[
  { app:'user', label:'User App', hint:'Customer-facing app maintenance — blocks all user traffic with custom message.', icon:'📱' },
  { app:'astro', label:'Astrologer App', hint:'Astrologer-facing app maintenance — shows maintenance screen to astrologers.', icon:'🔮' },
]
const EMPTY: MaintenanceSetting={ enabled:false, message:'' }

export default function MaintenancePage(){
  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Maintenance" subtitle="Independently put user and astrologer apps into maintenance mode with custom messages. Changes propagate instantly via remote config." icon={<span className="text-[18px]">🛠️</span>} />
      <div className="grid gap-5 md:grid-cols-2">
        {APPS.map(a=><AppCard key={a.app} app={a.app} label={a.label} hint={a.hint} icon={a.icon} />)}
      </div>
    </div>
  )
}

function AppCard({app,label,hint,icon}:{app:MaintenanceApp; label:string; hint:string; icon:string}){
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
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-1 border border-border-soft text-[20px]">{icon}</div><div><h3 className="text-[15px] font-bold">{label}</h3><p className="mt-1 text-[12px] leading-relaxed text-ivory-faint max-w-[28ch]">{hint}</p></div></div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${value.enabled ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>{value.enabled?'maintenance':'live'}</span>
      </div>
      {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</div>}
      {saved && <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-400">✓ Saved — clients will see update on next fetch.</div>}
      <label className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface-1 p-4 cursor-pointer hover:bg-surface-2 transition-colors">
        <span className="text-[13px] font-medium">Maintenance enabled</span>
        <input type="checkbox" checked={value.enabled} onChange={e=>setValue({...value,enabled:e.target.checked})} className="h-5 w-5 rounded" />
      </label>
      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Message<textarea rows={3} value={value.message} placeholder="We'll be back shortly… upgrades in progress." onChange={e=>setValue({...value,message:e.target.value})} className="mt-2 w-full rounded-xl border border-border-soft bg-surface-1 p-3.5 text-[13px] outline-none focus:border-saffron focus:bg-surface-2 resize-none" /></label>
      <button disabled={saving} onClick={save} className="mt-5 h-11 w-full rounded-xl bg-ivory text-bg-0 text-[13px] font-bold hover:bg-white disabled:opacity-50 shadow-sm">{saving?'Saving…':'Save configuration'}</button>
    </Card>
  )
}
