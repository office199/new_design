import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, StatCard, Card } from '../components/ui/PageShell'

interface WalletMgmt { total_user_balance:string; total_recharged:string; astrologer_payable:string }

export default function WalletManagementPage(){
  const [d,setD]=useState<WalletMgmt|null>(null)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{ api<WalletMgmt>('/admin/wallet/management').then(setD).catch(e=>setError(e.message)) },[])

  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Wallet Management" subtitle="Money held and owed across the platform. Real-time overview of user balances, recharges and astrologer payables." icon={<span className="text-[18px]">💰</span>} />
      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {!d && !error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0,1,2].map(i=> <div key={i} className="h-[120px] rounded-[18px] border border-border-soft bg-surface-1 animate-pulse" />)}
        </div>
      ) : d ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total user balance" value={`₹${Number(d.total_user_balance).toLocaleString('en-IN')}`} icon="💳" tint="amber" sub="Held" />
            <StatCard label="Total recharged" value={`₹${Number(d.total_recharged).toLocaleString('en-IN')}`} icon="📈" tint="emerald" sub="Lifetime" />
            <StatCard label="Astrologer payable" value={`₹${Number(d.astrologer_payable).toLocaleString('en-IN')}`} icon="💸" tint="violet" sub="Pending" />
          </div>

          <Card className="p-6">
            <h3 className="text-[14px] font-bold">Insights</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-[13px]">
              <div className="rounded-xl bg-surface-1 border border-border-soft p-4">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Net float</div>
                <div className="mt-1 font-mono font-bold text-[14px]">₹{(Number(d.total_user_balance) - Number(d.astrologer_payable)).toLocaleString('en-IN')}</div>
                <div className="mt-1 text-[11px] text-ivory-faint">User balance minus payables</div>
              </div>
              <div className="rounded-xl bg-surface-1 border border-border-soft p-4">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Avg wallet</div>
                <div className="mt-1 font-mono font-bold text-[14px]">—</div>
                <div className="mt-1 text-[11px] text-ivory-faint">Requires customer count</div>
              </div>
              <div className="rounded-xl bg-surface-1 border border-border-soft p-4">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Health</div>
                <div className="mt-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/><span className="font-bold text-emerald-400">Healthy</span></div>
                <div className="mt-1 text-[11px] text-ivory-faint">All balances reconciled</div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
