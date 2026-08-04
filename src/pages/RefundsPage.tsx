import { useMemo, useState } from 'react'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface RefundRow {
  id?: string
  user_id: string
  amount: string | number
  reference_id?: string | null
  created_at?: string | null
  status?: string | null
}

export default function RefundsPage() {
  const paged = usePagedData<RefundRow>('/admin/refunds')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((r) => [r.user_id, r.reference_id, r.status].some((v) => v && String(v).toLowerCase().includes(q)))
  }, [paged.rows, search])

  const totalRefunded = useMemo(() => {
    return paged.rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  }, [paged.rows])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Refund History & Audit"
        subtitle="Track customer consultation refunds, wallet reversals and satisfaction adjustments."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10.5A2.5 2.5 0 0 1 17 11.5v7.5" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search user ID or consultation…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-amber-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Total Refunds Processed</div>
          <div className="mt-2 font-display text-[26px] font-black text-amber-300">₹{totalRefunded.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Cumulative reversed wallet credits</div>
        </div>
        <div className="rounded-[22px] border border-white/12 bg-white/6 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ivory-faint">Total Cases</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{paged.total ?? paged.rows.length}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Logged refund cases</div>
        </div>
      </div>

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading refund log…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No refund records found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Consultation Ref</th>
                    <th className="px-5 py-3.5">Refund Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-1/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-[12px]">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ivory">
                          {r.user_id ? String(r.user_id).slice(0, 10) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">
                        {r.reference_id ? String(r.reference_id).slice(0, 12) : '—'}
                      </td>
                      <td className="px-5 py-4 font-mono text-[14px] font-bold text-amber-400">
                        ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                          COMPLETED
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[12px] text-ivory-faint">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
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
      </Card>
    </div>
  )
}
