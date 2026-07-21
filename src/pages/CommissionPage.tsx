import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Commission {
  rate: number
}

/** Global platform commission rate (0..1), shown/edited as a percentage. */
export default function CommissionPage() {
  const [percent, setPercent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const c = await api<Commission>('/admin/settings/commission')
      setPercent(String(Math.round((Number(c.rate) || 0) * 10000) / 100))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function save() {
    setError(null)
    setSaved(false)
    const pct = Number(percent)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError('Commission must be a percentage between 0 and 100.')
      return
    }
    setSaving(true)
    try {
      await api('/admin/settings/commission', { method: 'PUT', body: { rate: pct / 100 } })
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Platform Commission</h1>
        <p className="muted">Share of every consultation the platform keeps, applied to all payout splits.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="success-banner">Saved.</div>}

      <div className="card" style={{ maxWidth: 420 }}>
        <div className="field">
          <label>Commission rate (%)</label>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              style={{ maxWidth: 140 }}
              value={percent}
              onChange={(e) => {
                setSaved(false)
                setPercent(e.target.value)
              }}
            />
            <span className="muted">%</span>
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Stored as {(Number(percent) / 100 || 0).toFixed(4)} (a 0–1 fraction).
          </p>
        </div>
        <button className="btn-primary" style={{ marginTop: 18 }} disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
