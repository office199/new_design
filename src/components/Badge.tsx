import type { KYCStatus } from '../api/types'

const STATUS_CONFIG: Record<KYCStatus, { label: string; cls: string; dot: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    dot: 'bg-amber-500',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  },
  approved: {
    label: 'Approved',
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    dot: 'bg-emerald-500',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    dot: 'bg-red-500',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  },
}

export function StatusBadge({ status, showDot=true }: { status: KYCStatus; showDot?: boolean }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur ${cfg.cls}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse shadow-[0_0_6px_currentColor]`} />}
      {cfg.icon}
      {status}
    </span>
  )
}

// Generic badge for other statuses
export function Badge({ children, variant='default', className='' }: { children: React.ReactNode; variant?: 'default'|'success'|'warning'|'danger'|'info'|'outline'|'saffron'; className?: string }) {
  const map: Record<string,string> = {
    default: 'bg-surface-2 text-ivory-dim border-border-soft',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(244,63,94,0.12)]',
    info: 'bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.12)]',
    outline: 'bg-transparent text-ivory-dim border-border-mid',
    saffron: 'bg-saffron-soft text-saffron-bright border-saffron/20 shadow-[0_0_12px_var(--color-saffron-glow)]',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide backdrop-blur ${map[variant]} ${className}`}>
      {children}
    </span>
  )
}
