import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'

interface LiveGift {
  id: string
  key: string
  name: string
  price: string
  emoji: string | null
  position: number
  is_active: boolean
}

/** Live-stream gift catalog: list + add + edit + delete. Key is set at creation and immutable. */
export default function LiveGiftsPage() {
  const [rows, setRows] = useState<LiveGift[]>([])
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [emoji, setEmoji] = useState('')
  const [position, setPosition] = useState('')
  const [edit, setEdit] = useState<LiveGift | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await api<LiveGift[]>('/admin/live-gifts'))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const body: Record<string, unknown> = { key: key.trim(), name: name.trim(), price: price.trim() }
      if (emoji.trim()) body.emoji = emoji.trim()
      if (position.trim()) body.position = Number(position.trim())
      await api('/admin/live-gifts', { method: 'POST', body })
      setKey('')
      setName('')
      setPrice('')
      setEmoji('')
      setPosition('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function toggle(g: LiveGift) {
    await api(`/admin/live-gifts/${g.id}`, { method: 'PATCH', body: { is_active: !g.is_active } })
    await load()
  }

  async function remove(g: LiveGift) {
    await api(`/admin/live-gifts/${g.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div className="page-head">
        <h1>Live Gifts</h1>
        <p className="muted">Manage the gift catalog customers can send astrologers during live streams.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <form className="card" style={{ marginBottom: 20 }} onSubmit={create}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <Field label="Key">
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="rose" required />
          </Field>
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rose" required />
          </Field>
          <Field label="Price (₹)">
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1" required />
          </Field>
          <Field label="Emoji">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🌹" style={{ width: 80 }} />
          </Field>
          <Field label="Position">
            <input inputMode="numeric" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="0" style={{ width: 80 }} />
          </Field>
          <button className="btn-primary" type="submit">Add gift</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Key</th><th>Name</th><th>Price</th><th>Emoji</th><th>Position</th><th>Active</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td className="mono">{g.key}</td>
                <td>{g.name}</td>
                <td>₹{g.price}</td>
                <td style={{ fontSize: 18 }}>{g.emoji || <span className="faint">—</span>}</td>
                <td>{g.position}</td>
                <td><span className={`badge badge-${g.is_active ? 'approved' : 'rejected'}`}>{g.is_active ? 'active' : 'off'}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-ghost" onClick={() => setEdit(g)}>Edit</button>
                  <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => toggle(g)}>{g.is_active ? 'Disable' : 'Enable'}</button>
                  <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => remove(g)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}><div className="empty">No gifts yet.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <EditGiftModal
          gift={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

function EditGiftModal({
  gift,
  onClose,
  onDone,
}: {
  gift: LiveGift
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(gift.name)
  const [price, setPrice] = useState(gift.price)
  const [emoji, setEmoji] = useState(gift.emoji ?? '')
  const [position, setPosition] = useState(String(gift.position ?? 0))
  const [isActive, setIsActive] = useState(gift.is_active)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      await api(`/admin/live-gifts/${gift.id}`, {
        method: 'PATCH',
        body: {
          name: name.trim(),
          price: price.trim(),
          emoji: emoji.trim(),
          position: position.trim() === '' ? 0 : Number(position.trim()),
          is_active: isActive,
        },
      })
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20 }}>Edit gift</h2>
        <p className="muted mono" style={{ marginTop: 4 }}>{gift.key}</p>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Price (₹)</label>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field">
          <label>Emoji</label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </div>
        <div className="field">
          <label>Position</label>
          <input inputMode="numeric" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <label className="row" style={{ gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
          <span>Active</span>
        </label>
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--ivory-dim)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
