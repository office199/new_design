import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { adminApi } from '../api/endpoints'
import { StatusBadge } from './Badge'
import type { AstrologerDetail, CustomerDetail } from '../api/types'

const money = (v: unknown) => `₹${v ?? '0.00'}`
const dateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : '—')
const dateOnly = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : '—')
const text = (v: unknown) => (v == null || v === '' ? <span className="faint">—</span> : String(v))

function durationLabel(seconds: unknown): string {
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return '—'
  const m = Math.floor(n / 60)
  const s = Math.round(n % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export type DetailKind = 'customer' | 'astrologer'

interface DetailDrawerProps {
  /** Which entity to load — determines the endpoint and the rendered layout. */
  kind: DetailKind
  /** Row id to fetch. Passing null/undefined keeps the drawer closed. */
  id: string | null | undefined
  onClose: () => void
}

/**
 * Full-details modal opened by clicking a row on the Wallet Ledger (customers)
 * and Astrologers list pages. Fetches on open, given just the id.
 */
export function DetailDrawer({ kind, id, onClose }: DetailDrawerProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [astrologer, setAstrologer] = useState<AstrologerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    setCustomer(null)
    setAstrologer(null)
    try {
      if (kind === 'customer') {
        setCustomer(await adminApi.customerDetail(id))
      } else {
        setAstrologer(await adminApi.astrologerDetail(id))
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [kind, id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    if (!id) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, onClose])

  if (!id) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: 20 }}>
            {kind === 'customer' ? 'Customer details' : 'Astrologer details'}
          </h2>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

        {loading && <div className="empty">Loading…</div>}
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}

        {!loading && !error && customer && <CustomerDetailBody data={customer} />}
        {!loading && !error && astrologer && <AstrologerDetailBody data={astrologer} />}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="detail-section-title">{children}</div>
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value money">{value}</div>
    </div>
  )
}

function EmptyRow({ span }: { span: number }) {
  return (
    <tr>
      <td data-empty colSpan={span}><div className="empty">No records yet.</div></td>
    </tr>
  )
}

// ---- Customer body ----

