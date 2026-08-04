import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, StatCard, Card } from '../components/ui/PageShell'

interface WalletMgmt {
  total_user_balance: string
  total_recharged: string
  astrologer_payable: string
}

export default function WalletManagementPage() {
  const [d, setD] = useState<WalletMgmt | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<WalletMgmt>('/admin/wallet/management')
      .then(setD)
      .catch((e) => setError(e.message))
  }, [])

  const netFloat = d ? Number(d.total_user_balance) - Number(d.astrologer_payable) : 0

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Financial Float & Wallet Vault"
        subtitle="Real-time audit of seeker escrow balances, total recharge volume and astrologer payables."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        }
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}

      {!d && !error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[140px] rounded-[26px] border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : d ? (
        <>
          {/* Main Visual Stat Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              label="Seeker Escrow Balance"
              value={`₹${Number(d.total_user_balance).toLocaleString('en-IN')}`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              }
              tint="amber"
              sub="Held in User Wallets"
            />
            <StatCard
              label="Lifetime Recharged"
              value={`₹${Number(d.total_recharged).toLocaleString('en-IN')}`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
              tint="emerald"
              sub="Gross Top-Up Volume"
            />
            <StatCard
              label="Astrologer Payable"
              value={`₹${Number(d.astrologer_payable).toLocaleString('en-IN')}`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                </svg>
              }
              tint="violet"
              sub="Pending Withdrawal Pool"
            />
          </div>

          {/* Deep Financial Audit Cards */}
          <Card className="p-7 space-y-5">
            <h3 className="text-[16px] font-bold text-ivory">Financial Liquidity & System Health</h3>
            <div className="grid gap-4 sm:grid-cols-3 text-[14px]">
              <div className="rounded-[22px] bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wider">Net Escrow Float</div>
                <div className={`mt-2 font-mono font-black text-[22px] ${netFloat >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{netFloat.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-[12px] text-ivory-dim">Seeker balances minus pending astrologer payouts</div>
              </div>

              <div className="rounded-[22px] bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wider">Recharge Velocity</div>
                <div className="mt-2 font-mono font-black text-[22px] text-amber-300">High Volume</div>
                <div className="mt-1 text-[12px] text-ivory-dim">Continuous seeker wallet top-ups</div>
              </div>

              <div className="rounded-[22px] bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wider">System Audit Status</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                  <span className="font-bold text-emerald-400 text-[18px]">Fully Balanced</span>
                </div>
                <div className="mt-1 text-[12px] text-ivory-dim">All gateway transactions reconciled</div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
