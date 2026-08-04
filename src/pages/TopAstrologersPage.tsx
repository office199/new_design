import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { DetailDrawer } from '../components/DetailDrawer'
import { SearchBox } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'

interface TopAstro {
  id: string
  name: string | null
  avg_rating: string | number
  review_count: number | null
  followers: number | null
  available_balance: string | number
  skills?: string[] | null
  experience?: number | null
}

type SortBy = 'rating' | 'reviews' | 'earnings' | 'followers'

export default function TopAstrologersPage() {
  const [rows, setRows] = useState<TopAstro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('rating')
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api<TopAstro[]>('/admin/astrologers/top')
      setRows(list)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = list.filter((r) => [r.name, r.skills?.join(' ')].some((v) => v && v.toLowerCase().includes(q)))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return Number(b.avg_rating || 0) - Number(a.avg_rating || 0)
      if (sortBy === 'reviews') return Number(b.review_count || 0) - Number(a.review_count || 0)
      if (sortBy === 'earnings') return Number(b.available_balance || 0) - Number(a.available_balance || 0)
      if (sortBy === 'followers') return Number(b.followers || 0) - Number(a.followers || 0)
      return 0
    })
  }, [rows, search, sortBy])

  const top3 = sortedAndFiltered.slice(0, 3)
  const remaining = sortedAndFiltered.slice(3)

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Top Rated Astrologers"
        subtitle="Hall of Fame — Astrologers ranked by customer ratings, consultation volume, reviews and earnings."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search top astrologer…" />
            <div className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 p-1">
              {(
                [
                  { id: 'rating', label: '⭐ Rating' },
                  { id: 'reviews', label: '💬 Reviews' },
                  { id: 'earnings', label: '₹ Earnings' },
                  { id: 'followers', label: '👥 Followers' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                    sortBy === s.id ? 'bg-amber-400 text-black shadow-sm' : 'text-ivory-dim hover:text-ivory'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 text-ivory hover:border-amber-400/40 transition-colors"
            >
              ↻
            </button>
          </div>
        }
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      {loading ? (
        <Card className="p-12 text-center text-ivory-faint">Loading Hall of Fame…</Card>
      ) : sortedAndFiltered.length === 0 ? (
        <Card className="p-16 text-center text-ivory-faint">No top astrologers found.</Card>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {top3.map((a, idx) => {
              const rankBadges = [
                { title: 'Rank #1 · Gold', bg: 'from-amber-400/25 via-yellow-500/15 to-amber-600/10', border: 'border-amber-400/40', text: 'text-amber-300', icon: '👑 1st' },
                { title: 'Rank #2 · Silver', bg: 'from-slate-300/20 via-slate-400/10 to-zinc-500/10', border: 'border-slate-300/40', text: 'text-slate-200', icon: '🥈 2nd' },
                { title: 'Rank #3 · Bronze', bg: 'from-orange-400/20 via-amber-700/10 to-amber-900/10', border: 'border-orange-400/35', text: 'text-orange-300', icon: '🥉 3rd' },
              ][idx]

              return (
                <div
                  key={a.id}
                  onClick={() => setDetailId(a.id)}
                  className={`group relative cursor-pointer overflow-hidden rounded-[28px] border ${rankBadges.border} bg-gradient-to-b ${rankBadges.bg} backdrop-blur-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase ${rankBadges.text}`}>
                      {rankBadges.icon}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-amber-300">⭐ {a.avg_rating}</span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 border border-amber-400/30 font-display text-[22px] font-black text-amber-300 shadow-md">
                      {(a.name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[18px] font-bold text-ivory group-hover:text-amber-300 transition-colors">
                        {a.name ?? 'Astrologer'}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-ivory-dim">
                        <span>💬 {a.review_count ?? 0} reviews</span>
                        <span>·</span>
                        <span>👥 {a.followers ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="text-[11px] text-ivory-faint">
                      Earnings: <b className="font-mono text-[13px] text-amber-300">₹{Number(a.available_balance || 0).toLocaleString('en-IN')}</b>
                    </div>
                    <button className="rounded-full bg-amber-400 px-4 py-1.5 text-[11px] font-bold text-black group-hover:brightness-110 transition-all">
                      View Profile →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Remaining Ranked Table / Cards */}
          {remaining.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/4">
                <h4 className="text-[14px] font-bold tracking-tight text-ivory">Leaderboard Rankings #{4} to #{sortedAndFiltered.length}</h4>
                <span className="text-[11px] text-ivory-faint">{remaining.length} astrologers</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                      <th className="px-5 py-3.5">Rank</th>
                      <th className="px-5 py-3.5">Astrologer</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5">Reviews</th>
                      <th className="px-5 py-3.5">Followers</th>
                      <th className="px-5 py-3.5">Earnings</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/60">
                    {remaining.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-surface-1/50 transition-colors group">
                        <td className="px-5 py-4 font-mono text-[13px] font-bold text-amber-400">#{idx + 4}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] font-bold text-amber-300">
                              {(a.name || 'A')[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-[13.5px] text-ivory group-hover:text-amber-300 transition-colors">
                              {a.name ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-[13px] text-amber-300">⭐ {a.avg_rating}</td>
                        <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">{a.review_count ?? 0}</td>
                        <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">{a.followers ?? 0}</td>
                        <td className="px-5 py-4 font-mono text-[12px] font-bold text-amber-400">₹{Number(a.available_balance || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setDetailId(a.id)}
                            className="rounded-full border border-border-soft bg-surface-1 px-4 py-1.5 text-[11px] font-bold text-ivory hover:border-amber-400/40 hover:text-amber-300 transition-all"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <DetailDrawer kind="astrologer" id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