function CustomerDetailBody({ data }: { data: CustomerDetail }) {
  const { profile, wallet, transactions, consultations } = data
  return (
    <div>
      <div className="row spread" style={{ marginTop: 4, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{profile.name ?? 'Unnamed customer'}</div>
          <div className="muted mono" style={{ fontSize: 13, marginTop: 2 }}>
            {profile.mobile ?? '—'}{profile.email ? ` · ${profile.email}` : ''}
          </div>
        </div>
        <span className={`badge ${profile.is_active ? 'badge-approved' : 'badge-rejected'}`}>
          {profile.is_active ? 'active' : 'inactive'}
        </span>
      </div>

      <div className="kv">
        <div className="k">Language</div><div className="v">{text(profile.language)}</div>
        <div className="k">Gender</div><div className="v">{text(profile.gender)}</div>
        <div className="k">Date of birth</div><div className="v">{dateOnly(profile.dob)}</div>
        <div className="k">Birth place</div><div className="v">{text(profile.birth_place)}</div>
        <div className="k">Joined</div><div className="v">{dateTime(profile.created_at)}</div>
      </div>

      <div className="stat-grid">
        <Stat label="Wallet balance" value={money(wallet.balance)} />
        <Stat label="Total credited" value={money(wallet.total_credit)} />
        <Stat label="Total debited" value={money(wallet.total_debit)} />
        <Stat label="Total spent" value={money(consultations.total_spent)} />
      </div>

      <SectionTitle>Recent transactions</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance after</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && <EmptyRow span={5} />}
            {transactions.map((t) => (
              <tr key={t.id}>
                <td data-label="Type">{text(t.type)}</td>
                <td data-label="Amount">{money(t.amount)}</td>
                <td data-label="Balance after">{money(t.balance_after)}</td>
                <td data-label="Status">{text(t.status)}</td>
                <td data-label="When">{dateTime(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>
        Recent consultations ({consultations.completed}/{consultations.total} completed)
      </SectionTitle>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              <th>Astrologer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Charged</th>
              <th>Duration</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {consultations.recent.length === 0 && <EmptyRow span={6} />}
            {consultations.recent.map((c) => (
              <tr key={c.id}>
                <td data-label="Astrologer">{text(c.astrologer_name)}</td>
                <td data-label="Type">{text(c.type)}</td>
                <td data-label="Status">{text(c.status)}</td>
                <td data-label="Charged">{money(c.amount_charged)}</td>
                <td data-label="Duration">{durationLabel(c.duration_seconds)}</td>
                <td data-label="When">{dateTime(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- Astrologer body ----

function AstrologerDetailBody({ data }: { data: AstrologerDetail }) {
  const { profile, kyc, earnings, consultations, payouts } = data
  return (
    <div>
      <div className="row spread" style={{ marginTop: 4, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{profile.display_name ?? 'Unnamed astrologer'}</div>
          <div className="muted mono" style={{ fontSize: 13, marginTop: 2 }}>
            {profile.mobile ?? '—'}{profile.email ? ` · ${profile.email}` : ''}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <StatusBadge status={profile.kyc_status} />
          <span className={`badge ${profile.is_online ? 'badge-approved' : 'badge-rejected'}`}>
            {profile.is_online ? 'online' : 'offline'}
          </span>
          {profile.is_live && <span className="badge badge-pending">live</span>}
        </div>
      </div>

      <div className="kv">
        <div className="k">Skills</div><div className="v">{profile.skills?.length ? profile.skills.join(', ') : <span className="faint">—</span>}</div>
        <div className="k">Languages</div><div className="v">{profile.languages?.length ? profile.languages.join(', ') : <span className="faint">—</span>}</div>
        <div className="k">Experience</div><div className="v">{profile.years_experience != null ? `${profile.years_experience} yrs` : <span className="faint">—</span>}</div>
        <div className="k">Rates</div>
        <div className="v">
          Chat {money(profile.rate_chat_per_msg)}/msg · Call {money(profile.rate_call_per_min)}/min · Video {money(profile.rate_video_per_min)}/min
        </div>
        <div className="k">Super-chat min</div><div className="v">{money(profile.super_chat_min_price)}</div>
        <div className="k">Rating</div><div className="v">⭐ {profile.avg_rating} ({profile.review_count} reviews) · {profile.followers} followers</div>
        <div className="k">Bio</div><div className="v">{text(profile.bio)}</div>
        <div className="k">Joined</div><div className="v">{dateTime(profile.created_at)}</div>
      </div>

      <div className="stat-grid">
        <Stat label="Available balance" value={money(earnings.available_balance)} />
        <Stat label="Earned (consultations)" value={money(earnings.earned_consultations)} />
        <Stat label="Live super chat" value={money(earnings.live_super_chat_gross)} />
        <Stat label="Live gifts" value={money(earnings.live_gift_gross)} />
        <Stat label="Total paid out" value={money(earnings.total_paid_out)} />
        <Stat label="Pending payout requests" value={String(earnings.pending_payout_requests)} />
      </div>

      {kyc && (
        <>
          <SectionTitle>KYC details</SectionTitle>
          <div className="kv">
            <div className="k">Full name</div><div className="v">{text(kyc.full_name)}</div>
            <div className="k">Date of birth</div><div className="v">{dateOnly(kyc.dob)}</div>
            <div className="k">Address</div><div className="v">{text(kyc.address)}</div>
            <div className="k">ID type</div><div className="v">{text(kyc.id_type)}</div>
            <div className="k">PAN</div><div className="v mono">{text(kyc.pan_number)}</div>
            <div className="k">Aadhaar</div><div className="v mono">{kyc.aadhaar_last4 ? `•••• ${kyc.aadhaar_last4}` : <span className="faint">—</span>}</div>
            <div className="k">Bank account</div>
            <div className="v mono">
              {kyc.bank_account_holder ? `${kyc.bank_account_holder} · ` : ''}
              {kyc.bank_account_last4 ? `•••• ${kyc.bank_account_last4}` : '—'}
              {kyc.bank_ifsc ? ` · ${kyc.bank_ifsc}` : ''}
            </div>
            <div className="k">Submitted</div><div className="v">{dateTime(kyc.submitted_at)}</div>
            <div className="k">Reviewed</div><div className="v">{dateTime(kyc.reviewed_at)}</div>
            <div className="k">Reviewer notes</div><div className="v">{text(kyc.reviewer_notes)}</div>
          </div>
        </>
      )}

      <SectionTitle>Recent payouts</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Status</th>
              <th>Bank A/C</th>
              <th>IFSC</th>
              <th>Paid at</th>
              <th>Requested</th>
            </tr>
          </thead>
          <tbody>
            {payouts.recent.length === 0 && <EmptyRow span={6} />}
            {payouts.recent.map((p) => (
              <tr key={p.id}>
                <td data-label="Amount">{money(p.amount)}</td>
                <td data-label="Status">{text(p.status)}</td>
                <td data-label="Bank A/C" className="mono">{p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : <span className="faint">—</span>}</td>
                <td data-label="IFSC" className="mono">{text(p.ifsc)}</td>
                <td data-label="Paid at">{dateTime(p.paid_at)}</td>
                <td data-label="Requested">{dateTime(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>
        Recent consultations ({consultations.completed}/{consultations.total} completed)
      </SectionTitle>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Charged</th>
              <th>Payout</th>
              <th>Duration</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {consultations.recent.length === 0 && <EmptyRow span={7} />}
            {consultations.recent.map((c) => (
              <tr key={c.id}>
                <td data-label="Customer">{text(c.user_name)}</td>
                <td data-label="Type">{text(c.type)}</td>
                <td data-label="Status">{text(c.status)}</td>
                <td data-label="Charged">{money(c.amount_charged)}</td>
                <td data-label="Payout">{money(c.astrologer_payout)}</td>
                <td data-label="Duration">{durationLabel(c.duration_seconds)}</td>
                <td data-label="When">{dateTime(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

