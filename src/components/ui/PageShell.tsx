import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {icon && <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-raised border border-border-soft shadow-sm">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed text-ivory-dim line-clamp-2">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`rounded-[20px] border border-border-soft bg-surface-raised shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${hover ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:border-border-mid transition-all' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionCard({ title, subtitle, actions, children, className='' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-border-soft/60 px-5 sm:px-6 py-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div className="min-w-0">
            {title && <h3 className="text-[14px] font-bold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-1 text-[12px] text-ivory-faint">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  )
}

export function StatCard({ label, value, icon, tint, sub }: { label: string; value: string; icon?: ReactNode; tint?: 'amber'|'emerald'|'violet'|'saffron'; sub?: string }) {
  const tints = {
    amber: 'from-amber-400/20 to-orange-400/15 text-amber-400 border-amber-500/20',
    emerald: 'from-emerald-400/20 to-teal-400/15 text-emerald-400 border-emerald-500/20',
    violet: 'from-violet-400/20 to-purple-400/15 text-violet-400 border-violet-500/20',
    saffron: 'from-orange-400/20 to-amber-400/15 text-orange-400 border-orange-500/20',
  }
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-border-soft bg-surface-raised p-5 shadow-sm">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-50 ${tint ? tints[tint] : 'from-surface-2 to-surface-1'}`} />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border bg-gradient-to-br text-[18px] shadow-sm ${tint ? tints[tint] : 'from-surface-1 to-surface-2 border-border-soft'}`}>{icon ?? '•'}</div>
        {sub && <span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ivory-faint">{sub}</span>}
      </div>
      <div className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">{label}</div>
      <div className="relative mt-2 font-display text-[26px] font-bold tracking-tight leading-none">{value}</div>
    </div>
  )
}

export function EmptyState({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-1 border border-border-soft text-ivory-faint">{icon ?? '∅'}</div>
      <div className="mt-4 text-[15px] font-semibold">{title}</div>
      {desc && <div className="mt-1 max-w-[32ch] text-[13px] text-ivory-faint leading-relaxed">{desc}</div>}
    </div>
  )
}
