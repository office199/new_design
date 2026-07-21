import type { ReactNode } from 'react'

export type Row = Record<string, unknown>

export interface Column {
  key: string
  label: string
  render?: (value: unknown, row: Row) => ReactNode
  mono?: boolean
}

interface DataTableProps {
  columns: Column[]
  rows: Row[]
  /** Optional — when set, rows become clickable (e.g. to open a detail drawer). */
  onRowClick?: (row: Row) => void
}

export function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  if (rows.length === 0) {
    return <div className="empty">No records found.</div>
  }
  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table className="table table-cards">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={(row.id as string) ?? i}
              className={onRowClick ? 'row-clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={c.mono ? 'mono' : undefined}>
                  {c.render ? c.render(row[c.key], row) : cell(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="faint">—</span>
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
