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
      <div className="page-head spread">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="row">
          {searchable && <SearchBox value={search} onChange={setSearch} />}
          {actions}
          <button className="btn-ghost" onClick={paged.reload}>Refresh</button>
        </div>
      </div>

      {paged.error && <div className="error-banner">{paged.error}</div>}

      {paged.loading && paged.rows.length === 0 ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={visible}
            onRowClick={rowDetail ? (row) => setDetailId(row.id as string) : undefined}
          />
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
