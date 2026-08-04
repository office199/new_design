import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-violet-500/25 to-pink-500/20 backdrop-blur-xl shadow-[0_8px_24px_rgba(139,92,246,0.18)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_30%_18%,rgba(255,255,255,0.22),transparent_60%)]" />
              <span className="relative text-[22px]">{icon}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[25px] sm:text-[30px] font-black tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ivory-dim">{subtitle}</p>}
            <div className="mt-3 h-[3px] w-16 rounded-full bg-gradient-to-r from-saffron-bright via-fuchsia-400/70 to-transparent" />
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`relative rounded-[24px] border border-white/12 bg-white/6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] ${hover ? 'hover:bg-white/8 hover:border-white/18 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-2 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionCard({ title, subtitle, actions, children, className='' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5 bg-gradient-to-b from-white/4 to-transparent">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-1.5 text-[12px] text-ivory-faint">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </Card>
  )
}

export function StatCard({ label, value, icon, tint, sub }: { label: string; value: string; icon?: ReactNode; tint?: 'amber'|'emerald'|'violet'|'saffron'; sub?: string }) {
  const tints = {
    amber: 'from-amber-400/25 to-orange-400/20 text-amber-400 border-amber-500/25',
    emerald: 'from-emerald-400/25 to-teal-400/20 text-emerald-400 border-emerald-500/25',
    violet: 'from-violet-400/25 to-purple-400/20 text-violet-400 border-violet-500/25',
    saffron: 'from-orange-400/25 to-amber-400/20 text-orange-400 border-orange-500/25',
  }
  return (
    <div className="sheen-sweep relative overflow-hidden rounded-[22px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:bg-white/8 hover:border-white/18 hover:-translate-y-3 hover:shadow-[0_14px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-60 blur-xl ${tint ? tints[tint] : 'from-surface-2 to-surface-1'}`} />
      <div className="pointer-events-none absolute -left-10 -bottom-14 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border bg-gradient-to-br text-[20px] shadow-lg backdrop-blur-xl ${tint ? tints[tint] : 'from-surface-1 to-surface-2 border-white/15'}`}>
          {icon ?? '•'}
        </div>
        {sub && <span className="rounded-full bg-white/8 backdrop-blur-xl border border-white/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-ivory-faint">{sub}</span>}
      </div>
      <div className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">{label}</div>
      <div className="relative mt-2 font-display text-[30px] font-black tracking-tight leading-none">{value}</div>
    </div>
  )
}

export function EmptyState({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/6 backdrop-blur-xl border border-white/12 shadow-lg">
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
