import type { KYCStatus } from '../api/types'

export function StatusBadge({ status }: { status: KYCStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}
