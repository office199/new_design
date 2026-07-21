import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: string
  value: string
  max_discount: string | null
  min_amount: string
  usage_limit: number
  used_count: number
  expires_on: string | null
  is_active: boolean
}

export default function CouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([])
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('')
  const [minAmount, setMinAmount] = useState('0')
  const [edit, setEdit] = useState<Coupon | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await api<Coupon[]>('/admin/coupons'))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api('/admin/coupons', {
        method: 'POST',
        body: { code, discount_type: type, value, min_amount: minAmount },
      })
      setCode('')
      setValue('')
      setMinAmount('0')
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(c: Coupon) {
    await api(`/admin/coupons/${c.id}`, { method: 'PATCH', body: { is_active: !c.is_active } })
    await load()
  }

  async function remove(c: Coupon) {
    await api(`/admin/coupons/${c.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div className="page-head">
        <h1>Coupons</h1>
        <p className="muted">Create and manage discount codes.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <form className="card" style={{ marginBottom: 20 }} onSubmit={create}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME50" required />
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="percent">Percent</option>
              <option value="flat">Flat ₹</option>
            </select>
          </Field>
          <Field label="Value">
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="50" required />
          </Field>
          <Field label="Min amount">
            <input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          </Field>
          <button className="btn-primary" type="submit">Add coupon</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Used</th><th>Active</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.code}</td>
                <td>{c.discount_type}</td>
                <td>{c.discount_type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                <td>₹{c.min_amount}</td>
                <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                <td><span className={`badge badge-${c.is_active ? 'approved' : 'rejected'}`}>{c.is_active ? 'active' : 'off'}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-ghost" onClick={() => setEdit(c)}>Edit</button>
                  <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => toggle(c)}>{c.is_active ? 'Disable' : 'Enable'}</button>
                  <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}><div className="empty">No coupons yet.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <EditCouponModal
          coupon={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

function EditCouponModal({
  coupon,
  onClose,
  onDone,
}: {
  coupon: Coupon
  onClose: () => void
  onDone: () => void
}) {
  const [description, setDescription] = useState(coupon.description ?? '')
  const [value, setValue] = useState(coupon.value)
  const [maxDiscount, setMaxDiscount] = useState(coupon.max_discount ?? '')
  const [minAmount, setMinAmount] = useState(coupon.min_amount)
  const [usageLimit, setUsageLimit] = useState(String(coupon.usage_limit ?? 0))
  const [expiresOn, setExpiresOn] = useState(coupon.expires_on ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      await api(`/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        body: {
          description: description.trim() === '' ? null : description.trim(),
          value: value.trim(),
          max_discount: maxDiscount.trim() === '' ? null : maxDiscount.trim(),
          min_amount: minAmount.trim(),
          usage_limit: usageLimit.trim() === '' ? 0 : Number(usageLimit),
          expires_on: expiresOn.trim() === '' ? null : expiresOn.trim(),
        },
      })
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
        <h2 style={{ fontSize: 20 }}>Edit coupon</h2>
        <p className="muted mono" style={{ marginTop: 4 }}>{coupon.code}</p>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="field">
          <label>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown to customers" />
        </div>
        <div className="field">
          <label>Value {coupon.discount_type === 'percent' ? '(%)' : '(₹)'}</label>
          <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field">
          <label>Max discount (₹, optional cap)</label>
          <input inputMode="decimal" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" />
        </div>
        <div className="field">
          <label>Min order amount (₹)</label>
          <input inputMode="decimal" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>Usage limit (0 = unlimited)</label>
          <input inputMode="numeric" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
        </div>
        <div className="field">
          <label>Expires on</label>
          <input type="date" value={expiresOn ?? ''} onChange={(e) => setExpiresOn(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--ivory-dim)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
