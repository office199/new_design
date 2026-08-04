import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { AgoraDiagnoseResult } from '../api/types'
import { PageHeader, Card } from '../components/ui/PageShell'

interface AgoraSetting { id:string; app_name:string|null; app_id:string; app_certificate:string; token_expire_seconds:number; is_active:boolean }

export default function AgoraSettingsPage(){
  const [rows,setRows]=useState<AgoraSetting[]>([])
  const [error,setError]=useState<string|null>(null)
  const [appName,setAppName]=useState('')
  const [appId,setAppId]=useState('')
  const [cert,setCert]=useState('')
  const [expiry,setExpiry]=useState('3600')
  const [diagnosing,setDiagnosing]=useState(false)
  const [diagnose,setDiagnose]=useState<AgoraDiagnoseResult|null>(null)
  const [diagnoseError,setDiagnoseError]=useState<string|null>(null)

  const load=useCallback(async()=>{ try{ setRows(await api<AgoraSetting[]>('/admin/agora-settings')); setError(null) } catch(e){ setError((e as Error).message) } },[])
  useEffect(()=>{ void load() },[load])

  async function create(e:FormEvent){
    e.preventDefault(); setError(null)
    try{ await api('/admin/agora-settings',{method:'POST',body:{app_name:appName||null,app_id:appId.trim(),app_certificate:cert.trim(),token_expire_seconds:Number(expiry)||3600,is_active:rows.length===0}}); setAppName(''); setAppId(''); setCert(''); await load() }
    catch(err){ setError((err as Error).message) }
  }
  async function activate(id:string){ await api(`/admin/agora-settings/${id}/activate`,{method:'POST'}); await load() }
  async function remove(id:string){ await api(`/admin/agora-settings/${id}`,{method:'DELETE'}); await load() }
  async function runDiagnose(){
    setDiagnosing(true); setDiagnoseError(null)
    try{ setDiagnose(await adminApi.diagnoseAgora()) } catch(e){ setDiagnose(null); setDiagnoseError((e as Error).message) } finally{ setDiagnosing(false) }
  }
  const diagnoseOk=diagnose?.diagnosis.startsWith('OK')

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Agora Settings"
        subtitle="Manage Agora credentials for audio/video calls & live streaming. Only one active set is used for token generation."
        icon={<span className="text-[18px]">🎙️</span>}
        actions={<button onClick={runDiagnose} disabled={diagnosing} className="h-[42px] rounded-full border border-border-soft bg-surface-raised px-5 text-[13px] font-semibold shadow-sm hover:bg-surface-2 disabled:opacity-50">{diagnosing?'Testing…':'Test Connection'}</button>}
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {diagnoseError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">Diagnose failed: {diagnoseError}</div>}
      {diagnose && <div className={`rounded-xl border px-4 py-3 text-[13px] ${diagnoseOk ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}><b>{diagnoseOk?'Connection OK':'Connection problem'}</b> — {diagnose.diagnosis}</div>}

      <Card className="p-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-ivory-faint">Add credential set</div>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-4">
          <label className="text-[11px] font-semibold text-ivory-dim">App name<input value={appName} onChange={e=>setAppName(e.target.value)} placeholder="Production" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">App ID<input value={appId} onChange={e=>setAppId(e.target.value)} placeholder="xxx" required className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Certificate<input value={cert} onChange={e=>setCert(e.target.value)} placeholder="cert" required className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Expiry (s)<input value={expiry} onChange={e=>setExpiry(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <div className="sm:col-span-4"><button type="submit" className="h-11 rounded-xl bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white">Add credential</button></div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">App</th><th className="px-5 py-3.5">App ID</th><th className="px-5 py-3.5">Expiry</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">
              {rows.map(r=>(
                <tr key={r.id} className="hover:bg-surface-1/50">
                  <td className="px-5 py-4 text-[13.5px] font-semibold">{r.app_name ?? '—'}</td>
                  <td className="px-5 py-4 font-mono text-[11px]"><span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1">{r.app_id.slice(0,16)}…</span></td>
                  <td className="px-5 py-4 text-[12px]">{r.token_expire_seconds}s</td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${r.is_active?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-border-soft bg-surface-2 text-ivory-faint'}`}>{r.is_active?'active':'inactive'}</span></td>
                  <td className="px-5 py-4 text-right"><div className="inline-flex gap-2">{!r.is_active && <button onClick={()=>activate(r.id)} className="h-8 rounded-full bg-ivory text-bg-0 px-4 text-[12px] font-bold">Activate</button>}<button onClick={()=>remove(r.id)} className="h-8 rounded-full bg-red-500/10 border border-red-500/20 px-4 text-[12px] font-bold text-red-400">Delete</button></div></td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={5} className="py-16 text-center text-[13px] text-ivory-faint">No credentials yet — add your first Agora app above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
