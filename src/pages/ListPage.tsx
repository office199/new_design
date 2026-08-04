import { useMemo, useState, type ReactNode } from 'react'
import { DataTable, type Column, type Row } from '../components/DataTable'
import { DetailDrawer, type DetailKind } from '../components/DetailDrawer'
import { ChatTranscriptModal } from '../components/ChatTranscriptModal'
import { Pager, SearchBox } from '../components/ListControls'
import { usePagedData } from '../hooks/usePagedData'
import { PageHeader, Card } from '../components/ui/PageShell'

export type RowDetailKind = DetailKind | 'chatTranscript'

interface ListPageProps {
  title: string
  subtitle?: string
  endpoint: string
  columns: Column[]
  actions?: ReactNode
  searchable?: boolean
  rowDetail?: RowDetailKind
}

function rowMatches(row: Row, needle: string): boolean {
  const q=needle.toLowerCase()
  return Object.values(row).some(v=>{
    if(v==null) return false
    if(typeof v==='object') return JSON.stringify(v).toLowerCase().includes(q)
    return String(v).toLowerCase().includes(q)
  })
}

export default function ListPage({ title, subtitle, endpoint, columns, actions, searchable=true, rowDetail }: ListPageProps){
  const paged = usePagedData<Row>(endpoint)
  const [search,setSearch]=useState('')
  const [detailId,setDetailId]=useState<string|null>(null)

  const visible = useMemo(()=> search.trim() ? paged.rows.filter(r=>rowMatches(r,search.trim())) : paged.rows, [paged.rows,search])

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {searchable && <SearchBox value={search} onChange={setSearch} />}
            {actions}
            <button onClick={paged.reload} className="grid h-[42px] w-[42px] place-items-center rounded-full border border-border-soft bg-surface-raised text-ivory-dim hover:text-ivory hover:border-border-mid shadow-sm transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </>
        }
        icon={<span className="text-[18px]">📋</span>}
      />

      {paged.error && (
        <div className="flex gap-3 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-[13px] text-red-300"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{paged.error}</div>
      )}

      {paged.loading && paged.rows.length===0 ? (
        <Card>
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-5 w-1/3 rounded-full bg-surface-2" />
            <div className="grid gap-2">
              {Array.from({length:6}).map((_,i)=><div key={i} className="h-14 rounded-xl bg-surface-1" style={{animationDelay:`${i*60}ms`}}/>)}
            </div>
          </div>
        </Card>
      ) : (
        <>
          <DataTable columns={columns} rows={visible} onRowClick={rowDetail ? (row)=>setDetailId(row.id as string) : undefined} loading={false} />
          <Pager page={paged.page} size={paged.size} total={search.trim()?null:paged.total} hasPrev={paged.hasPrev} hasNext={!search.trim()&&paged.hasNext} onPage={paged.setPage} onSize={paged.setSize} shown={visible.length} />
        </>
      )}

      {rowDetail==='chatTranscript' ? <ChatTranscriptModal consultationId={detailId} onClose={()=>setDetailId(null)} /> : rowDetail && <DetailDrawer kind={rowDetail} id={detailId} onClose={()=>setDetailId(null)} />}
    </div>
  )
}
