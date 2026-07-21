import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface WalletMgmt {
  total_user_balance: string
  total_recharged: string
  astrologer_payable: string
}

export default function WalletManagementPage() {
  const [d, setD] = useState<WalletMgmt | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<WalletMgmt>('/admin/wallet/management').then(setD).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Wallet Management</h1>
        <p className="muted">Money held and owed across the platform.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {!d && !error ? (
        <div className="empty">Loading…</div>
      ) : d ? (
        <div className="stat-grid">
          <Stat label="Total user balance" value={`₹${d.total_user_balance}`} />
          <Stat label="Total recharged" value={`₹${d.total_recharged}`} />
          <Stat label="Astrologer payable" value={`₹${d.astrologer_payable}`} />
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value money">{value}</div>
    </div>
  )
}
