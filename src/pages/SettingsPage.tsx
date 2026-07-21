import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export interface SettingField {
  key: string
  label: string
  type?: 'text' | 'number' | 'bool'
  placeholder?: string
}

interface SettingsPageProps {
  title: string
  subtitle?: string
  endpoint: string
  fields: SettingField[]
}

type Value = Record<string, string | number | boolean>

/** GET/PUT a key→JSON settings object via /admin/settings/*. */
export default function SettingsPage({ title, subtitle, endpoint, fields }: SettingsPageProps) {
  const [value, setValue] = useState<Value>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    try {
      setValue(await api<Value>(endpoint))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [endpoint])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function save() {
    setError(null)
    setSaved(false)
    try {
      await api(endpoint, { method: 'PUT', body: { value } })
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {error && <div className="error-banner">{error}</div>}
      {saved && (
        <div className="success-banner">Saved.</div>
      )}

      <div className="card" style={{ maxWidth: 560 }}>
        {fields.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            {f.type === 'bool' ? (
              <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={Boolean(value[f.key])}
                  onChange={(e) => setValue({ ...value, [f.key]: e.target.checked })}
                />
                <span className="muted">Enabled</span>
              </label>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                placeholder={f.placeholder}
                value={String(value[f.key] ?? '')}
                onChange={(e) =>
                  setValue({
                    ...value,
                    [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                  })
                }
              />
            )}
          </div>
        ))}
        <button className="btn-primary" style={{ marginTop: 18 }} onClick={save}>Save changes</button>
      </div>
    </div>
  )
}
