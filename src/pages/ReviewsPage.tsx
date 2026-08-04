import { useMemo, useState } from 'react'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface ReviewRow {
  id?: string
  astrologer_id: string
  rating: number | string
  review: string | null
  created_at?: string | null
  user_name?: string | null
}

export default function ReviewsPage() {
  const paged = usePagedData<ReviewRow>('/admin/reviews')
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState<number>(0)

  const visible = useMemo(() => {
    let list = paged.rows
    if (minRating > 0) {
      list = list.filter((r) => Number(r.rating || 0) >= minRating)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => [r.astrologer_id, r.review, r.user_name].some((v) => v && String(v).toLowerCase().includes(q)))
    }
    return list
  }, [paged.rows, search, minRating])

  const avgRating = useMemo(() => {
    if (!paged.rows.length) return 0
    const sum = paged.rows.reduce((acc, r) => acc + Number(r.rating || 0), 0)
    return (sum / paged.rows.length).toFixed(1)
  }, [paged.rows])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Wall of Praise & Customer Reviews"
        subtitle="Public reviews, star ratings and seeker feedback for network astrologers."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search review text or astro ID…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-amber-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {/* Sentiment & Rating Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 backdrop-blur-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Average Customer Rating</div>
            <div className="mt-2 font-display text-[32px] font-black text-amber-300">⭐ {avgRating} / 5.0</div>
          </div>
          <div className="text-right text-[12px] text-ivory-dim">
            <b>{paged.total ?? paged.rows.length}</b> total reviews
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2 rounded-[22px] border border-white/10 bg-white/5 p-4 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase text-ivory-faint shrink-0 ml-2">Filter by Star Rating:</span>
          {[
            { stars: 0, label: 'All Reviews' },
            { stars: 5, label: '⭐ 5 Stars' },
            { stars: 4, label: '⭐ 4+ Stars' },
            { stars: 3, label: '⭐ 3+ Stars' },
          ].map((f) => (
            <button
              key={f.stars}
              onClick={() => setMinRating(f.stars)}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all shrink-0 ${
                minRating === f.stars ? 'bg-amber-400 text-black shadow-md' : 'border border-white/10 bg-white/5 text-ivory-dim hover:text-ivory'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading reviews…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No customer reviews found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((r, idx) => {
                const numRating = Number(r.rating || 5)

                return (
                  <div key={r.id || idx} className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 font-mono text-[12px] font-bold text-amber-300">
                        {'★'.repeat(numRating)}{'☆'.repeat(5 - numRating)} {numRating}.0
                      </span>
                      <span className="font-mono text-[11px] text-ivory-faint">
                        Astro #{r.astrologer_id ? String(r.astrologer_id).slice(0, 8) : '—'}
                      </span>
                    </div>

                    <p className="text-[13.5px] italic text-ivory-dim leading-relaxed">
                      "{r.review || 'No written comment provided with this star rating.'}"
                    </p>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-ivory-faint">
                      <span>Seeker Review</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</span>
                    </div>
                  </div>
                )
              })}
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
