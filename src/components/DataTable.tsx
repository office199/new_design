import type { ReactNode } from 'react'

export type Row = Record<string, unknown>
export interface Column { 
  key: string; 
  label: string; 
  render?: (value: unknown, row: Row) => ReactNode; 
  mono?: boolean; 
  sortable?: boolean;
  width?: string;
}

interface DataTableProps {
  columns: Column[]
  rows: Row[]
  onRowClick?: (row: Row) => void
  loading?: boolean
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded-full bg-surface-2 animate-pulse" style={{ maxWidth: i === 0 ? '140px' : undefined }} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-[52px] flex-1 rounded-xl bg-surface-1 animate-pulse" style={{ animationDelay: `${r*60 + c*25}ms` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DataTable({ columns, rows, onRowClick, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <SkeletonRows cols={columns.length} />
      </div>
    )
  }

  if (rows.length===0) {
    return (
      <div className="grid place-items-center rounded-[20px] border border-dashed border-border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-1 border border-border-soft text-ivory-faint shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h.01M15 15h.01M9 15h.01M15 9h.01"/><path d="M9 12h6"/></svg>
        </div>
        <p className="mt-4 text-[15px] font-semibold">No records found</p>
        <p className="mt-1 max-w-[32ch] text-[13px] leading-relaxed text-ivory-faint">Try adjusting filters or search to find what you're looking for. Data will appear here when available.</p>
        <div className="mt-5 flex items-center gap-2">
          <span className="h-px w-8 bg-border-soft" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-ivory-faint">Empty state</span>
          <span className="h-px w-8 bg-border-soft" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-[1]">
            <tr className="border-b border-border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] backdrop-blur">
              {columns.map(c=>(
                <th key={c.key} style={c.width ? { width: c.width } : undefined} className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">
                  <span className="inline-flex items-center gap-1.5">{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft/50">
            {rows.map((row,i)=>(
              <tr
                key={(row.id as string) ?? i}
                onClick={onRowClick ? ()=>onRowClick(row) : undefined}
                className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'} `}
              >
                {columns.map(c=>(
                  <td key={c.key} className={`px-5 py-4 text-[13.5px] leading-[1.35] ${c.mono ? 'font-mono text-[12.5px]' : ''}`}>
                    <span className="group-hover:translate-x-[1px] inline-block transition-transform duration-200">
                      {c.render ? c.render(row[c.key], row) : cell(row[c.key])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border-soft/60">
        {rows.map((row,i)=>(
          <div
            key={(row.id as string) ?? i}
            onClick={onRowClick ? ()=>onRowClick(row) : undefined}
            className={`p-4 transition-colors ${onRowClick ? 'active:bg-surface-1 cursor-pointer' : ''}`}
          >
            <div className="grid gap-2.5">
              {columns.slice(0,4).map(c=>(
                <div key={c.key} className="flex items-start justify-between gap-3">
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-ivory-faint shrink-0 mt-0.5 min-w-[88px]">{c.label}</span>
                  <span className={`text-right text-[13px] flex-1 ${c.mono?'font-mono text-[12.5px]':''}`}>
                    {c.render ? c.render(row[c.key], row) : cell(row[c.key])}
                  </span>
                </div>
              ))}
              {columns.length>4 && (
                <details className="group/details">
                  <summary className="list-none flex items-center justify-between cursor-pointer rounded-full bg-surface-1 border border-border-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ivory-faint mt-1">
                    <span>+{columns.length-4} more</span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-2 group-open/details:rotate-180 transition-transform">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-2.5 border-t border-border-soft/60 pt-3">
                    {columns.slice(4).map(c=>(
                      <div key={c.key} className="flex items-start justify-between gap-3">
                        <span className="text-[10.5px] font-bold uppercase tracking-wide text-ivory-faint shrink-0 mt-0.5 min-w-[88px]">{c.label}</span>
                        <span className="text-right text-[13px] flex-1">
                          {c.render ? c.render(row[c.key], row) : cell(row[c.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function cell(v: unknown): ReactNode {
  if (v===null||v===undefined||v==='') return <span className="inline-flex items-center gap-1 text-ivory-faint"><span className="h-px w-3 bg-border-soft hidden sm:block"/>—</span>
  if (typeof v==='boolean') return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${v ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-2 text-ivory-faint border-border-soft'}`}><span className={`h-1.5 w-1.5 rounded-full ${v?'bg-emerald-500':'bg-ivory-faint'}`}/>{v?'Yes':'No'}</span>
  if (Array.isArray(v)) return <span className="line-clamp-1 text-ivory-dim">{v.join(', ') || '—'}</span>
  if (typeof v==='object') return <span className="font-mono text-[11px] text-ivory-faint max-w-[200px] truncate inline-block">{JSON.stringify(v)}</span>
  const s=String(v)
  if (s.length>64) return <span title={s} className="line-clamp-2">{s.slice(0,64)}…</span>
  return <span className="text-ivory font-[450]">{s}</span>
}
