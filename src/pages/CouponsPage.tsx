import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

interface Coupon { id:string; code:string; description:string|null; discount_type:string; value:string; max_discount:string|null; min_amount:string; usage_limit:number; used_count:number; expires_on:string|null; is_active:boolean }

export default function CouponsPage(){
  const [rows,setRows]=useState<Coupon[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [code,setCode]=useState('')
  const [type,setType]=useState('percent')
  const [value,setValue]=useState('')
  const [minAmount,setMinAmount]=useState('0')
  const [edit,setEdit]=useState<Coupon|null>(null)

  const load=useCallback(async()=>{ try{ setLoading(true); setRows(await api<Coupon[]>('/admin/coupons')) } catch(e){ setError((e as Error).message) } finally{ setLoading(false) } },[])
  useEffect(()=>{ void load() },[load])

  async function create(e:FormEvent){
    e.preventDefault(); setError(null)
    try{ await api('/admin/coupons',{method:'POST',body:{code,discount_type:type,value,min_amount:minAmount}}); setCode(''); setValue(''); setMinAmount('0'); await load() }
    catch(err){ setError((err as Error).message) }
  }
  async function toggle(c:Coupon){ await api(`/admin/coupons/${c.id}`,{method:'PATCH',body:{is_active:!c.is_active}}); await load() }
  async function remove(c:Coupon){ await api(`/admin/coupons/${c.id}`,{method:'DELETE'}); await load() }

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" subtitle="Discount codes for wallet recharges and consultations. Create, manage expiry and usage limits." icon={<span className="text-[18px]">🎟️</span>} />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ivory-faint"><span className="grid h-6 w-6 place-items-center rounded-full bg-saffron-soft border border-saffron/15 text-saffron">+</span> Create coupon</div>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-5 items-end">
          <label className="text-[11px] font-semibold text-ivory-dim">Code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="WELCOME50" required className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] font-mono font-bold outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Type<select value={type} onChange={e=>setType(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron"><option value="percent">Percent %</option><option value="flat">Flat ₹</option></select></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Value<input value={value} onChange={e=>setValue(e.target.value)} placeholder={type==='percent'?'50':'100'} required className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Min amount<input value={minAmount} onChange={e=>setMinAmount(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <button type="submit" className="h-11 rounded-xl bg-ivory text-bg-0 px-5 text-[13px] font-bold hover:bg-white shadow-sm">Add coupon</button>
        </form>
      </Card>

      {loading ? <Card><div className="p-16 text-center text-[13px] text-ivory-faint">Loading coupons…</div></Card> : (
        <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Code</th><th className="px-5 py-3.5">Type</th><th className="px-5 py-3.5">Value</th><th className="px-5 py-3.5">Min</th><th className="px-5 py-3.5">Used</th><th className="px-5 py-3.5">Expires</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-border-soft/60">
                {rows.map(c=>(
                  <tr key={c.id} className="hover:bg-surface-1/50 transition-colors">
                    <td className="px-5 py-4"><span className="rounded-full bg-saffron-soft border border-saffron/15 px-3 py-1 font-mono text-[12px] font-bold text-saffron">{c.code}</span></td>
                    <td className="px-5 py-4"><span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-400 uppercase">{c.discount_type}</span></td>
                    <td className="px-5 py-4 text-[13px] font-bold">{c.discount_type==='percent'?`${c.value}%`:`₹${c.value}`}{c.max_discount && <span className="ml-1 text-[11px] text-ivory-faint font-normal">max ₹{c.max_discount}</span>}</td>
                    <td className="px-5 py-4 font-mono text-[12px]">₹{c.min_amount}</td>
                    <td className="px-5 py-4 font-mono text-[12px]"><span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1">{c.used_count}{c.usage_limit?` / ${c.usage_limit}`:''}</span></td>
                    <td className="px-5 py-4 text-[12px] text-ivory-faint">{c.expires_on ? new Date(c.expires_on).toLocaleDateString('en-IN') : 'Never'}</td>
                    <td className="px-5 py-4"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${c.is_active?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-border-soft bg-surface-2 text-ivory-faint'}`}>{c.is_active?'active':'off'}</span></td>
                    <td className="px-5 py-4 text-right"><div className="inline-flex gap-1.5"><button onClick={()=>setEdit(c)} className="grid h-8 w-8 place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory-dim hover:text-ivory">✎</button><button onClick={()=>toggle(c)} className={`h-8 rounded-full px-3 text-[11px] font-bold border ${c.is_active?'bg-amber-500/10 border-amber-500/20 text-amber-400':'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>{c.is_active?'Disable':'Enable'}</button><button onClick={()=>remove(c)} className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">✕</button></div></td>
                  </tr>
                ))}
                {rows.length===0 && <tr><td colSpan={8} className="py-16 text-center text-[13px] text-ivory-faint">No coupons yet — create your first promo code above.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {rows.map(c=>(
              <div key={c.id} className="rounded-[16px] border border-border-soft bg-surface-1 p-4">
                <div className="flex items-center justify-between"><span className="rounded-full bg-saffron-soft border border-saffron/15 px-3 py-1 font-mono text-[12px] font-bold text-saffron">{c.code}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${c.is_active?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-surface-2 text-ivory-faint border-border-soft'}`}>{c.is_active?'active':'off'}</span></div>
                <div className="mt-3 flex items-center justify-between text-[13px]"><span className="font-bold">{c.discount_type==='percent'?`${c.value}%`:`₹${c.value}`}</span><span className="font-mono text-[11px] text-ivory-faint">Used {c.used_count}{c.usage_limit?`/${c.usage_limit}`:''}</span></div>
                <div className="mt-3 flex gap-2"><button onClick={()=>setEdit(c)} className="flex-1 h-8 rounded-full border border-border-soft bg-surface-raised text-[12px] font-semibold">Edit</button><button onClick={()=>toggle(c)} className={`flex-1 h-8 rounded-full text-[12px] font-bold border ${c.is_active?'bg-amber-500/10 border-amber-500/20 text-amber-400':'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>{c.is_active?'Disable':'Enable'}</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edit && <EditCouponModal coupon={edit} onClose={()=>setEdit(null)} onDone={()=>{setEdit(null); void load()}} />}
    </div>
  )
}

function EditCouponModal({coupon,onClose,onDone}:{coupon:Coupon; onClose:()=>void; onDone:()=>void}){
  const [description,setDescription]=useState(coupon.description??'')
  const [value,setValue]=useState(coupon.value)
  const [maxDiscount,setMaxDiscount]=useState(coupon.max_discount??'')
  const [minAmount,setMinAmount]=useState(coupon.min_amount)
  const [usageLimit,setUsageLimit]=useState(String(coupon.usage_limit??0))
  const [expiresOn,setExpiresOn]=useState(coupon.expires_on??'')
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)

  async function submit(){
    setSaving(true); setError(null)
    try{
      await api(`/admin/coupons/${coupon.id}`,{method:'PATCH',body:{description:description.trim()===''?null:description.trim(), value:value.trim(), max_discount:maxDiscount.trim()===''?null:maxDiscount.trim(), min_amount:minAmount.trim(), usage_limit:usageLimit.trim()===''?0:Number(usageLimit), expires_on:expiresOn.trim()===''?null:expiresOn.trim()}})
      onDone()
    }catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] animate-pop-in rounded-[22px] border border-border-mid bg-surface-raised p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">Edit coupon <span className="ml-2 rounded-full bg-saffron-soft px-2.5 py-1 font-mono text-[11px] text-saffron">{coupon.code}</span></h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button></div>
        {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="text-[12px] font-semibold text-ivory-dim">Description<input value={description} onChange={e=>setDescription(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <div className="grid sm:grid-cols-2 gap-3"><label className="text-[12px] font-semibold">Value<input value={value} onChange={e=>setValue(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px]" /></label><label className="text-[12px]">Max discount<input value={maxDiscount} onChange={e=>setMaxDiscount(e.target.value)} placeholder="No cap" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px]" /></label></div>
          <div className="grid sm:grid-cols-2 gap-3"><label className="text-[12px]">Min amount<input value={minAmount} onChange={e=>setMinAmount(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px]" /></label><label className="text-[12px]">Usage limit (0=∞)<input value={usageLimit} onChange={e=>setUsageLimit(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px]" /></label></div>
          <label className="text-[12px] font-semibold">Expires on<input type="date" value={expiresOn??''} onChange={e=>setExpiresOn(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px]" /></label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-ivory text-bg-0 px-6 text-[13px] font-bold disabled:opacity-50">{saving?'Saving…':'Save'}</button></div>
      </div>
    </div>
  )
}
