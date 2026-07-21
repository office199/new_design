import { useMemo, useState } from 'react'
import { adminApi } from '../api/endpoints'
import { Pager, SearchBox } from '../components/ListControls'
import { usePagedData } from '../hooks/usePagedData'

interface Payout {
  id: string
  astrologer_id: string
  astrologer_name?: string | null
  amount: string
  status: string
  bank_account_last4: string | null
  ifsc: string | null
  created_at: string | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending',
  requested: 'badge-pending',
  approved: 'badge-approved',
  paid: 'badge-approved',
  completed: 'badge-approved',
  rejected: 'badge-rejected',
  failed: 'badge-rejected',
}

/** Withdraw requests with approve / mark-paid / reject actions. */
export default function PayoutsPage() {
  const paged = usePagedData<Payout>('/admin/payouts')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((p) =>
      [p.astrologer_name, p.astrologer_id, p.status, p.ifsc].some(
        (v) => v && String(v).toLowerCase().includes(q),
      ),
    )
  }, [paged.rows, search])

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await fn()
      paged.reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  function isPending(s: string) {
    return s === 'pending' || s === 'requested'
  }
  function isApproved(s: string) {
    return s === 'approved'
  }

  return (
    <div>
      <div className="page-head spread">
        <div>
          <h1>Withdraw Requests</h1>
          <p className="muted">Approve payout requests, then mark them paid once settled.</p>
        </div>
        <div className="row">
          <SearchBox value={search} onChange={setSearch} placeholder="Astrologer, status…" />
          <button className="btn-ghost" onClick={paged.reload}>Refresh</button>
        </div>
      </div>

      {(paged.error || error) && <div className="error-banner">{paged.error ?? error}</div>}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Astrologer</th><th>Amount</th><th>Status</th>
                  <th>A/C</th><th>IFSC</th><th>Requested</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.astrologer_name ?? (
                        <span className="mono faint">{p.astrologer_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="mono">₹{p.amount}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-pending'}`}>{p.status}</span>
                    </td>
                    <td className="mono">{p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : '—'}</td>
                    <td className="mono">{p.ifsc ?? '—'}</td>
                    <td className="faint">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isPending(p.status) && (
                        <>
                          <button
                            className="btn-success"
                            disabled={busyId === p.id}
                            onClick={() => run(p.id, () => adminApi.approvePayout(p.id))}
                          >
                            {busyId === p.id ? '…' : 'Approve'}
                          </button>
                          <button
                            className="btn-danger"
                            style={{ marginLeft: 8 }}
                            disabled={busyId === p.id}
                            onClick={() => run(p.id, () => adminApi.rejectPayout(p.id))}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {isApproved(p.status) && (
                        <button
                          className="btn-primary"
                          disabled={busyId === p.id}
                          onClick={() => run(p.id, () => adminApi.markPayoutPaid(p.id))}
                        >
                          {busyId === p.id ? '…' : 'Mark paid'}
                        </button>
                      )}
                      {!isPending(p.status) && !isApproved(p.status) && (
                        <span className="faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={7}><div className="empty">No payout requests.</div></td></tr>
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
    </div>
  )
}
