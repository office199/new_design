import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

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
    void load()
  }, [load])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api('/admin/coupons', { method: 'POST', body: { code, discount_type: type, value, min_amount: minAmount } })
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
    <div className="page-shell space-y-6">
      <PageHeader
        title="Promotions & Coupon Tickets"
        subtitle="Manage discount vouchers for wallet recharges and consultations."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400">
            <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
          </svg>
        }
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      {/* Coupon Creator */}
      <Card className="p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-pink-400">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-pink-500/20 text-pink-300">+</span> Issue New Promo Coupon
        </div>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-5 items-end">
          <label className="text-[11px] font-bold uppercase text-ivory-faint">
            Coupon Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FESTIVE50"
              required
              className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 font-mono text-[13px] font-bold text-amber-300 outline-none focus:border-pink-400"
            />
          </label>
          <label className="text-[11px] font-bold uppercase text-ivory-faint">
            Discount Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-pink-400"
            >
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </select>
          </label>
          <label className="text-[11px] font-bold uppercase text-ivory-faint">
            Value
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percent' ? '50' : '100'}
              required
              className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] font-bold text-ivory outline-none focus:border-pink-400"
            />
          </label>
          <label className="text-[11px] font-bold uppercase text-ivory-faint">
            Min Order ₹
            <input
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] font-bold text-ivory outline-none focus:border-pink-400"
            />
          </label>
          <button type="submit" className="h-11 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 text-[13px] font-bold hover:brightness-110 shadow-md">
            Issue Voucher →
          </button>
        </form>
      </Card>

      {/* Ticket Cards Grid */}
      {loading ? (
        <Card className="p-16 text-center text-ivory-faint">Loading active vouchers…</Card>
      ) : rows.length === 0 ? (
        <Card className="p-16 text-center text-ivory-faint">No coupons issued yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const usagePct = c.usage_limit > 0 ? Math.min(Math.round((c.used_count / c.usage_limit) * 100), 100) : 0

            return (
              <div
                key={c.id}
                className={`relative overflow-hidden rounded-[26px] border ${
                  c.is_active ? 'border-pink-500/30 bg-gradient-to-b from-pink-500/10 via-rose-500/5 to-transparent' : 'border-white/10 bg-white/4 opacity-60'
                } backdrop-blur-2xl p-6 shadow-lg space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-400/10 border border-amber-400/25 px-3.5 py-1 font-mono text-[13px] font-black text-amber-300 tracking-wider">
                    🎟 {c.code}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase ${
                      c.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-border-soft bg-surface-2 text-ivory-faint'
                    }`}
                  >
                    {c.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <div>
                  <div className="font-display text-[28px] font-black text-ivory">
                    {c.discount_type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                  </div>
                  <div className="mt-1 text-[12px] text-ivory-dim">
                    Min order ₹{c.min_amount} {c.max_discount ? `· Capped at ₹${c.max_discount}` : ''}
                  </div>
                </div>

                {/* Usage progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-ivory-faint mb-1.5">
                    <span>Redeemed</span>
                    <span>
                      <b>{c.used_count}</b>
                      {c.usage_limit ? ` / ${c.usage_limit}` : ' uses (Unlimited)'}
                    </span>
                  </div>
                  {c.usage_limit > 0 && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500" style={{ width: `${usagePct}%` }} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[11px] text-ivory-faint">
                    Expires: {c.expires_on ? new Date(c.expires_on).toLocaleDateString('en-IN') : 'No Expiry'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEdit(c)} className="h-8 w-8 grid place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory hover:border-pink-400/40">
                      ✎
                    </button>
                    <button
                      onClick={() => toggle(c)}
                      className={`h-8 rounded-full px-3 text-[11px] font-bold border ${
                        c.is_active ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => remove(c)} className="h-8 w-8 grid place-items-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {edit && <EditCouponModal coupon={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); void load() }} />}
    </div>
  )
}

function EditCouponModal({ coupon, onClose, onDone }: { coupon: Coupon; onClose: () => void; onDone: () => void }) {
  const [description, setDescription] = useState(coupon.description ?? '')
  const [value, setValue] = useState(coupon.value)
  const [maxDiscount, setMaxDiscount] = useState(coupon.max_discount ?? '')
  const [minAmount, setMinAmount] = useState(coupon.min_amount)
  const [usageLimit, setUsageLimit] = useState(String(coupon.usage_limit ?? 0))
  const [expiresOn, setExpiresOn] = useState(coupon.expires_on ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-[26px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-ivory">
            Edit Coupon <span className="ml-2 rounded-full bg-pink-500/20 px-2.5 py-0.5 font-mono text-[12px] text-pink-300">{coupon.code}</span>
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="text-[12px] font-semibold text-ivory-dim">
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory outline-none focus:border-pink-400" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[12px] font-semibold text-ivory-dim">
              Value
              <input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory" />
            </label>
            <label className="text-[12px] font-semibold text-ivory-dim">
              Max Discount Cap ₹
              <input value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[12px] font-semibold text-ivory-dim">
              Min Order Amount ₹
              <input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory" />
            </label>
            <label className="text-[12px] font-semibold text-ivory-dim">
              Usage Limit (0=∞)
              <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory" />
            </label>
          </div>
          <label className="text-[12px] font-semibold text-ivory-dim">
            Expiry Date
            <input type="date" value={expiresOn ?? ''} onChange={(e) => setExpiresOn(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3.5 text-[13px] text-ivory" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button>
          <button disabled={saving} onClick={submit} className="h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 text-[13px] font-bold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
