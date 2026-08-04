import { useMemo, useState } from 'react'
import { DetailDrawer } from '../components/DetailDrawer'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface LedgerRow {
  id?: string
  user_id?: string
  name?: string | null
  mobile?: string | null
  total_credit: string | number
  total_debit: string | number
  balance: string | number
}

export default function WalletLedgerPage() {
  const paged = usePagedData<LedgerRow>('/admin/wallet/ledger')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((r) => [r.name, r.mobile, r.user_id].some((v) => v && String(v).toLowerCase().includes(q)))
  }, [paged.rows, search])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Customer Wallet Ledgers"
        subtitle="Per-user cumulative wallet credits, debits and current balances. Select any row to inspect seeker profile."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search user name or mobile…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-emerald-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading wallet ledger…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No customer ledger records found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">Customer / Seeker</th>
                    <th className="px-5 py-3.5">Mobile</th>
                    <th className="px-5 py-3.5">Total Credited</th>
                    <th className="px-5 py-3.5">Total Debited</th>
                    <th className="px-5 py-3.5">Current Balance</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((r, idx) => {
                    const custId = r.id || r.user_id || ''
                    return (
                      <tr key={custId || idx} className="hover:bg-surface-1/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-[12px] font-bold text-emerald-400">
                              {(r.name || 'S')[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-[13.5px] text-ivory group-hover:text-emerald-400 transition-colors">
                              {r.name ?? 'Unnamed Seeker'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">{r.mobile ?? '—'}</td>
                        <td className="px-5 py-4 font-mono text-[13px] font-bold text-emerald-400">
                          +₹{Number(r.total_credit || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 font-mono text-[13px] font-bold text-red-400">
                          −₹{Number(r.total_debit || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 font-mono text-[13px] font-bold">
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-amber-400">
                            ₹{Number(r.balance || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setDetailId(custId)}
                            className="rounded-full border border-border-soft bg-surface-1 px-4 py-1.5 text-[11px] font-bold text-ivory hover:border-emerald-400/40 hover:text-emerald-400 transition-all"
                          >
                            Profile →
                          </button>
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

      <DetailDrawer kind="customer" id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
