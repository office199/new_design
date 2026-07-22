interface SearchBoxProps { value: string; onChange: (v:string)=>void; placeholder?: string; className?: string; }

export function SearchBox({ value, onChange, placeholder, className='' }: SearchBoxProps) {
  return (
    <div className={`relative group ${className}`}>
      <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint group-focus-within:text-saffron transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-3.5-3.5"/>
      </svg>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="h-[42px] w-full rounded-full border border-border-soft bg-surface-raised pl-11 pr-11 text-[13.5px] font-[450] placeholder:text-ivory-faint shadow-[0_1px_2px_rgba(0,0,0,0.06)] focus:border-saffron/40 focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft),0_4px_18px_rgba(0,0,0,0.08)] outline-none transition-all md:w-[280px]"
      />
      {value ? (
        <button onClick={()=>onChange('')} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-surface-2 border border-border-soft text-ivory-faint hover:text-ivory hover:border-border-mid transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-full border border-border-soft bg-surface-1 px-1.5 py-0.5 text-[10px] font-bold text-ivory-faint">⌘K</span>
      )}
    </div>
  )
}

interface PagerProps {
  page: number; size: number; total: number|null; hasPrev: boolean; hasNext: boolean;
  onPage: (p:number)=>void; onSize: (s:number)=>void; shown?: number;
}

const SIZES=[10,25,50,100]

export function Pager({ page, size, total, hasPrev, hasNext, onPage, onSize, shown }: PagerProps) {
  const from = total===0 ? 0 : (page-1)*size+1
  const to = total!=null ? Math.min(page*size, total) : (page-1)*size+(shown??size)
  return (
    <div className="mt-5 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-surface-raised px-4 py-3.5 text-[13px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 text-ivory-dim">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-1 border border-border-soft text-ivory-faint shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <span className="text-[13px]">
          {total!=null ? <>Showing <b className="text-ivory font-semibold">{from}–{to}</b> of <b className="text-ivory font-semibold">{total.toLocaleString('en-IN')}</b></> : <>Page <b className="text-ivory">{page}</b>{shown!=null ? ` · ${shown} rows` : ''}</>}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Per page</span>
          <select value={size} onChange={e=>{onSize(Number(e.target.value)); onPage(1)}} className="h-[38px] rounded-full border border-border-soft bg-surface-1 px-3 pr-8 text-[12.5px] font-medium focus:border-saffron outline-none shadow-sm">
            {SIZES.map(s=><option key={s} value={s}>{s} / page</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border-soft bg-surface-1 p-1 shadow-sm">
          <button disabled={!hasPrev} onClick={()=>onPage(page-1)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 hover:text-ivory hover:border-border-mid transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="min-w-[36px] text-center font-mono text-[12px] font-bold bg-surface-raised border border-border-soft rounded-full px-2 py-1 shadow-sm">{page}</span>
          <button disabled={!hasNext} onClick={()=>onPage(page+1)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 hover:text-ivory hover:border-border-mid transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
