import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import { Pager, SearchBox } from '../components/ListControls'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { usePagedData } from '../hooks/usePagedData'
import { PageHeader, Card } from '../components/ui/PageShell'
import type { CustomerEditInput } from '../api/types'

interface Customer {
  id: string
  name: string|null
  mobile: string|null
  email: string|null
  language: string|null
  wallet_balance: string
  is_active: boolean
  created_at: string|null
}

export default function CustomersPage(){
  const paged = usePagedData<Customer>('/admin/customers')
  const [search,setSearch]=useState('')
  const [credit,setCredit]=useState<Customer|null>(null)
  const [edit,setEdit]=useState<Customer|null>(null)
  const [remove,setRemove]=useState<Customer|null>(null)
  const [removing,setRemoving]=useState(false)
  const [removeError,setRemoveError]=useState<string|null>(null)
  const [busyId,setBusyId]=useState<string|null>(null)
  const [actionError,setActionError]=useState<string|null>(null)

  const visible = useMemo(()=>{
    const q=search.trim().toLowerCase()
    if(!q) return paged.rows
    return paged.rows.filter(c=>[c.name,c.mobile,c.email].some(v=>v&&v.toLowerCase().includes(q)))
  },[paged.rows,search])

  async function confirmDelete(){
    if(!remove) return
    setRemoving(true); setRemoveError(null)
    try{ await adminApi.deleteCustomer(remove.id); setRemove(null); paged.reload() }
    catch(e){ setRemoveError((e as Error).message) }
    finally{ setRemoving(false) }
  }
  async function toggleBlock(c:Customer){
    setBusyId(c.id); setActionError(null)
    try{ await api(`/admin/customers/${c.id}/${c.is_active?'block':'unblock'}`,{method:'POST'}); paged.reload() }
    catch(e){ setActionError((e as Error).message) }
    finally{ setBusyId(null) }
  }

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title="Customers"
        subtitle="Manage seekers, wallets and access — search, credit, block or edit in one place."
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Name, mobile, email…" />
            <button onClick={paged.reload} className="grid h-[42px] w-[42px] place-items-center rounded-full border border-border-soft bg-surface-raised text-ivory-dim hover:text-ivory shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </>
        }
        icon={<span className="text-[18px]">👥</span>}
      />

      {(paged.error || actionError) && (
        <div className="flex gap-3 rounded-[14px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {paged.error ?? actionError}
        </div>
      )}

      {paged.loading && paged.rows.length===0 ? (
        <Card><div className="p-10 text-center text-[13px] text-ivory-faint">Loading customers…</div></Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Contact</th><th className="px-5 py-3.5">Lang</th><th className="px-5 py-3.5">Wallet</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map(c=>(
                    <tr key={c.id} className="hover:bg-surface-1/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 text-[12px] font-bold text-violet-400">{(c.name||c.email||c.mobile||'U')[0].toUpperCase()}</div>
                          <div><div className="text-[13.5px] font-semibold">{c.name ?? <span className="text-ivory-faint">—</span>}</div><div className="text-[11px] text-ivory-faint">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</div></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><div className="font-mono text-[12px] font-medium">{c.mobile ?? '—'}</div><div className="text-[11px] text-ivory-faint truncate max-w-[180px]">{c.email ?? ''}</div></td>
                      <td className="px-5 py-4 text-[12.5px]"><span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1 text-[11px]">{c.language ?? '—'}</span></td>
                      <td className="px-5 py-4"><span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-[12px] font-bold text-amber-400">₹{c.wallet_balance ?? '0.00'}</span></td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${c.is_active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${c.is_active?'bg-emerald-500':'bg-red-500'}`}/>{c.is_active?'active':'blocked'}</span></td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-1 p-1 shadow-sm">
                          <button onClick={()=>setCredit(c)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim hover:text-amber-500 hover:border-amber-500/20 transition-colors" title="Credit wallet">₹</button>
                          <button onClick={()=>setEdit(c)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim hover:text-ivory transition-colors" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                          <button disabled={busyId===c.id} onClick={()=>toggleBlock(c)} className={`grid h-8 w-8 place-items-center rounded-full border text-ivory-dim transition-colors ${c.is_active ? 'bg-amber-500/10 border-amber-500/20 hover:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 hover:text-emerald-400'}`} title={c.is_active?'Block':'Unblock'}>{busyId===c.id?'…':c.is_active?'⊘':'✓'}</button>
                          <button onClick={()=>setRemove(c)} className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors" title="Delete">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length===0 && <tr><td colSpan={6} className="py-16 text-center text-[13px] text-ivory-faint">No customers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {visible.map(c=>(
              <div key={c.id} className="rounded-[18px] border border-border-soft bg-surface-raised p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 text-[13px] font-bold text-violet-400">{(c.name||'U')[0].toUpperCase()}</div>
                    <div><div className="font-semibold text-[14px]">{c.name ?? 'Unnamed'}</div><div className="font-mono text-[11px] text-ivory-faint">{c.mobile ?? c.email ?? '—'}</div></div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${c.is_active?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>{c.is_active?'active':'blocked'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-[12px] font-bold text-amber-400">₹{c.wallet_balance}</span>
                  <div className="flex gap-1.5">
                    <button onClick={()=>setCredit(c)} className="h-8 rounded-full bg-saffron px-3 text-[12px] font-semibold text-black">Credit</button>
                    <button onClick={()=>setEdit(c)} className="h-8 w-8 grid place-items-center rounded-full border border-border-soft bg-surface-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pager page={paged.page} size={paged.size} total={search.trim()?null:paged.total} hasPrev={paged.hasPrev} hasNext={!search.trim()&&paged.hasNext} onPage={paged.setPage} onSize={paged.setSize} shown={visible.length} />
        </>
      )}

      {credit && <CreditModal customer={credit} onClose={()=>setCredit(null)} onDone={()=>{setCredit(null); paged.reload()}} />}
      {edit && <EditModal customer={edit} onClose={()=>setEdit(null)} onDone={()=>{setEdit(null); paged.reload()}} />}
      {remove && <ConfirmDialog title="Delete customer" message="This permanently deletes the customer and all their data. Continue?" confirmLabel="Delete customer" busy={removing} error={removeError} onConfirm={confirmDelete} onClose={()=>{setRemove(null); setRemoveError(null)}} />}
    </div>
  )
}

function EditModal({customer,onClose,onDone}:{customer:Customer; onClose:()=>void; onDone:()=>void}){
  const [name,setName]=useState(customer.name??'')
  const [email,setEmail]=useState(customer.email??'')
  const [mobile,setMobile]=useState(customer.mobile??'')
  const [language,setLanguage]=useState(customer.language??'')
  const [isActive,setIsActive]=useState(customer.is_active)
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  async function submit(){
    const body: CustomerEditInput={ name:name.trim(), email:email.trim(), mobile:mobile.trim(), language:language.trim(), is_active:isActive }
    setSaving(true); setError(null)
    try{ await adminApi.editCustomer(customer.id,body); onDone() } catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[480px] animate-pop-in rounded-[22px] border border-border-mid bg-surface-raised p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">Edit customer</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button></div>
        {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="block text-[12px] font-semibold text-ivory-dim">Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron focus:bg-surface-2" /></label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-[12px] font-semibold text-ivory-dim">Email<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
            <label className="block text-[12px] font-semibold text-ivory-dim">Mobile<input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="9876543210" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          </div>
          <label className="block text-[12px] font-semibold text-ivory-dim">Language<input value={language} onChange={e=>setLanguage(e.target.value)} placeholder="hi / en" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface-1 p-3.5 text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border-soft" /> <span className="font-medium">{isActive ? 'Active — user can login' : 'Blocked — access disabled'}</span></label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px] font-medium">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white disabled:opacity-50">{saving?'Saving…':'Save changes'}</button></div>
      </div>
    </div>
  )
}

function CreditModal({customer,onClose,onDone}:{customer:Customer; onClose:()=>void; onDone:()=>void}){
  const [amount,setAmount]=useState('')
  const [note,setNote]=useState('')
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  async function submit(){
    const amt=Number(amount); if(Number.isNaN(amt)||amt<=0){ setError('Enter amount > 0'); return }
    setSaving(true); setError(null)
    try{ await adminApi.creditWallet(customer.id,amt,note); onDone() } catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[420px] animate-pop-in rounded-[22px] border border-border-mid bg-surface-raised p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <h3 className="text-[16px] font-bold">Credit wallet</h3>
        <p className="mt-1.5 text-[12px] text-ivory-faint flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">₹</span>{customer.name||customer.mobile||'Customer'} · balance ₹{customer.wallet_balance ?? '0.00'}</p>
        {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="block text-[12px] font-semibold text-ivory-dim">Amount (₹)<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="500" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[14px] font-bold outline-none focus:border-saffron" /></label>
          <label className="block text-[12px] font-semibold text-ivory-dim">Note (optional)<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason" className="mt-1.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-saffron px-6 text-[13px] font-bold text-black hover:brightness-110 disabled:opacity-50">{saving?'Crediting…':'Credit wallet'}</button></div>
      </div>
    </div>
  )
}
