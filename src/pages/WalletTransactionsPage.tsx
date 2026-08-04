import { useMemo, useState } from 'react'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface TxnRow {
  id?: string
  user_id: string
  type: string
  amount: string | number
  balance_after: string | number
  status: string
  created_at: string | null
}

function txnKind(type?: string) {
  const t = (type ?? '').toLowerCase()
  if (/credit|recharge|top.?up|refund|cashback|bonus/.test(t)) return 'cr'
  if (/debit|charge|consult|spend|withdraw/.test(t)) return 'dr'
  return 'neutral'
}

export default function WalletTransactionsPage() {
  const paged = usePagedData<TxnRow>('/admin/wallet/transactions')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'cr' | 'dr'>('all')

  const visible = useMemo(() => {
    let list = paged.rows
    if (tab === 'cr') list = list.filter((r) => txnKind(r.type) === 'cr')
    if (tab === 'dr') list = list.filter((r) => txnKind(r.type) === 'dr')

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => [r.user_id, r.type, r.status, String(r.amount)].some((v) => v && String(v).toLowerCase().includes(q)))
    }
    return list
  }, [paged.rows, search, tab])

  const totals = useMemo(() => {
    let cr = 0
    let dr = 0
    for (const r of paged.rows) {
      const amt = Math.abs(Number(r.amount) || 0)
      if (txnKind(r.type) === 'cr') cr += amt
      else if (txnKind(r.type) === 'dr') dr += amt
    }
    return { cr, dr, net: cr - dr }
  }, [paged.rows])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Wallet Financial Statements"
        subtitle="Audited ledger of credits, debits, recharges, refunds and consultations."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search user ID, type, amount…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-emerald-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {/* Financial Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-emerald-500/25 bg-emerald-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">Total Inflow (Credits)</div>
          <div className="mt-2 font-display text-[26px] font-black text-emerald-400">+₹{totals.cr.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Recharges & cashback additions</div>
        </div>
        <div className="rounded-[22px] border border-red-500/25 bg-red-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-400/80">Total Outflow (Debits)</div>
          <div className="mt-2 font-display text-[26px] font-black text-red-400">−₹{totals.dr.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Consultations & withdrawals</div>
        </div>
        <div className="rounded-[22px] border border-white/12 bg-white/6 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ivory-faint">Net Page Flow</div>
          <div className={`mt-2 font-display text-[26px] font-black ${totals.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-ivory-dim">Net movement across page rows</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 w-fit">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'cr', label: '🟢 Credits (+)' },
          { id: 'dr', label: '🔴 Debits (−)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
              tab === t.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading financial statement…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No transactions found for this filter.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Direction</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Balance After</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((r, idx) => {
                    const kind = txnKind(r.type)
                    const amt = Math.abs(Number(r.amount) || 0)
                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-1/50 transition-colors">
                        <td className="px-5 py-4 font-mono text-[12px]">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ivory">
                            {r.user_id ? String(r.user_id).slice(0, 10) : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[13px] capitalize">{(r.type || 'transaction').replace(/_/g, ' ')}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase ${
                              kind === 'cr'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : kind === 'dr'
                                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                : 'border-white/10 bg-white/5 text-ivory-dim'
                            }`}
                          >
                            {kind === 'cr' ? '+ CREDIT' : kind === 'dr' ? '− DEBIT' : '• RECORD'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[14px] font-bold">
                          <span className={kind === 'cr' ? 'text-emerald-400' : kind === 'dr' ? 'text-red-400' : 'text-ivory'}>
                            {kind === 'cr' ? '+' : kind === 'dr' ? '−' : ''}₹{amt.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">₹{Number(r.balance_after || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-[12px]">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                            {r.status || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-[12px] text-ivory-faint">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
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
