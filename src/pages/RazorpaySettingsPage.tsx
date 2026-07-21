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
    <div className="max-w-[640px] space-y-6">
      <PageHeader
        title="Razorpay"
        subtitle="Payment gateway credentials for wallet recharges, order creation and webhook verification."
        icon={<span className="text-[18px]">💳</span>}
        actions={<button onClick={runDiagnose} disabled={diagnosing} className="h-[42px] rounded-full border border-border-soft bg-surface-raised px-5 text-[13px] font-semibold shadow-sm hover:bg-surface-2 disabled:opacity-50">{diagnosing?'Testing…':'Test Connection'}</button>}
      />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-400">✓ Saved — credentials updated.</div>}
      {diagnoseError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">Diagnose failed: {diagnoseError}</div>}
      {diagnose && <div className={`rounded-xl border px-4 py-3 text-[13px] ${diagnoseOk?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-red-500/20 bg-red-500/10 text-red-400'}`}><b>{diagnoseOk?'Connection OK':'Connection problem'}</b> — {diagnose.diagnosis}</div>}

      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div><div className="text-[12px] font-bold uppercase tracking-widest text-ivory-faint">Status</div><div className="text-[12px] text-ivory-faint mt-1">Live payment processing</div></div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${current?.configured ? (current.is_active?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-amber-500/20 bg-amber-500/10 text-amber-400') : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>{current?.configured ? (current.is_active?'active':'inactive') : 'not configured'}</span>
        </div>

        <label className="mt-6 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Key ID<input value={keyId} onChange={e=>setKeyId(e.target.value)} placeholder="rzp_live_…" className="mt-2 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-4 font-mono text-[13px] outline-none focus:border-saffron shadow-sm" /></label>

        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Key Secret</div>
          {editSecret ? (
            <div className="mt-2 flex gap-2"><input value={keySecret} onChange={e=>setKeySecret(e.target.value)} placeholder="New secret" className="h-11 flex-1 rounded-xl border border-border-soft bg-surface-1 px-4 font-mono text-[13px] outline-none focus:border-saffron" autoFocus /><button onClick={()=>{setEditSecret(false); setKeySecret('')}} className="h-11 rounded-xl border border-border-soft bg-surface-1 px-4 text-[12px]">Cancel</button></div>
          ) : (
            <div className="mt-2 flex gap-2"><input value={current?.key_secret_masked ?? 'Not set'} readOnly className="h-11 flex-1 rounded-xl border border-border-soft bg-surface-1 px-4 font-mono text-[13px] text-ivory-faint" /><button onClick={()=>setEditSecret(true)} className="h-11 rounded-xl border border-border-soft bg-surface-1 px-4 text-[12px] font-semibold">Replace</button></div>
          )}
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Webhook Secret</div>
          {editWebhook ? (
            <div className="mt-2 flex gap-2"><input value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} placeholder="New webhook secret" className="h-11 flex-1 rounded-xl border border-border-soft bg-surface-1 px-4 font-mono text-[13px] outline-none focus:border-saffron" autoFocus /><button onClick={()=>{setEditWebhook(false); setWebhookSecret('')}} className="h-11 rounded-xl border border-border-soft bg-surface-1 px-4 text-[12px]">Cancel</button></div>
          ) : (
            <div className="mt-2 flex gap-2"><input value={current?.webhook_secret_masked ?? 'Not set'} readOnly className="h-11 flex-1 rounded-xl border border-border-soft bg-surface-1 px-4 font-mono text-[13px] text-ivory-faint" /><button onClick={()=>setEditWebhook(true)} className="h-11 rounded-xl border border-border-soft bg-surface-1 px-4 text-[12px] font-semibold">Replace</button></div>
          )}
        </div>

        <label className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface-1 p-4 cursor-pointer hover:bg-surface-2 transition-colors">
          <span className="text-[13px] font-medium">Active — use for live payments</span>
          <input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="h-5 w-5 rounded" />
        </label>

        <button disabled={saving} onClick={save} className="mt-6 h-11 w-full rounded-xl bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white disabled:opacity-50 shadow-sm">{saving?'Saving…':'Save credentials'}</button>

        <div className="mt-6 rounded-xl bg-surface-1 border border-border-soft p-4 text-[12px] text-ivory-dim leading-relaxed">
          <div className="font-bold text-[11px] uppercase tracking-wide text-ivory-faint">Security note</div>
          <div className="mt-1">Secrets are stored encrypted. Leave secret fields blank to keep existing values. Webhook secret is used to verify Razorpay callbacks.</div>
        </div>
      </Card>
    </div>
  )
}
