import { useMemo, useState } from 'react'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface SessionRow {
  id: string
  type: string
  status: string
  rate: string | number
  duration_seconds: number | null
  amount_charged: string | number
  created_at: string | null
}

export default function SessionsPage() {
  const paged = usePagedData<SessionRow>('/admin/consultations')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'chat' | 'call' | 'video'>('all')

  const visible = useMemo(() => {
    let list = paged.rows
    if (typeFilter !== 'all') {
      list = list.filter((r) => (r.type || '').toLowerCase().includes(typeFilter))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => [r.id, r.type, r.status].some((v) => v && String(v).toLowerCase().includes(q)))
    }
    return list
  }, [paged.rows, search, typeFilter])

  const stats = useMemo(() => {
    let chat = 0
    let call = 0
    let video = 0
    let totalCharged = 0
    for (const r of paged.rows) {
      const t = (r.type || '').toLowerCase()
      if (t.includes('chat')) chat++
      else if (t.includes('video')) video++
      else if (t.includes('call')) call++
      totalCharged += Number(r.amount_charged || 0)
    }
    return { chat, call, video, totalCharged }
  }, [paged.rows])

  const typeIcons: Record<string, string> = {
    chat: '💬 Chat',
    call: '📞 Voice Call',
    video: '🎥 Video Call',
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Live Consultations & Sessions"
        subtitle="Real-time and historic session log across Chat, Voice Call and Video consultations."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
            <path d="M16 16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12z" />
            <path d="M18 9l4-2v10l-4-2" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search session ID or status…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-violet-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[22px] border border-violet-500/25 bg-violet-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400">💬 Chat Sessions</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{stats.chat}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Message-based consultations</div>
        </div>
        <div className="rounded-[22px] border border-pink-500/25 bg-pink-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-pink-400">📞 Voice Calls</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{stats.call}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Audio consultations</div>
        </div>
        <div className="rounded-[22px] border border-indigo-500/25 bg-indigo-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">🎥 Video Calls</div>
          <div className="mt-2 font-display text-[26px] font-black text-ivory">{stats.video}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Live streaming video</div>
        </div>
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 backdrop-blur-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">₹ Gross Billed</div>
          <div className="mt-2 font-display text-[26px] font-black text-amber-300">₹{stats.totalCharged.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[11px] text-ivory-dim">Consultation revenue</div>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 w-fit">
        {[
          { id: 'all', label: 'All Sessions' },
          { id: 'chat', label: '💬 Chat' },
          { id: 'call', label: '📞 Voice' },
          { id: 'video', label: '🎥 Video' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id as typeof typeFilter)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
              typeFilter === t.id ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading consultations…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No sessions found for this filter.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                    <th className="px-5 py-3.5">Session ID</th>
                    <th className="px-5 py-3.5">Medium</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Rate</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Charged</th>
                    <th className="px-5 py-3.5 text-right">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60">
                  {visible.map((r, idx) => {
                    const durSec = Number(r.duration_seconds || 0)
                    const durMin = Math.floor(durSec / 60)
                    const durSecRem = durSec % 60
                    const durLabel = durSec > 0 ? `${durMin}m ${durSecRem}s` : '—'

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-1/50 transition-colors">
                        <td className="px-5 py-4 font-mono text-[12px]">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ivory font-bold">
                            #{String(r.id).slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[13px]">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300">
                            {typeIcons[(r.type || '').toLowerCase()] || r.type || 'Consultation'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              (r.status || '').toLowerCase() === 'completed'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : (r.status || '').toLowerCase() === 'active'
                                ? 'border-saffron/30 bg-saffron-soft text-saffron-bright animate-pulse'
                                : 'border-white/10 bg-white/5 text-ivory-dim'
                            }`}
                          >
                            {r.status || 'ended'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">₹{Number(r.rate || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 font-mono text-[12px] font-bold text-ivory">{durLabel}</td>
                        <td className="px-5 py-4 font-mono text-[13px] font-bold text-amber-300">
                          ₹{Number(r.amount_charged || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right text-[12px] text-ivory-faint">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager
              page={paged.page}
              size={paged.size}
              total={search.trim() ? null : paged.total}
              hasPrev={paged.hasPrev}
              hasNext={!search.trim() && paged.hasNext}
              onPage={paged.setPage}
              onSize={paged.setSize}
              shown={visible.length}
            />
          </>
        )}
      </Card>
    </div>
  )
}
