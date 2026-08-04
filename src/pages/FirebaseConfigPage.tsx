import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { ApiError, downloadBlob } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { FirebaseServiceAccountStatus, MaintenanceApp } from '../api/types'
import { PageHeader, Card } from '../components/ui/PageShell'

const CLIENT_APPS: { app:MaintenanceApp; label:string; desc:string }[]=[
  {app:'user',label:'User App',desc:'Customer Android/iOS build config — google-services.json / GoogleService-Info.plist'},
  {app:'astro',label:'Astrologer App',desc:'Astrologer Android/iOS build config — separate Firebase project possible'}
]

export default function FirebaseConfigPage(){
  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Firebase Config" subtitle="Manage push notification service account and per-app client configs. Service account enables server push, client configs bake into mobile builds." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>} />

      <ServiceAccountSection />

      <div>
        <h2 className="text-[16px] font-bold tracking-tight">Client Config</h2>
        <p className="mt-1.5 text-[13px] text-ivory-faint">Updates file used in next mobile build — does not push to installed apps. Download current to verify.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {CLIENT_APPS.map(a=><ClientSection key={a.app} app={a.app} label={a.label} desc={a.desc} />)}
        </div>
      </div>
    </div>
  )
}

function ServiceAccountSection(){
  const [status,setStatus]=useState<FirebaseServiceAccountStatus|null>(null)
  const [error,setError]=useState<string|null>(null)
  const [uploading,setUploading]=useState(false)
  const [success,setSuccess]=useState<string|null>(null)

  const load=useCallback(async()=>{ try{ setStatus(await adminApi.firebaseServiceAccountStatus()); setError(null) } catch(e){ setError((e as Error).message) } },[])
  useEffect(()=>{ void load() },[load])

  async function handleFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    setUploading(true); setError(null); setSuccess(null)
    try{ const s=await adminApi.uploadFirebaseServiceAccount(file); setSuccess(`Uploaded — project "${s.project_id ?? '?'}" (${s.client_email ?? '?'})`); await load() }
    catch(err){ setError((err as Error).message) } finally{ setUploading(false); e.target.value='' }
  }

  const configured=status?.exists ?? null

  return (
    <Card className="p-7 max-w-[680px]">
      <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold">Service Account</h2><span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${configured?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-red-500/25 bg-red-500/12 text-red-400'}`}>{configured?'configured':'not configured'}</span></div>
      <p className="mt-2.5 text-[13px] text-ivory-dim leading-relaxed">Server credential for push notifications. Private key never displayed after upload. Used for FCM server sends.</p>
      {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {success && <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-emerald-400">{success}</div>}
      {configured && status && (
        <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-[13px]">
          <div className="flex justify-between"><span className="text-ivory-faint">Project ID</span><span className="font-mono font-bold">{status.project_id}</span></div>
          <div className="flex justify-between"><span className="text-ivory-faint">Client email</span><span className="font-mono truncate max-w-[180px]">{status.client_email}</span></div>
          <div className="flex justify-between"><span className="text-ivory-faint">Push enabled</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${status.push_enabled ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' : 'bg-white/6 text-ivory-faint border-white/10'}`}>{String(status.push_enabled)}</span></div>
        </div>
      )}
      <label className="mt-6 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">{configured?'Replace JSON — upload new service account':'Upload JSON service account'}<input type="file" accept="application/json,.json" onChange={handleFile} disabled={uploading} className="mt-2 block w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-pink-500 file:text-white file:px-4 file:py-1.5 file:text-[12px] file:font-bold" /></label>
      {uploading && <span className="mt-2 block text-[12px] text-ivory-faint">Uploading and validating…</span>}
    </Card>
  )
}

function ClientSection({app,label,desc}:{app:MaintenanceApp; label:string; desc:string}){
  const [configured,setConfigured]=useState<boolean|null>(null)
  const [filename,setFilename]=useState<string|null>(null)
  const [blob,setBlob]=useState<Blob|null>(null)
  const [error,setError]=useState<string|null>(null)
  const [uploading,setUploading]=useState(false)
  const [success,setSuccess]=useState<string|null>(null)

  const load=useCallback(async()=>{
    try{ const {blob: b, filename: fname}=await adminApi.downloadFirebaseClientConfig(app); setConfigured(true); setBlob(b); setFilename(fname ?? `${app}-google-services.json`); setError(null) }
    catch(e){ if(e instanceof ApiError && e.status===404){ setConfigured(false); setBlob(null); setFilename(null); setError(null) } else setError((e as Error).message) }
  },[app])
  useEffect(()=>{ void load() },[load])

  async function handleFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    setUploading(true); setError(null); setSuccess(null)
    try{ const r=await adminApi.uploadFirebaseClientConfig(app,file); setSuccess(r.project_id ? `Uploaded — project "${r.project_id}"` : 'Uploaded.'); await load() }
    catch(err){ setError((err as Error).message) } finally{ setUploading(false); e.target.value='' }
  }

  return (
    <Card className="p-7">
      <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold">{label}</h3><span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${configured?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-red-500/25 bg-red-500/12 text-red-400'}`}>{configured?'configured':'not configured'}</span></div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ivory-faint">{desc}</p>
      {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {success && <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-emerald-400">{success}</div>}
      {configured && <button onClick={()=> blob && downloadBlob(blob, filename ?? `${app}-google-services.json`)} className="mt-4 h-10 rounded-full border border-white/12 bg-white/6 backdrop-blur-xl px-5 text-[13px] font-semibold hover:bg-white/10 transition-colors">Download current config</button>}
      <label className="mt-5 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">{configured?'Replace file':'Upload file'}<input type="file" onChange={handleFile} disabled={uploading} className="mt-2 block w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-pink-500 file:text-white file:px-4 file:py-1.5 file:text-[12px] file:font-bold" /></label>
      {uploading && <span className="mt-2 block text-[12px] text-ivory-faint">Uploading…</span>}
    </Card>
  )
}
