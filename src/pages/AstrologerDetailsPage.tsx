import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import { StatusBadge } from '../components/Badge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDrawer } from '../components/DetailDrawer'
import type { AstrologerEditInput, KYCStatus } from '../api/types'

interface AstrologerRow {
  id: string
  name: string | null
  mobile: string | null
  skills: string[] | null
  experience: number | null
  kyc_status: KYCStatus
  is_online: boolean
  avg_rating: string
  available_balance: string
}

/** Astrologer directory with inline block / unblock, edit and delete actions. */
export default function AstrologerDetailsPage() {
  const [rows, setRows] = useState<AstrologerRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<AstrologerRow | null>(null)
  const [remove, setRemove] = useState<AstrologerRow | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await api<AstrologerRow[]>('/admin/astrologers/list'))
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

  async function act(id: string, action: 'block' | 'unblock') {
    setBusyId(id)
    setError(null)
    try {
      await api(`/admin/astrologers/${id}/${action}`, { method: 'POST' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!remove) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await adminApi.deleteAstrologer(remove.id)
      setRemove(null)
      await load()
    } catch (e) {
      setRemoveError((e as Error).message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <div className="page-head spread">
        <div>
          <h1>Astrologer Details</h1>
          <p className="muted">All registered astrologers. Block to hide from discovery, unblock to restore.</p>
        </div>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && rows.length === 0 ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty">No astrologers found.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Skills</th>
                <th>Exp (yrs)</th>
                <th>KYC</th>
                <th>Online</th>
                <th>Rating</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const blocked = a.kyc_status === 'rejected'
                return (
                  <tr key={a.id}>
                    <td data-label="Name">{a.name ?? <span className="faint">—</span>}</td>
                    <td data-label="Mobile" className="mono">{a.mobile ?? <span className="faint">—</span>}</td>
                    <td data-label="Skills">{a.skills && a.skills.length ? a.skills.join(', ') : <span className="faint">—</span>}</td>
                    <td data-label="Exp (yrs)">{a.experience ?? <span className="faint">—</span>}</td>
                    <td data-label="KYC"><StatusBadge status={a.kyc_status} /></td>
                    <td data-label="Online">{a.is_online ? 'Yes' : 'No'}</td>
                    <td data-label="Rating">{a.avg_rating}</td>
                    <td data-label="Balance">₹{a.available_balance}</td>
                    <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-ghost" onClick={() => setDetailId(a.id)}>View</button>
                      <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setEdit(a)}>Edit</button>
                      {blocked ? (
                        <button className="btn-primary" style={{ marginLeft: 8 }} disabled={busyId === a.id} onClick={() => act(a.id, 'unblock')}>
                          {busyId === a.id ? '…' : 'Unblock'}
                        </button>
                      ) : (
                        <button className="btn-danger" style={{ marginLeft: 8 }} disabled={busyId === a.id} onClick={() => act(a.id, 'block')}>
                          {busyId === a.id ? '…' : 'Block'}
                        </button>
                      )}
                      <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => setRemove(a)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <EditModal
          astrologer={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null)
            void load()
          }}
        />
      )}

      {remove && (
        <ConfirmDialog
          title="Delete astrologer"
          message="This permanently deletes the astrologer and all their data. Continue?"
          confirmLabel="Delete astrologer"
          busy={removing}
          error={removeError}
          onConfirm={confirmDelete}
          onClose={() => {
            setRemove(null)
            setRemoveError(null)
          }}
        />
      )}

      <DetailDrawer kind="astrologer" id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

const KYC_OPTIONS: KYCStatus[] = ['pending', 'approved', 'rejected']

/**
 * Astrologer edit form. The directory row carries only a subset of the editable
 * fields, so unknown fields (bio, email, rates, languages) start blank and are
 * only sent when the admin fills them in — preventing accidental overwrites.
 */
