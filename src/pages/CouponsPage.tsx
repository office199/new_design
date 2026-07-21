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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('')
  const [minAmount, setMinAmount] = useState('0')
  const [edit, setEdit] = useState<Coupon | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setRows(await api<Coupon[]>('/admin/coupons'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
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
      <div className="page-head-gradient">
        <h1>Coupons</h1>
        <p className="muted">Create and manage discount codes for your customers.</p>
      </div>
      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form className="card" style={{ marginBottom: 24 }} onSubmit={create}>
        <div className="card-head" style={{ marginBottom: 16 }}>
          <h3>Create new coupon</h3>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 140px' }}>
            <Field label="Code">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME50" required />
            </Field>
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="percent">Percent</option>
                <option value="flat">Flat ₹</option>
              </select>
            </Field>
          </div>
          <div style={{ flex: '0 0 100px' }}>
            <Field label="Value">
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percent' ? '50' : '100'} required />
            </Field>
          </div>
          <div style={{ flex: '0 0 110px' }}>
            <Field label="Min amount">
              <input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" />
            </Field>
          </div>
          <button className="btn-primary" type="submit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add coupon
          </button>
        </div>
      </form>

      {loading ? (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Loading coupons...
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Used</th><th>Expires</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td data-label="Code">
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--color-saffron-bright)', background: 'var(--color-saffron-soft)', padding: '4px 10px', borderRadius: 'var(--radius-xs)' }}>
                      {c.code}
                    </span>
                  </td>
                  <td data-label="Type">
                    <span className="badge badge-info">{c.discount_type}</span>
                  </td>
                  <td data-label="Value" className="text-warning" style={{ fontWeight: 600 }}>
                    {c.discount_type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                    {c.max_discount && <span className="faint" style={{ fontSize: 11, marginLeft: 6 }}>max ₹{c.max_discount}</span>}
                  </td>
                  <td data-label="Min" className="mono">₹{c.min_amount}</td>
                  <td data-label="Used">
                    <span className="mono">{c.used_count}</span>
                    {c.usage_limit ? ` / ${c.usage_limit}` : ''}
                  </td>
                  <td data-label="Expires" className="mono faint">{c.expires_on ? new Date(c.expires_on).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td data-label="Status">
                    <span className={`badge badge-${c.is_active ? 'approved' : 'rejected'}`}>
                      {c.is_active ? 'active' : 'off'}
                    </span>
                  </td>
                  <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-ghost btn-icon-sm" onClick={() => setEdit(c)} title="Edit coupon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className={c.is_active ? 'btn-warning' : 'btn-success'}
                      style={{ marginLeft: 6 }}
                      onClick={() => toggle(c)}
                      title={c.is_active ? 'Disable coupon' : 'Enable coupon'}
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-danger btn-icon-sm" style={{ marginLeft: 6 }} onClick={() => remove(c)} title="Delete coupon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td data-empty colSpan={8}>
                  <div className="empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
                      <path d="M4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.6a2.4 2.4 0 0 0 0 4.8v2.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2.6a2.4 2.4 0 0 0 0-4.8V7.5A1.5 1.5 0 0 1 4.5 6Z" />
                      <path d="M13.5 8v1.7M13.5 11.7v1.7M13.5 15.4V17" strokeDasharray="0.1 2.6" />
                    </svg>
                    No coupons yet. Create your first coupon above!
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-saffron-bright)' }}>
            <path d="M4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.6a2.4 2.4 0 0 0 0 4.8v2.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2.6a2.4 2.4 0 0 0 0-4.8V7.5A1.5 1.5 0 0 1 4.5 6Z" />
          </svg>
          <h2 style={{ fontSize: 20 }}>Edit coupon</h2>
        </div>
        <p className="muted mono" style={{ marginBottom: 16, background: 'var(--color-saffron-soft)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
          {coupon.code}
        </p>
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
        <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving...
              </>
            ) : 'Save changes'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--color-ivory-dim)', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}
