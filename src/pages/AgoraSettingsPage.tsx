import { useCallback, useEffect, useState } from 'react'
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

  async function create(e:React.FormEvent){
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
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        actions={<button onClick={runDiagnose} disabled={diagnosing} className="h-[44px] rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl px-5 text-[14px] font-semibold shadow-sm hover:bg-white/10 disabled:opacity-50 transition-all">{diagnosing?'Testing…':'Test Connection'}</button>}
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}
      {diagnoseError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">Diagnose failed: {diagnoseError}</div>}
      {diagnose && <div className={`rounded-2xl border px-5 py-4 text-[14px] backdrop-blur-xl ${diagnoseOk ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-400' : 'border-red-500/25 bg-red-500/12 text-red-400'}`}><b>{diagnoseOk?'Connection OK':'Connection problem'}</b> — {diagnose.diagnosis}</div>}

      <Card className="p-7">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ivory-faint">Add credential set</div>
        <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-4">
          <label className="text-[11px] font-semibold text-ivory-dim">App name<input value={appName} onChange={e=>setAppName(e.target.value)} placeholder="Production" className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 text-[14px] outline-none focus:border-violet-400/50" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">App ID<input value={appId} onChange={e=>setAppId(e.target.value)} placeholder="xxx" required className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 text-[14px] outline-none focus:border-violet-400/50" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Certificate<input value={cert} onChange={e=>setCert(e.target.value)} placeholder="cert" required className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 text-[14px] outline-none focus:border-violet-400/50" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Expiry (s)<input value={expiry} onChange={e=>setExpiry(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 text-[14px] outline-none focus:border-violet-400/50" /></label>
          <div className="sm:col-span-4"><button type="submit" className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white px-7 text-[14px] font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">Add credential</button></div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-white/10 bg-white/4 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-4">App</th><th className="px-5 py-4">App ID</th><th className="px-5 py-4">Expiry</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/6">
              {rows.map(r=>(
                <tr key={r.id} className="hover:bg-white/4 transition-colors">
                  <td className="px-5 py-5 text-[14px] font-semibold">{r.app_name ?? '—'}</td>
                  <td className="px-5 py-5 font-mono text-[12px]"><span className="rounded-full bg-white/6 border border-white/10 px-3 py-1">{r.app_id.slice(0,16)}…</span></td>
                  <td className="px-5 py-5 text-[13px]">{r.token_expire_seconds}s</td>
                  <td className="px-5 py-5"><span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${r.is_active?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-white/10 bg-white/6 text-ivory-faint'}`}>{r.is_active?'active':'inactive'}</span></td>
                  <td className="px-5 py-5 text-right"><div className="inline-flex gap-2">{!r.is_active && <button onClick={()=>activate(r.id)} className="h-9 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-4 text-[12px] font-bold hover:brightness-110 shadow-sm">Activate</button>}<button onClick={()=>remove(r.id)} className="h-9 rounded-full bg-red-500/12 border border-red-500/20 px-4 text-[12px] font-bold text-red-400 hover:bg-red-500/18">Delete</button></div></td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={5} className="py-16 text-center text-[14px] text-ivory-faint">No credentials yet — add your first Agora app above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
