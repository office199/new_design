import { useEffect } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ title, message, confirmLabel='Delete', busy=false, error=null, onConfirm, onClose }: ConfirmDialogProps) {
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape' && !busy) onClose() }
    window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey)
  },[busy,onClose])

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[440px] animate-pop-in overflow-hidden rounded-[20px] border border-border-mid bg-surface-raised shadow-[0_24px_60px_rgba(0,0,0,0.45)]" onClick={e=>e.stopPropagation()}>
        <div className="p-6">
          <div className="flex gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-semibold leading-tight">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ivory-dim">{message}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <button onClick={onClose} disabled={busy} className="h-9 rounded-full border border-border-soft bg-surface-1 px-4 text-[13px] font-medium text-ivory-dim transition-colors hover:bg-surface-2 hover:text-ivory disabled:opacity-50">Cancel</button>
            <button onClick={onConfirm} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-br from-red-400 to-red-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50">
              {busy ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Processing…</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> {confirmLabel}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
