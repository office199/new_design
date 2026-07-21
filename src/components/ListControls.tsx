interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/** Client-side filter input matching the console design system. */
export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <div style={{ position: 'relative', maxWidth: 280 }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-faint)', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        style={{ paddingLeft: 40 }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: 'var(--ivory-faint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-xs)',
            width: 24,
            height: 24,
          }}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
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
      className="spread"
      style={{ marginTop: 18, flexWrap: 'wrap', gap: 16, fontSize: 13, padding: '14px 18px', background: 'var(--surface-1)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ivory-faint)' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="muted">
          {total != null ? (
            <>
              Showing <strong>{from}–{to}</strong> of <strong>{total.toLocaleString('en-IN')}</strong>
            </>
          ) : (
            <>Page <strong>{page}</strong>{shown != null ? ` · ${shown} shown` : ''}</>
          )}
        </span>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <select
          value={size}
          onChange={(e) => {
            onSize(Number(e.target.value))
            onPage(1)
          }}
          style={{ width: 'auto', minWidth: 120 }}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
        <button className="btn-ghost btn-icon-sm" disabled={!hasPrev} onClick={() => onPage(page - 1)} title="Previous page">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="mono" style={{ minWidth: 32, textAlign: 'center', padding: '8px 0', fontWeight: 600 }}>
          {page}
        </span>
        <button className="btn-ghost btn-icon-sm" disabled={!hasNext} onClick={() => onPage(page + 1)} title="Next page">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
