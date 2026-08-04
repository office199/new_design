import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { RazorpayDiagnoseResult, RazorpaySettings } from '../api/types'
import { PageHeader, Card } from '../components/ui/PageShell'

export default function RazorpaySettingsPage(){
  const [current,setCurrent]=useState<RazorpaySettings|null>(null)
  const [error,setError]=useState<string|null>(null)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)
  const [keyId,setKeyId]=useState('')
  const [isActive,setIsActive]=useState(false)
  const [editSecret,setEditSecret]=useState(false)
  const [keySecret,setKeySecret]=useState('')
  const [editWebhook,setEditWebhook]=useState(false)
  const [webhookSecret,setWebhookSecret]=useState('')
  const [diagnosing,setDiagnosing]=useState(false)
  const [diagnose,setDiagnose]=useState<RazorpayDiagnoseResult|null>(null)
  const [diagnoseError,setDiagnoseError]=useState<string|null>(null)

  const load=useCallback(async()=>{
    try{ const s=await adminApi.getRazorpay(); setCurrent(s); setKeyId(s.key_id??''); setIsActive(s.is_active); setError(null) }
    catch(e){ setError((e as Error).message) }
  },[])
  useEffect(()=>{ void load() },[load])

  async function save(){
    setError(null); setSaved(false); setSaving(true)
    try{
      await adminApi.saveRazorpay({ key_id:keyId.trim(), key_secret: editSecret?keySecret.trim():'', webhook_secret: editWebhook?webhookSecret.trim():'', is_active:isActive })
      setSaved(true); setEditSecret(false); setKeySecret(''); setEditWebhook(false); setWebhookSecret(''); await load()
    }catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }
  async function runDiagnose(){
    setDiagnosing(true); setDiagnoseError(null)
    try{ setDiagnose(await adminApi.diagnoseRazorpay()) } catch(e){ setDiagnose(null); setDiagnoseError((e as Error).message) } finally{ setDiagnosing(false) }
  }
  const diagnoseOk=diagnose?.credentials_configured && diagnose.test_order_ok

  return (
    <div className="page-shell max-w-[680px] space-y-6">
      <PageHeader
        title="Razorpay"
        subtitle="Payment gateway credentials for wallet recharges, order creation and webhook verification."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        actions={<button onClick={runDiagnose} disabled={diagnosing} className="h-[44px] rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl px-5 text-[14px] font-semibold shadow-sm hover:bg-white/10 disabled:opacity-50 transition-all">{diagnosing?'Testing…':'Test Connection'}</button>}
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}
      {saved && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-emerald-400">✓ Saved — credentials updated.</div>}
      {diagnoseError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">Diagnose failed: {diagnoseError}</div>}
      {diagnose && <div className={`rounded-2xl border px-5 py-4 text-[14px] backdrop-blur-xl ${diagnoseOk?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-red-500/25 bg-red-500/12 text-red-400'}`}><b>{diagnoseOk?'Connection OK':'Connection problem'}</b> — {diagnose.diagnosis}</div>}

      <Card className="p-7 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div><div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ivory-faint">Status</div><div className="text-[13px] text-ivory-faint mt-1">Live payment processing</div></div>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase backdrop-blur-xl ${current?.configured ? (current.is_active?'border-emerald-500/25 bg-emerald-500/12 text-emerald-400':'border-amber-500/25 bg-amber-500/12 text-amber-400') : 'border-red-500/25 bg-red-500/12 text-red-400'}`}>{current?.configured ? (current.is_active?'active':'inactive') : 'not configured'}</span>
        </div>

        <label className="mt-7 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Key ID<input value={keyId} onChange={e=>setKeyId(e.target.value)} placeholder="rzp_live_…" className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 font-mono text-[14px] outline-none focus:border-violet-400/50" /></label>

        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Key Secret</div>
          {editSecret ? (
            <div className="mt-2 flex gap-2"><input value={keySecret} onChange={e=>setKeySecret(e.target.value)} placeholder="New secret" className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 font-mono text-[14px] outline-none focus:border-violet-400/50" autoFocus /><button onClick={()=>{setEditSecret(false); setKeySecret('')}} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-[13px]">Cancel</button></div>
          ) : (
            <div className="mt-2 flex gap-2"><input value={current?.key_secret_masked ?? 'Not set'} readOnly className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 font-mono text-[14px] text-ivory-faint" /><button onClick={()=>setEditSecret(true)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-[13px] font-semibold">Replace</button></div>
          )}
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Webhook Secret</div>
          {editWebhook ? (
            <div className="mt-2 flex gap-2"><input value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} placeholder="New webhook secret" className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 font-mono text-[14px] outline-none focus:border-violet-400/50" autoFocus /><button onClick={()=>{setEditWebhook(false); setWebhookSecret('')}} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-[13px]">Cancel</button></div>
          ) : (
            <div className="mt-2 flex gap-2"><input value={current?.webhook_secret_masked ?? 'Not set'} readOnly className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 font-mono text-[14px] text-ivory-faint" /><button onClick={()=>setEditWebhook(true)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-[13px] font-semibold">Replace</button></div>
          )}
        </div>

        <label className="mt-7 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer hover:bg-white/8 transition-colors">
          <span className="text-[14px] font-medium">Active — use for live payments</span>
          <input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="h-5 w-5 rounded" />
        </label>

        <button disabled={saving} onClick={save} className="mt-7 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[14px] font-bold hover:brightness-110 disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">{saving?'Saving…':'Save credentials'}</button>

        <div className="mt-7 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 text-[13px] text-ivory-dim leading-relaxed">
          <div className="font-bold text-[11px] uppercase tracking-wide text-ivory-faint flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Security note
          </div>
          <div className="mt-2">Secrets are stored encrypted. Leave secret fields blank to keep existing values. Webhook secret is used to verify Razorpay callbacks.</div>
        </div>
      </Card>
    </div>
  )
}
