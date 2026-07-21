import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

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

/** Per-astrologer consultation rates with inline editing + Save. */
export default function AstrologerChargesPage() {
  const [rows, setRows] = useState<Charge[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api<Charge[]>('/admin/astrologers/charges')
      setRows(list)
      setDrafts(
        Object.fromEntries(
          list.map((c) => [
            c.id,
            {
              chat_per_msg: c.chat_per_msg,
              call_per_min: c.call_per_min,
              video_per_min: c.video_per_min,
            },
          ]),
        ),
      )
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  function edit(id: string, key: keyof Draft, value: string) {
    setSavedId(null)
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }))
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
    <div>
      <div className="page-head spread">
        <div>
          <h1>Astrologer Charges</h1>
          <p className="muted">Per-astrologer consultation rates. Edit and save each row.</p>
        </div>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && rows.length === 0 ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty">No approved astrologers found.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Astrologer</th>
                <th>Chat / msg (₹)</th>
                <th>Call / min (₹)</th>
                <th>Video / min (₹)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const d = drafts[c.id]
                return (
                  <tr key={c.id}>
                    <td>{c.name ?? <span className="faint">—</span>}</td>
                    <td>
                      <input
                        style={{ maxWidth: 110 }}
                        inputMode="decimal"
                        value={d?.chat_per_msg ?? ''}
                        onChange={(e) => edit(c.id, 'chat_per_msg', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        style={{ maxWidth: 110 }}
                        inputMode="decimal"
                        value={d?.call_per_min ?? ''}
                        onChange={(e) => edit(c.id, 'call_per_min', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        style={{ maxWidth: 110 }}
                        inputMode="decimal"
                        value={d?.video_per_min ?? ''}
                        onChange={(e) => edit(c.id, 'video_per_min', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {savedId === c.id && <span className="muted" style={{ marginRight: 8 }}>Saved</span>}
                      <button className="btn-primary" disabled={savingId === c.id} onClick={() => save(c)}>
                        {savingId === c.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
