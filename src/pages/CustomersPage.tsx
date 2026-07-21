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
      <div className="page-head spread">
        <div>
          <h1>Customer Details</h1>
          <p className="muted">All registered seekers. Credit wallets and manage access.</p>
        </div>
        <div className="row">
          <SearchBox value={search} onChange={setSearch} placeholder="Name, mobile, email…" />
          <button className="btn-ghost" onClick={paged.reload}>Refresh</button>
        </div>
      </div>

      {(paged.error || actionError) && (
        <div className="error-banner">{paged.error ?? actionError}</div>
      )}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Mobile</th><th>Email</th><th>Lang</th>
                  <th>Wallet</th><th>Active</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name ?? <span className="faint">—</span>}</td>
                    <td className="mono">{c.mobile ?? <span className="faint">—</span>}</td>
                    <td>{c.email ?? <span className="faint">—</span>}</td>
                    <td>{c.language ?? <span className="faint">—</span>}</td>
                    <td className="mono">₹{c.wallet_balance ?? '0.00'}</td>
                    <td>
                      <span className={`badge badge-${c.is_active ? 'approved' : 'rejected'}`}>
                        {c.is_active ? 'active' : 'blocked'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-primary" onClick={() => setCredit(c)}>Credit</button>
                      <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setEdit(c)}>
                        Edit
                      </button>
                      <button
                        className={c.is_active ? 'btn-danger' : 'btn-success'}
                        style={{ marginLeft: 8 }}
                        disabled={busyId === c.id}
                        onClick={() => toggleBlock(c)}
                      >
                        {busyId === c.id ? '…' : c.is_active ? 'Block' : 'Unblock'}
                      </button>
                      <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => setRemove(c)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={7}><div className="empty">No customers found.</div></td></tr>
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
