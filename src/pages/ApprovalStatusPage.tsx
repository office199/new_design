import { useMemo, useState } from 'react'
import { StatusBadge } from '../components/Badge'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'
import type { KYCStatus } from '../api/types'

interface ApprovalRow {
  id?: string
  name?: string | null
  mobile?: string | null
  kyc_status: KYCStatus
  submitted_at?: string | null
  reviewed_at?: string | null
}

export default function ApprovalStatusPage() {
  const paged = usePagedData<ApprovalRow>('/admin/approvals')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((r) => [r.name, r.mobile, r.kyc_status].some((v) => v && String(v).toLowerCase().includes(q)))
  }, [paged.rows, search])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="KYC Approval Audit Trail"
        subtitle="Verification history and status tracking for all astrologer applications."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search astrologer or status…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-violet-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading approval log…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No approval status records found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">Astrologer</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Verification Status</th>
                    <th className="px-5 py-3.5">Submitted On</th>
                    <th className="px-5 py-3.5 text-right">Reviewed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-1/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold text-[12px]">
                            {(r.name || 'A')[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-[13.5px] text-ivory">{r.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">{r.mobile ?? '—'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.kyc_status} />
                      </td>
                      <td className="px-5 py-4 text-[12px] text-ivory-faint">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-[12px] text-ivory-faint">
                        {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending Review'}
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
