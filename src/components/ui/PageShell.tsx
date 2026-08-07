import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[16px] border border-[rgba(200,147,42,0.3)] bg-[rgba(200,147,42,0.09)] shadow-[0_8px_24px_rgba(200,147,42,0.12)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_30%_18%,rgba(255,255,255,0.5),transparent_60%)]" />
              <span className="relative text-[22px] text-[#A87A1D]">{icon}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-[26px] sm:text-[30px] font-bold tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ivory-dim">{subtitle}</p>}
            <div className="mt-3 zari-line w-20" />
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`relative rounded-[22px] border border-border-soft bg-surface-raised shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] ${hover ? 'hover:border-border-mid hover:shadow-[var(--shadow-2)] hover:-translate-y-2 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionCard({ title, subtitle, actions, children, className='' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-border-soft px-6 py-5 bg-gradient-to-b from-[rgba(200,147,42,0.04)] to-transparent">
          <div className="min-w-0">
            {title && <h3 className="font-display text-[16px] font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-1 text-[12.5px] text-ivory-faint">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </Card>
  )
}

export function StatCard({ label, value, icon, tint, sub }: { label: string; value: string; icon?: ReactNode; tint?: 'amber'|'emerald'|'violet'|'saffron'; sub?: string }) {
  const tints = {
    amber: 'from-[rgba(200,147,42,0.14)] to-[rgba(220,174,75,0.08)] text-[#A87A1D] border-[rgba(200,147,42,0.3)]',
    emerald: 'from-[rgba(30,122,84,0.14)] to-[rgba(53,165,143,0.08)] text-[#1E7A54] border-[rgba(30,122,84,0.3)]',
    violet: 'from-[rgba(14,79,69,0.14)] to-[rgba(124,94,140,0.08)] text-[#0E4F45] border-[rgba(14,79,69,0.3)]',
    saffron: 'from-[rgba(204,106,38,0.14)] to-[rgba(232,164,99,0.08)] text-[#CC6A26] border-[rgba(204,106,38,0.3)]',
  }
  return (
    <div className="sheen-sweep relative overflow-hidden rounded-[22px] border border-border-soft bg-surface-raised p-6 shadow-[var(--shadow-1),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 hover:border-[rgba(200,147,42,0.4)] hover:-translate-y-2 hover:shadow-[var(--shadow-2)]">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-60 blur-xl ${tint ? tints[tint] : 'from-surface-2 to-surface-1'}`} />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-[15px] border bg-gradient-to-br text-[20px] shadow-lg backdrop-blur-xl ${tint ? tints[tint] : 'from-surface-1 to-surface-2 border-border-mid'}`}>
          {icon ?? '•'}
        </div>
        {sub && <span className="rounded-full bg-surface-2 border border-border-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-ivory-faint">{sub}</span>}
      </div>
      <div className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">{label}</div>
      <div className="relative mt-2 kpi-num text-[30px] font-bold tracking-tight leading-none">{value}</div>
    </div>
  )
}

export function EmptyState({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-1 border border-border-mid shadow-[var(--shadow-1)]">
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ivory-faint">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <div className="mt-5 text-[16px] font-bold">{title}</div>
      {desc && <div className="mt-2 max-w-[32ch] text-[14px] text-ivory-faint leading-relaxed">{desc}</div>}
    </div>
  )
}
