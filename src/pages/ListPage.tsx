import { useMemo, useState, type ReactNode } from 'react'
import { DataTable, type Column, type Row } from '../components/DataTable'
import { DetailDrawer, type DetailKind } from '../components/DetailDrawer'
import { ChatTranscriptModal } from '../components/ChatTranscriptModal'
import { Pager, SearchBox } from '../components/ListControls'
import { usePagedData } from '../hooks/usePagedData'

/** Everything ListPage's rowDetail can open: the shared DetailDrawer kinds,
 * plus the dedicated chat transcript viewer (not a DetailDrawer stat-tile
 * layout — a scrollable message thread). */
export type RowDetailKind = DetailKind | 'chatTranscript'

interface ListPageProps {
  title: string
  subtitle?: string
  endpoint: string
  columns: Column[]
  actions?: ReactNode
  /** Disable the client-side search box (default enabled). */
  searchable?: boolean
  /**
   * Opt-in: when set, rows become clickable. `customer`/`astrologer` open the
   * shared DetailDrawer (fetches `/{kind}s/{row.id}/detail`); `chatTranscript`
   * opens ChatTranscriptModal (fetches `/admin/chat-rooms/{row.id}/messages`).
   */
  rowDetail?: RowDetailKind
}

function rowMatches(row: Row, needle: string): boolean {
  const q = needle.toLowerCase()
  return Object.values(row).some((v) => {
    if (v == null) return false
    if (typeof v === 'object') return JSON.stringify(v).toLowerCase().includes(q)
    return String(v).toLowerCase().includes(q)
  })
}

/** Generic admin list page: paginated fetch, client-side search, refresh. */
export default function ListPage({
  title,
  subtitle,
  endpoint,
  columns,
  actions,
  searchable = true,
  rowDetail,
}: ListPageProps) {
  const paged = usePagedData<Row>(endpoint)
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const visible = useMemo(
    () => (search.trim() ? paged.rows.filter((r) => rowMatches(r, search.trim())) : paged.rows),
    [paged.rows, search],
  )

  return (
    <div>
      <div className="page-head-gradient spread">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="row">
          {searchable && <SearchBox value={search} onChange={setSearch} />}
          {actions}
          <button className="btn-ghost" onClick={paged.reload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {paged.error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {paged.error}
        </div>
      )}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Loading data...
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <DataTable
              columns={columns}
              rows={visible}
              onRowClick={rowDetail ? (row) => setDetailId(row.id as string) : undefined}
            />
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

      {rowDetail === 'chatTranscript' ? (
        <ChatTranscriptModal consultationId={detailId} onClose={() => setDetailId(null)} />
      ) : (
        rowDetail && <DetailDrawer kind={rowDetail} id={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}
