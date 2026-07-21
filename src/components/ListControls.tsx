interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/** Client-side filter input matching the console design system. */
export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Search…'}
      style={{ maxWidth: 260 }}
    />
  )
}

interface PagerProps {
  page: number
  size: number
  total: number | null
  hasPrev: boolean
  hasNext: boolean
  onPage: (p: number) => void
  onSize: (s: number) => void
  /** Count of rows currently visible after any client-side filter. */
  shown?: number
}

const SIZES = [10, 25, 50, 100]

/** Page navigation + page-size selector wired to the backend page/size params. */
export function Pager({ page, size, total, hasPrev, hasNext, onPage, onSize, shown }: PagerProps) {
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = total != null ? Math.min(page * size, total) : (page - 1) * size + (shown ?? size)
  return (
    <div
      className="row spread"
      style={{ marginTop: 14, flexWrap: 'wrap', gap: 12, fontSize: 13 }}
    >
      <div className="muted">
        {total != null ? (
          <>Showing {from}–{to} of {total}</>
        ) : (
          <>Page {page}{shown != null ? ` · ${shown} shown` : ''}</>
        )}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <select
          value={size}
          onChange={(e) => {
            onSize(Number(e.target.value))
            onPage(1)
          }}
          style={{ width: 'auto' }}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
        <button className="btn-ghost" disabled={!hasPrev} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <span className="mono" style={{ minWidth: 24, textAlign: 'center' }}>{page}</span>
        <button className="btn-ghost" disabled={!hasNext} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