function EditModal({
  astrologer,
  onClose,
  onDone,
}: {
  astrologer: AstrologerRow
  onClose: () => void
  onDone: () => void
}) {
  const [displayName, setDisplayName] = useState(astrologer.name ?? '')
  const [bio, setBio] = useState('')
  const [mobile, setMobile] = useState(astrologer.mobile ?? '')
  const [email, setEmail] = useState('')
  const [skills, setSkills] = useState((astrologer.skills ?? []).join(', '))
  const [languages, setLanguages] = useState('')
  const [years, setYears] = useState(astrologer.experience != null ? String(astrologer.experience) : '')
  const [rateChat, setRateChat] = useState('')
  const [rateCall, setRateCall] = useState('')
  const [rateVideo, setRateVideo] = useState('')
  const [superChatMin, setSuperChatMin] = useState('')
  const [kyc, setKyc] = useState<KYCStatus>(astrologer.kyc_status)
  const [isOnline, setIsOnline] = useState(astrologer.is_online)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const body: AstrologerEditInput = { kyc_status: kyc, is_online: isOnline }
    const dn = displayName.trim()
    if (dn) body.display_name = dn
    const b = bio.trim()
    if (b) body.bio = b
    const m = mobile.trim()
    if (m) body.mobile = m
    const em = email.trim()
    if (em) body.email = em
    const sk = skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (sk.length) body.skills = sk
    const lg = languages.split(',').map((s) => s.trim()).filter(Boolean)
    if (lg.length) body.languages = lg

    const numField = (raw: string): number | null => {
      const t = raw.trim()
      if (!t) return null
      const n = Number(t)
      return Number.isFinite(n) ? n : NaN
    }
    const nums: [string, keyof AstrologerEditInput, string][] = [
      [years, 'years_experience', 'Years of experience'],
      [rateChat, 'rate_chat_per_msg', 'Chat rate'],
      [rateCall, 'rate_call_per_min', 'Call rate'],
      [rateVideo, 'rate_video_per_min', 'Video rate'],
      [superChatMin, 'super_chat_min_price', 'Super-chat minimum'],
    ]
    for (const [raw, key, label] of nums) {
      const n = numField(raw)
      if (n === null) continue
      if (Number.isNaN(n)) {
        setError(`${label} must be a number.`)
        return
      }
      ;(body as Record<string, unknown>)[key] = n
    }

    setSaving(true)
    setError(null)
    try {
      await adminApi.editAstrologer(astrologer.id, body)
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
        <h2 style={{ fontSize: 20 }}>Edit astrologer</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Blank rate / bio / email / language fields are left unchanged.
        </p>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        <div className="field">
          <label>Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Guru ji" />
        </div>
        <div className="field">
          <label>Bio</label>
          <input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short introduction" />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Mobile</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
        </div>
        <div className="field">
          <label>Skills (comma-separated)</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Vedic, Tarot, Numerology" />
        </div>
        <div className="field">
          <label>Languages (comma-separated)</label>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Hindi, English" />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Years experience</label>
            <input inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>KYC status</label>
            <select value={kyc} onChange={(e) => setKyc(e.target.value as KYCStatus)}>
              {KYC_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Chat / msg (₹)</label>
            <input inputMode="decimal" value={rateChat} onChange={(e) => setRateChat(e.target.value)} placeholder="10" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Call / min (₹)</label>
            <input inputMode="decimal" value={rateCall} onChange={(e) => setRateCall(e.target.value)} placeholder="20" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Video / min (₹)</label>
            <input inputMode="decimal" value={rateVideo} onChange={(e) => setRateVideo(e.target.value)} placeholder="30" />
          </div>
        </div>
        <div className="field">
          <label>Super-chat minimum (₹)</label>
          <input inputMode="decimal" value={superChatMin} onChange={(e) => setSuperChatMin(e.target.value)} placeholder="50" />
        </div>
        <label className="row" style={{ gap: 8, marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} style={{ width: 'auto' }} />
          <span>Online (available for consultations)</span>
        </label>
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
