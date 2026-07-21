import React, { useMemo, useState } from 'react'
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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  approved: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  rejected: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
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
      <div className="page-head-gradient spread">
        <div>
          <h1>Withdraw Requests</h1>
          <p className="muted">Approve payout requests, then mark them paid once settled.</p>
        </div>
        <div className="row">
          <SearchBox value={search} onChange={setSearch} placeholder="Astrologer, status…" />
          <button className="btn-ghost" onClick={paged.reload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {(paged.error || error) && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {paged.error ?? error}
        </div>
      )}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Loading payout requests...
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Astrologer</th><th>Amount</th><th>Status</th>
                  <th>A/C</th><th>IFSC</th><th>Requested</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Astrologer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--saffron-soft)', color: 'var(--saffron-bright)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
                          {(p.astrologer_name || p.astrologer_id).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.astrologer_name ?? <span className="mono faint">{p.astrologer_id.slice(0, 8)}</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Amount">
                      <span className="mono text-warning" style={{ fontWeight: 700, fontSize: 16 }}>₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-pending'}`}>
                        {STATUS_ICONS[p.status]}
                        {p.status}
                      </span>
                    </td>
                    <td data-label="A/C" className="mono">{p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : '—'}</td>
                    <td data-label="IFSC" className="mono">{p.ifsc ?? '—'}</td>
                    <td data-label="Requested" className="faint">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isPending(p.status) && (
                        <>
                          <button
                            className="btn-success"
                            disabled={busyId === p.id}
                            onClick={() => run(p.id, () => adminApi.approvePayout(p.id))}
                          >
                            {busyId === p.id ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            Approve
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
                          {busyId === p.id ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                          )}
                          Mark paid
                        </button>
                      )}
                      {!isPending(p.status) && !isApproved(p.status) && (
                        <span className="faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td data-empty colSpan={7}>
                    <div className="empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
                        <rect x="2.5" y="5" width="19" height="14" rx="2" />
                        <circle cx="12" cy="12" r="2.6" />
                        <path d="M6 9v6M18 9v6" />
                      </svg>
                      No payout requests at the moment.
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
