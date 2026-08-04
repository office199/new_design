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
      <PageHeader title="Wallet Management" subtitle="Money held and owed across the platform. Real-time overview of user balances, recharges and astrologer payables." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>} />
      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}
      {!d && !error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0,1,2].map(i=> <div key={i} className="h-[130px] rounded-[24px] border border-white/10 bg-white/5 animate-pulse" />)}
        </div>
      ) : d ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total user balance" value={`₹${Number(d.total_user_balance).toLocaleString('en-IN')}`} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>} tint="amber" sub="Held" />
            <StatCard label="Total recharged" value={`₹${Number(d.total_recharged).toLocaleString('en-IN')}`} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} tint="emerald" sub="Lifetime" />
            <StatCard label="Astrologer payable" value={`₹${Number(d.astrologer_payable).toLocaleString('en-IN')}`} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>} tint="violet" sub="Pending" />
          </div>

          <Card className="p-7">
            <h3 className="text-[15px] font-bold">Insights</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 text-[14px]">
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Net float</div>
                <div className="mt-1.5 font-mono font-bold text-[15px]">₹{(Number(d.total_user_balance) - Number(d.astrologer_payable)).toLocaleString('en-IN')}</div>
                <div className="mt-1 text-[12px] text-ivory-faint">User balance minus payables</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Avg wallet</div>
                <div className="mt-1.5 font-mono font-bold text-[15px]">—</div>
                <div className="mt-1 text-[12px] text-ivory-faint">Requires customer count</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
                <div className="text-[11px] uppercase font-bold text-ivory-faint tracking-wide">Health</div>
                <div className="mt-1.5 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_theme(colors.emerald.500)]"/><span className="font-bold text-emerald-400">Healthy</span></div>
                <div className="mt-1 text-[12px] text-ivory-faint">All balances reconciled</div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
