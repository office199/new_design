import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { KYCReviewItem, KYCStatus } from '../api/types'
import { StatusBadge } from '../components/Badge'

const FILTERS: { label: string; value: KYCStatus | '' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: '' },
]

export default function KYCQueuePage() {
  const [filter, setFilter] = useState<KYCStatus | ''>('pending')
  const [items, setItems] = useState<KYCReviewItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<KYCReviewItem | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi
      .listAstrologers(filter || undefined)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    // Intentional data-loading effect (sets a loading flag then fetches).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function decide(id: string, approve: boolean, notes: string) {
    try {
      if (approve) await adminApi.approve(id, notes)
      else await adminApi.reject(id, notes)
      setActive(null)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>KYC Review</h1>
        <p className="muted">Verify astrologer applications and approve or reject.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <span className="faint" style={{ fontSize: 13 }}>Status</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value as KYCStatus | '')}>
          {FILTERS.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">No applications in this view.</div>
        ) : (
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>PAN</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.astrologer_id}>
                  <td data-label="Name">{it.full_name || it.display_name || <span className="faint">—</span>}</td>
                  <td data-label="Mobile" className="mono">{it.mobile || '—'}</td>
                  <td data-label="PAN" className="mono">{it.pan_number || '—'}</td>
                  <td data-label="Status"><StatusBadge status={it.kyc_status} /></td>
                  <td data-label="Submitted" className="faint">{it.submitted_at ? new Date(it.submitted_at).toLocaleDateString() : '—'}</td>
                  <td data-actions style={{ textAlign: 'right' }}>
                    <button className="btn-ghost" onClick={() => setActive(it)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {active && <ReviewModal item={active} onClose={() => setActive(null)} onDecide={decide} />}
    </div>
  )
}

function ReviewModal({
  item,
  onClose,
  onDecide,
}: {
  item: KYCReviewItem
  onClose: () => void
  onDecide: (id: string, approve: boolean, notes: string) => void
}) {
  const [notes, setNotes] = useState('')
  const prof = item.professional as Record<string, unknown>
  const pending = item.kyc_status === 'pending'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread">
          <h2 style={{ fontSize: 20 }}>{item.full_name || item.display_name || 'Applicant'}</h2>
          <StatusBadge status={item.kyc_status} />
        </div>

        <div className="kv">
          <span className="k">Mobile</span><span className="v mono">{item.mobile || '—'}</span>
          <span className="k">Email</span><span className="v">{item.email || '—'}</span>
          <span className="k">PAN</span><span className="v mono">{item.pan_number || '—'}</span>
          <span className="k">Aadhaar</span><span className="v mono">{item.aadhaar_last4 ? `•••• ${item.aadhaar_last4}` : '—'}</span>
          <span className="k">Bank A/C</span><span className="v mono">{item.bank_account_last4 ? `•••• ${item.bank_account_last4}` : '—'}</span>
          <span className="k">IFSC</span><span className="v mono">{item.bank_ifsc || '—'}</span>
          <span className="k">Experience</span><span className="v">{String(prof?.years_experience ?? '—')} yrs</span>
          <span className="k">Skills</span><span className="v">{Array.isArray(prof?.skills) ? (prof.skills as string[]).join(', ') : '—'}</span>
          <span className="k">Languages</span><span className="v">{Array.isArray(prof?.languages) ? (prof.languages as string[]).join(', ') : '—'}</span>
        </div>

        {pending && (
          <>
            <div className="field">
              <label>Reviewer notes (optional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-danger" onClick={() => onDecide(item.astrologer_id, false, notes)}>Reject</button>
              <button className="btn-success" onClick={() => onDecide(item.astrologer_id, true, notes)}>Approve</button>
            </div>
          </>
        )}
        {!pending && (
          <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
