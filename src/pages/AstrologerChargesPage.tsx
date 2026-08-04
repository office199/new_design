import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'
import { SearchBox } from '../components/ListControls'

interface Charge {
  id: string
  name: string | null
  chat_per_msg: string
  call_per_min: string
  video_per_min: string
}

interface Draft {
  chat_per_msg: string
  call_per_min: string
  video_per_min: string
}

export default function AstrologerChargesPage() {
  const [rows, setRows] = useState<Charge[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api<Charge[]>('/admin/astrologers/charges')
      setRows(list)
      setDrafts(
        Object.fromEntries(
          list.map((c) => [c.id, { chat_per_msg: c.chat_per_msg, call_per_min: c.call_per_min, video_per_min: c.video_per_min }])
        )
      )
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

  const filtered = useMemo(() => {
    return rows.filter((r) => !query.trim() || (r.name || '').toLowerCase().includes(query.toLowerCase()))
  }, [rows, query])

  function edit(id: string, key: keyof Draft, val: string) {
    setSavedId(null)
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: val } }))
  }

  async function save(c: Charge) {
    const d = drafts[c.id]
    if (!d) return
    setSavingId(c.id)
    setSavedId(null)
    setError(null)
    try {
      await api(`/admin/astrologers/${c.id}/charges`, {
        method: 'PATCH',
        body: {
          rate_chat_per_msg: Number(d.chat_per_msg) || 0,
          rate_call_per_min: Number(d.call_per_min) || 0,
          rate_video_per_min: Number(d.video_per_min) || 0,
        },
      })
      setSavedId(c.id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Consultation Pricing Matrix"
        subtitle="Manage per-astrologer rate tiers across Chat, Audio Call, and Video Call sessions."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-saffron">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
        actions={
          <div className="flex items-center gap-2">
            <SearchBox value={query} onChange={setQuery} placeholder="Search astrologer rates…" />
            <button
              onClick={load}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-white/10 bg-white/5 text-ivory hover:border-saffron/40 transition-colors"
            >
              ↻
            </button>
          </div>
        }
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      {loading && rows.length === 0 ? (
        <Card className="p-12 text-center text-ivory-faint">Loading pricing matrix…</Card>
      ) : rows.length === 0 ? (
        <Card className="p-16 text-center text-ivory-faint">No approved astrologers in network.</Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Matrix Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">
                  <th className="px-5 py-3.5">Astrologer</th>
                  <th className="px-5 py-3.5">💬 Chat Rate / Msg</th>
                  <th className="px-5 py-3.5">📞 Voice Call / Min</th>
                  <th className="px-5 py-3.5">🎥 Video Call / Min</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60">
                {filtered.map((c) => {
                  const d = drafts[c.id]
                  return (
                    <tr key={c.id} className="hover:bg-surface-1/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron-soft border border-saffron/20 font-display text-[13px] font-black text-saffron shadow-sm">
                            {(c.name || 'A')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-[14px] text-ivory">{c.name ?? <span className="text-ivory-faint">—</span>}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative w-[130px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-amber-400">₹</span>
                          <input
                            value={d?.chat_per_msg ?? ''}
                            onChange={(e) => edit(c.id, 'chat_per_msg', e.target.value)}
                            className="h-10 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold text-ivory outline-none focus:border-saffron"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative w-[130px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-amber-400">₹</span>
                          <input
                            value={d?.call_per_min ?? ''}
                            onChange={(e) => edit(c.id, 'call_per_min', e.target.value)}
                            className="h-10 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold text-ivory outline-none focus:border-saffron"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative w-[130px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-amber-400">₹</span>
                          <input
                            value={d?.video_per_min ?? ''}
                            onChange={(e) => edit(c.id, 'video_per_min', e.target.value)}
                            className="h-10 w-full rounded-full border border-border-soft bg-surface-1 pl-8 pr-3 text-[13px] font-bold text-ivory outline-none focus:border-saffron"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {savedId === c.id && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Saved!
                            </span>
                          )}
                          <button
                            disabled={savingId === c.id}
                            onClick={() => save(c)}
                            className="h-9 rounded-full bg-saffron text-black px-5 text-[12px] font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {savingId === c.id ? 'Saving…' : 'Save Rates'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Pricing Cards */}
          <div className="grid gap-4 p-4 md:hidden">
            {filtered.map((c) => {
              const d = drafts[c.id]
              return (
                <div key={c.id} className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
                  <div className="font-bold text-[15px] text-ivory">{c.name ?? '—'}</div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <label className="text-[11px] font-semibold text-ivory-dim">
                      Chat ₹
                      <input
                        value={d?.chat_per_msg ?? ''}
                        onChange={(e) => edit(c.id, 'chat_per_msg', e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-1 px-3 text-[13px] font-bold text-ivory"
                      />
                    </label>
                    <label className="text-[11px] font-semibold text-ivory-dim">
                      Call ₹
                      <input
                        value={d?.call_per_min ?? ''}
                        onChange={(e) => edit(c.id, 'call_per_min', e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-1 px-3 text-[13px] font-bold text-ivory"
                      />
                    </label>
                    <label className="text-[11px] font-semibold text-ivory-dim">
                      Video ₹
                      <input
                        value={d?.video_per_min ?? ''}
                        onChange={(e) => edit(c.id, 'video_per_min', e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-border-soft bg-surface-1 px-3 text-[13px] font-bold text-ivory"
                      />
                    </label>
                  </div>
                  <button
                    disabled={savingId === c.id}
                    onClick={() => save(c)}
                    className="mt-4 w-full h-10 rounded-xl bg-saffron text-black text-[12px] font-bold hover:brightness-110"
                  >
                    {savingId === c.id ? 'Saving…' : 'Save Rates'}
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
