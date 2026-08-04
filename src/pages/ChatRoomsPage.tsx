import { useMemo, useState } from 'react'
import { ChatTranscriptModal } from '../components/ChatTranscriptModal'
import { SearchBox, Pager } from '../components/ListControls'
import { PageHeader, Card } from '../components/ui/PageShell'
import { usePagedData } from '../hooks/usePagedData'

interface ChatRoomRow {
  id: string
  user_id?: string
  user_name?: string | null
  astrologer_id?: string
  astrologer_name?: string | null
  status?: string | null
  message_count?: number | null
  amount_charged?: string | number | null
  created_at?: string | null
}

export default function ChatRoomsPage() {
  const paged = usePagedData<ChatRoomRow>('/admin/chat-rooms')
  const [search, setSearch] = useState('')
  const [transcriptId, setTranscriptId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return paged.rows
    return paged.rows.filter((r) => [r.id, r.user_name, r.astrologer_name, r.status].some((v) => v && String(v).toLowerCase().includes(q)))
  }, [paged.rows, search])

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Chat Rooms & Transcripts"
        subtitle="Active & archived chat consultation message rooms. Select any room to inspect complete chat logs."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search seeker or astrologer…" />
            <button onClick={paged.reload} className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 hover:border-violet-400/40 transition-colors">
              ↻
            </button>
          </div>
        }
      />

      {paged.error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{paged.error}</div>}

      <Card className="overflow-hidden">
        {paged.loading && paged.rows.length === 0 ? (
          <div className="p-12 text-center text-ivory-faint">Loading chat rooms…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center text-ivory-faint">No chat rooms found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((r, idx) => {
                const seeker = r.user_name || (r.user_id ? `Seeker #${r.user_id.slice(0, 6)}` : 'Seeker')
                const astro = r.astrologer_name || (r.astrologer_id ? `Astro #${r.astrologer_id.slice(0, 6)}` : 'Astrologer')

                return (
                  <div
                    key={r.id || idx}
                    onClick={() => setTranscriptId(r.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/8 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="font-mono text-[11px] font-bold text-violet-400">Room #{String(r.id).slice(0, 8)}</span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                        {r.status || 'Active'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/20 border border-blue-500/30 text-[11px] font-bold text-blue-300">
                          {seeker[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-ivory-faint">Seeker</div>
                          <div className="truncate text-[12.5px] font-semibold text-ivory">{seeker}</div>
                        </div>
                      </div>

                      <span className="text-[12px] text-ivory-faint font-bold">⇄</span>

                      <div className="flex items-center gap-2 text-right">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-ivory-faint">Astrologer</div>
                          <div className="truncate text-[12.5px] font-semibold text-amber-300">{astro}</div>
                        </div>
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                          {astro[0]}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[12px]">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-ivory">
                        💬 {r.message_count ?? 0} msgs
                      </span>
                      <span className="font-mono font-bold text-amber-300">₹{Number(r.amount_charged || 0).toLocaleString('en-IN')}</span>
                      <button className="rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-[11px] font-bold text-violet-300 group-hover:bg-violet-500 group-hover:text-white transition-all">
                        Transcript →
                      </button>
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

      <ChatTranscriptModal consultationId={transcriptId} onClose={() => setTranscriptId(null)} />
    </div>
  )
}
