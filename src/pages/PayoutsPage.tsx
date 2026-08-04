import { useMemo, useState } from 'react'
import { adminApi } from '../api/endpoints'
import { Pager, SearchBox } from '../components/ListControls'
import { usePagedData } from '../hooks/usePagedData'
import { PageHeader, Card } from '../components/ui/PageShell'

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

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'PENDING', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  requested: { label: 'PENDING', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  approved: { label: 'APPROVED', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  paid: { label: 'PAID', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  completed: { label: 'PAID', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  rejected: { label: 'REJECTED', cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
  failed: { label: 'FAILED', cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
}

export default function PayoutsPage() {
  const paged = usePagedData<Payout>('/admin/payouts')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((p) => [p.astrologer_name, p.astrologer_id, p.status, p.ifsc].some((v) => v && String(v).toLowerCase().includes(q)))
  }, [paged.rows, search])

  const totals = useMemo(() => {
    let pendingAmt = 0
    let pendingCount = 0
    let paidAmt = 0
    for (const p of paged.rows) {
      const amt = Number(p.amount) || 0
      const st = (p.status || '').toLowerCase()
      if (st === 'pending' || st === 'requested') {
        pendingAmt += amt
        pendingCount++
      } else if (st === 'paid' || st === 'completed') {
        paidAmt += amt
      }
    }
    return { pendingAmt, pendingCount, paidAmt }
  }, [paged.rows])

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

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Bank Settlements & Astrologer Payouts"
        subtitle="Review, approve and disburse bank withdrawals for network astrologers."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Astrologer, status, IFSC…" />
            <button
              onClick={paged.reload}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-emerald-400/40 transition-colors"
            >
              ↻
            </button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Withdrawal Amount</div>
          <div className="mt-2 font-display text-[26px] font-black text-amber-300">₹{totals.pendingAmt.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">{totals.pendingCount} requests awaiting approval</div>
        </div>
        <div className="rounded-[22px] border border-emerald-500/25 bg-emerald-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Settled (Paid)</div>
          <div className="mt-2 font-display text-[26px] font-black text-emerald-400">₹{totals.paidAmt.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Disbursed via bank transfer</div>
        </div>
        <div className="rounded-[22px] border border-white/12 bg-white/6 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ivory-faint">Total Payout Requests</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{paged.total ?? paged.rows.length}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Historical withdrawal logs</div>
        </div>
      </div>

      {(paged.error || error) && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error ?? error}</div>}

      {paged.loading && paged.rows.length === 0 ? (
        <Card className="p-12 text-center text-ivory-faint">Loading payout requests…</Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                  <th className="px-5 py-3.5">Astrologer</th>
                  <th className="px-5 py-3.5">Requested Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Bank Account & IFSC</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60">
                {visible.map((p) => {
                  const st = STATUS[p.status] ?? STATUS.pending
                  const pending = p.status === 'pending' || p.status === 'requested'
                  const approved = p.status === 'approved'

                  return (
                    <tr key={p.id} className="hover:bg-surface-1/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[12px] font-black text-emerald-300">
                            {(p.astrologer_name || p.astrologer_id || 'A')[0].toUpperCase()}
                          </div>
                          <div className="font-bold text-[14px] text-ivory">
                            {p.astrologer_name ?? <span className="font-mono text-[11px] text-ivory-faint">{p.astrologer_id.slice(0, 8)}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[14px] font-bold text-amber-300">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px]">
                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-ivory">
                          {p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : '—'} {p.ifsc ? `(${p.ifsc})` : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[12px] text-ivory-faint">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {pending ? (
                          <div className="inline-flex gap-2">
                            <button
                              disabled={busyId === p.id}
                              onClick={() => run(p.id, () => adminApi.approvePayout(p.id))}
                              className="h-8 rounded-full bg-emerald-500 px-4 text-[12px] font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
                            >
                              {busyId === p.id ? '…' : 'Approve'}
                            </button>
                            <button
                              disabled={busyId === p.id}
                              onClick={() => run(p.id, () => adminApi.rejectPayout(p.id))}
                              className="h-8 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-[12px] font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : approved ? (
                          <button
                            disabled={busyId === p.id}
                            onClick={() => run(p.id, () => adminApi.markPayoutPaid(p.id))}
                            className="h-8 rounded-full bg-saffron px-4 text-[12px] font-bold text-black hover:brightness-110 disabled:opacity-50 shadow-sm"
                          >
                            {busyId === p.id ? '…' : 'Mark Disbursed'}
                          </button>
                        ) : (
                          <span className="text-[12px] text-ivory-faint">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[13px] text-ivory-faint">
                      No payout requests logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 p-4 md:hidden">
            {visible.map((p) => {
              const st = STATUS[p.status] ?? STATUS.pending
              const pending = p.status === 'pending' || p.status === 'requested'
              const approved = p.status === 'approved'

              return (
                <div key={p.id} className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold">
                        {(p.astrologer_name || 'A')[0].toUpperCase()}
                      </div>
                      <div className="font-bold text-[14px] text-ivory">{p.astrologer_name ?? p.astrologer_id.slice(0, 8)}</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-[16px] font-bold text-amber-300">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    <span className="text-[11px] text-ivory-faint">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {pending && (
                      <>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => run(p.id, () => adminApi.approvePayout(p.id))}
                          className="flex-1 h-9 rounded-full bg-emerald-500 text-white text-[12px] font-bold"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => run(p.id, () => adminApi.rejectPayout(p.id))}
                          className="flex-1 h-9 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {approved && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => run(p.id, () => adminApi.markPayoutPaid(p.id))}
                        className="flex-1 h-9 rounded-full bg-saffron text-black text-[12px] font-bold"
                      >
                        Mark Disbursed
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
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
        </Card>
      )}
    </div>
  )
}
