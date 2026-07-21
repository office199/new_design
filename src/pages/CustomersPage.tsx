import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import { Pager, SearchBox } from '../components/ListControls'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { usePagedData } from '../hooks/usePagedData'
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

/** Customer directory: search, paginate, credit wallet, edit, block, delete. */
export default function CustomersPage() {
  const paged = usePagedData<Customer>('/admin/customers')
  const [search, setSearch] = useState('')
  const [credit, setCredit] = useState<Customer | null>(null)
  const [edit, setEdit] = useState<Customer | null>(null)
  const [remove, setRemove] = useState<Customer | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((c) =>
      [c.name, c.mobile, c.email].some((v) => v && v.toLowerCase().includes(q)),
    )
  }, [paged.rows, search])

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
    <div>
      <div className="page-head-gradient spread">
        <div>
          <h1>Customer Details</h1>
          <p className="muted">All registered seekers. Credit wallets and manage access.</p>
        </div>
        <div className="row">
          <SearchBox value={search} onChange={setSearch} placeholder="Name, mobile, email…" />
          <button className="btn-ghost" onClick={paged.reload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {(paged.error || actionError) && (
        <div className="error-banner">{paged.error ?? actionError}</div>
      )}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Loading customers...
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Name</th><th>Mobile</th><th>Email</th><th>Lang</th>
                  <th>Wallet</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Name">{c.name ?? <span className="faint">—</span>}</td>
                    <td data-label="Mobile" className="mono">{c.mobile ?? <span className="faint">—</span>}</td>
                    <td data-label="Email">{c.email ?? <span className="faint">—</span>}</td>
                    <td data-label="Lang">{c.language ?? <span className="faint">—</span>}</td>
                    <td data-label="Wallet" className="mono text-warning">₹{c.wallet_balance ?? '0.00'}</td>
                    <td data-label="Status">
                      <span className={`badge badge-${c.is_active ? 'approved' : 'rejected'}`}>
                        {c.is_active ? 'active' : 'blocked'}
                      </span>
                    </td>
                    <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-primary btn-icon-sm" onClick={() => setCredit(c)} title="Credit wallet">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </button>
                      <button className="btn-ghost btn-icon-sm" style={{ marginLeft: 6 }} onClick={() => setEdit(c)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={c.is_active ? 'btn-warning' : 'btn-success'}
                        style={{ marginLeft: 6 }}
                        disabled={busyId === c.id}
                        onClick={() => toggleBlock(c)}
                        title={c.is_active ? 'Block customer' : 'Unblock customer'}
                      >
                        {busyId === c.id ? '…' : c.is_active ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <button className="btn-danger btn-icon-sm" style={{ marginLeft: 6 }} onClick={() => setRemove(c)} title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td data-empty colSpan={7}>
                    <div className="empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      No customers found.
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
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

      {credit && (
        <CreditModal
          customer={credit}
          onClose={() => setCredit(null)}
          onDone={() => {
            setCredit(null)
            paged.reload()
          }}
        />
      )}

      {edit && (
        <EditModal
          customer={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null)
            paged.reload()
          }}
        />
      )}

      {remove && (
        <ConfirmDialog
          title="Delete customer"
          message="This permanently deletes the customer and all their data. Continue?"
          confirmLabel="Delete customer"
          busy={removing}
          error={removeError}
          onConfirm={confirmDelete}
          onClose={() => {
            setRemove(null)
            setRemoveError(null)
          }}
        />
      )}
    </div>
  )
}

function EditModal({
  customer,
  onClose,
  onDone,
}: {
  customer: Customer
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(customer.name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [mobile, setMobile] = useState(customer.mobile ?? '')
  const [language, setLanguage] = useState(customer.language ?? '')
  const [isActive, setIsActive] = useState(customer.is_active)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const body: CustomerEditInput = {
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      language: language.trim(),
      is_active: isActive,
    }
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20 }}>Edit customer</h2>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div className="field">
          <label>Mobile</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" />
        </div>
        <div className="field">
          <label>Language</label>
          <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="hi / en" />
        </div>
        <label className="row" style={{ gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
          <span>Active (unchecked = blocked)</span>
        </label>
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreditModal({
  customer,
  onClose,
  onDone,
}: {
  customer: Customer
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError('Enter an amount greater than zero.')
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20 }}>Credit wallet</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          {customer.name || customer.mobile || 'Customer'} · current balance ₹{customer.wallet_balance ?? '0.00'}
        </p>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="field">
          <label>Amount (₹)</label>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" />
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / reference" />
        </div>
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'Crediting…' : 'Credit wallet'}
          </button>
        </div>
      </div>
    </div>
  )
}
