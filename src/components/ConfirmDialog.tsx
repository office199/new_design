interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Destructive-action confirmation modal matching the console design system. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
        <p className="muted" style={{ marginTop: 8 }}>{message}</p>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
