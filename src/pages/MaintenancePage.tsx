import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { MaintenanceApp, MaintenanceSetting } from '../api/types'

const APPS: { app: MaintenanceApp; label: string; hint: string }[] = [
  { app: 'user', label: 'User App', hint: 'Puts the customer-facing app into maintenance mode.' },
  { app: 'astro', label: 'Astrologer App', hint: 'Puts the astrologer-facing app into maintenance mode.' },
]

const EMPTY: MaintenanceSetting = { enabled: false, message: '' }

/** Independent maintenance-mode toggle + message per app (user vs astrologer). */
export default function MaintenancePage() {
  return (
    <div>
      <div className="page-head">
        <h1>Under Maintenance</h1>
        <p className="muted">
          Independently put the user app and the astrologer app into maintenance mode, each with its
          own message shown to that app's users.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
        {APPS.map((a) => (
          <AppMaintenanceCard key={a.app} app={a.app} label={a.label} hint={a.hint} />
        ))}
      </div>
    </div>
  )
}

function AppMaintenanceCard({ app, label, hint }: { app: MaintenanceApp; label: string; hint: string }) {
  const [value, setValue] = useState<MaintenanceSetting>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setValue(await adminApi.getMaintenance(app))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [app])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function save() {
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const next = await adminApi.setMaintenance(app, value)
      setValue(next)
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="row spread" style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 18 }}>{label}</h2>
        <span className={`badge badge-${value.enabled ? 'rejected' : 'approved'}`}>
          {value.enabled ? 'under maintenance' : 'live'}
        </span>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>{hint}</p>

      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="success-banner">Saved.</div>}

      <div className="field">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={value.enabled}
            onChange={(e) => setValue({ ...value, enabled: e.target.checked })}
          />
          <span className="muted">Maintenance mode enabled</span>
        </label>
      </div>

      <div className="field">
        <label>Message shown to users</label>
        <textarea
          rows={3}
          value={value.message}
          placeholder="We'll be back shortly. Thanks for your patience!"
          onChange={(e) => setValue({ ...value, message: e.target.value })}
        />
      </div>

      <button className="btn-primary" style={{ marginTop: 8 }} disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
