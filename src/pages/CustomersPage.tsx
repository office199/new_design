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
  name: string | null
  mobile: string | null
  email: string | null
  language: string | null
  wallet_balance: string
  is_active: boolean
  created_at: string | null
}

export default function CustomersPage() {
  const paged = usePagedData<Customer>('/admin/customers')
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'blocked' | 'wallet'>('all')
  const [credit, setCredit] = useState<Customer | null>(null)
  const [edit, setEdit] = useState<Customer | null>(null)
  const [remove, setRemove] = useState<Customer | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const visible = useMemo(() => {
    let list = paged.rows
    if (filterMode === 'active') list = list.filter((c) => c.is_active)
    if (filterMode === 'blocked') list = list.filter((c) => !c.is_active)
    if (filterMode === 'wallet') list = list.filter((c) => Number(c.wallet_balance || 0) > 0)

    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) => [c.name, c.mobile, c.email].some((v) => v && v.toLowerCase().includes(q)))
  }, [paged.rows, search, filterMode])

  const stats = useMemo(() => {
    const total = paged.total ?? paged.rows.length
    let active = 0
    let blocked = 0
    let walletPool = 0
    for (const c of paged.rows) {
      if (c.is_active) active++
      else blocked++
      walletPool += Number(c.wallet_balance || 0)
    }
    return { total, active, blocked, walletPool }
  }, [paged.rows, paged.total])

  async function confirmDelete() {
    if (!remove) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await adminApi.deleteCustomer(remove.id)
      setRemove(null)
      paged.reload()
    } catch (e) {
      setRemoveError((e as Error).message)
    } finally {
      setRemoving(false)
    }
  }

  async function toggleBlock(c: Customer) {
    setBusyId(c.id)
    setActionError(null)
    try {
      await api(`/admin/customers/${c.id}/${c.is_active ? 'block' : 'unblock'}`, { method: 'POST' })
      paged.reload()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Seekers & Customer Directory"
        subtitle="Manage seekers, credit wallet balances, modify accounts or restrict platform access."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Name, mobile, email…" />
            <button
              onClick={paged.reload}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 text-ivory hover:border-blue-400/40 transition-colors"
            >
              ↻
            </button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[22px] border border-blue-500/25 bg-blue-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Total Registered Seekers</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{stats.total}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Platform user accounts</div>
        </div>
        <div className="rounded-[22px] border border-emerald-500/25 bg-emerald-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Seekers</div>
          <div className="mt-2 font-display text-[26px] font-black text-emerald-400">{stats.active}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Enabled login access</div>
        </div>
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Total Wallet Pool</div>
          <div className="mt-2 font-display text-[26px] font-black text-amber-300">₹{stats.walletPool.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Seeker funds on page</div>
        </div>
        <div className="rounded-[22px] border border-red-500/25 bg-red-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">Blocked Accounts</div>
          <div className="mt-2 font-display text-[26px] font-black text-red-400">{stats.blocked}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Restricted platform access</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 w-fit">
        {[
          { id: 'all', label: 'All Seekers' },
          { id: 'active', label: '🟢 Active Only' },
          { id: 'blocked', label: '⊘ Blocked' },
          { id: 'wallet', label: '₹ Wallet > 0' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterMode(f.id as typeof filterMode)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
              filterMode === f.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(paged.error || actionError) && (
        <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {paged.error ?? actionError}
        </div>
      )}

      {paged.loading && paged.rows.length === 0 ? (
        <Card className="p-12 text-center text-ivory-faint">Loading seeker accounts…</Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">Seeker Name</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Language</th>
                    <th className="px-5 py-3.5">Wallet Balance</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-1/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/20 border border-blue-500/30 font-display text-[13px] font-black text-blue-300 shadow-sm">
                            {(c.name || c.email || c.mobile || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-ivory group-hover:text-blue-300 transition-colors">
                              {c.name ?? <span className="text-ivory-faint">—</span>}
                            </div>
                            <div className="text-[11px] text-ivory-faint">Joined {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-[12px] font-bold text-ivory">{c.mobile ?? '—'}</div>
                        <div className="text-[11px] text-ivory-faint truncate max-w-[180px]">{c.email ?? ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-ivory-dim">
                          {c.language ?? 'en'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[13px] font-bold text-amber-300 shadow-sm">
                          ₹{c.wallet_balance ?? '0.00'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${
                            c.is_active ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-red-500/25 bg-red-500/10 text-red-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {c.is_active ? 'ACTIVE' : 'BLOCKED'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-1 p-1.5 shadow-sm">
                          <button
                            onClick={() => setCredit(c)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-black font-bold text-[13px] hover:brightness-110 transition-all"
                            title="Credit wallet balance"
                          >
                            ₹
                          </button>
                          <button
                            onClick={() => setEdit(c)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim hover:text-ivory transition-colors"
                            title="Edit customer details"
                          >
                            ✎
                          </button>
                          <button
                            disabled={busyId === c.id}
                            onClick={() => toggleBlock(c)}
                            className={`grid h-8 w-8 place-items-center rounded-full border text-[12px] font-bold transition-colors ${
                              c.is_active ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                            title={c.is_active ? 'Block account' : 'Unblock account'}
                          >
                            {busyId === c.id ? '…' : c.is_active ? '⊘' : '✓'}
                          </button>
                          <button
                            onClick={() => setRemove(c)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete customer"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[13px] text-ivory-faint">
                        No seekers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid Cards */}
          <div className="grid gap-4 lg:hidden">
            {visible.map((c) => (
              <div key={c.id} className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/20 border border-blue-500/30 font-display text-[15px] font-black text-blue-300">
                      {(c.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[15px] text-ivory">{c.name ?? 'Unnamed Seeker'}</div>
                      <div className="font-mono text-[11px] text-ivory-faint">{c.mobile ?? c.email ?? '—'}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                      c.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {c.is_active ? 'active' : 'blocked'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-[13px] font-bold text-amber-300">
                    ₹{c.wallet_balance}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setCredit(c)} className="h-9 rounded-full bg-amber-400 px-4 text-[12px] font-bold text-black shadow-sm">
                      Credit ₹
                    </button>
                    <button onClick={() => setEdit(c)} className="h-9 w-9 grid place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory">
                      ✎
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pager
            page={paged.page}
            size={paged.size}
            total={search.trim() ? null : paged.total}
            hasPrev={paged.hasPrev}
            hasNext={!search.trim() && paged.hasNext}
            onPage={paged.setPage}
            onSize={paged.setSize}
            shown={visible.length}
          />
        </>
      )}

      {credit && <CreditModal customer={credit} onClose={() => setCredit(null)} onDone={() => { setCredit(null); paged.reload() }} />}
      {edit && <EditModal customer={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); paged.reload() }} />}
      {remove && (
        <ConfirmDialog
          title="Delete seeker account"
          message="This permanently removes the seeker and their wallet history. Continue?"
          confirmLabel="Delete customer"
          busy={removing}
          error={removeError}
          onConfirm={confirmDelete}
          onClose={() => { setRemove(null); setRemoveError(null) }}
        />
      )}
    </div>
  )
}

function EditModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(customer.name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [mobile, setMobile] = useState(customer.mobile ?? '')
  const [language, setLanguage] = useState(customer.language ?? '')
  const [isActive, setIsActive] = useState(customer.is_active)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const body: CustomerEditInput = { name: name.trim(), email: email.trim(), mobile: mobile.trim(), language: language.trim(), is_active: isActive }
    setSaving(true)
    setError(null)
    try {
      await adminApi.editCustomer(customer.id, body)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-[26px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-ivory">Edit seeker account</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="block text-[12px] font-semibold text-ivory-dim">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-blue-400" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-[12px] font-semibold text-ivory-dim">
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-blue-400" />
            </label>
            <label className="block text-[12px] font-semibold text-ivory-dim">
              Mobile
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-blue-400" />
            </label>
          </div>
          <label className="block text-[12px] font-semibold text-ivory-dim">
            Language
            <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="hi / en" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-blue-400" />
          </label>
          <label className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-[13px] cursor-pointer hover:bg-surface-2 transition-colors">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border-soft" />
            <span className="font-medium text-ivory">{isActive ? 'Active — seeker can login & consult' : 'Blocked — platform access disabled'}</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button>
          <button disabled={saving} onClick={submit} className="h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 text-[13px] font-bold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreditModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError('Enter amount > 0')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await adminApi.creditWallet(customer.id, amt, note)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[26px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[16px] font-bold text-ivory">Credit seeker wallet</h3>
        <p className="mt-1.5 text-[12px] text-ivory-faint flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">₹</span>
          {customer.name || customer.mobile || 'Seeker'} · current balance ₹{customer.wallet_balance ?? '0.00'}
        </p>
        {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="block text-[12px] font-semibold text-ivory-dim">
            Amount (₹)
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[14px] font-bold text-ivory outline-none focus:border-amber-400" />
          </label>
          <label className="block text-[12px] font-semibold text-ivory-dim">
            Reason / Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Promotional credit" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-amber-400" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button>
          <button disabled={saving} onClick={submit} className="h-10 rounded-full bg-amber-400 text-black px-6 text-[13px] font-bold hover:brightness-110 disabled:opacity-50">
            {saving ? 'Crediting…' : 'Add credit ₹'}
          </button>
        </div>
      </div>
    </div>
  )
}
