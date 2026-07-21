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
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setValue(await api<Value>(endpoint))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
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
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <div className="page-head-gradient">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>

      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {saved && (
        <div className="success-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Settings saved successfully!
        </div>
      )}

      <div className="card" style={{ maxWidth: 600 }}>
        {loading ? (
          <div className="empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Loading settings...
          </div>
        ) : (
          <>
            {fields.map((f, i) => (
              <div className="field" key={f.key} style={{ animationDelay: `${i * 50}ms` }}>
                <label>
                  {f.type !== 'bool' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, opacity: 0.5 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                  {f.label}
                </label>
                {f.type === 'bool' ? (
                  <label className="row" style={{ gap: 12, cursor: 'pointer', padding: '8px 12px', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-soft)' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={Boolean(value[f.key])}
                      onChange={(e) => setValue({ ...value, [f.key]: e.target.checked })}
                    />
                    <span className="muted">Enable this feature</span>
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
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={save}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save changes
            </button>
          </>
        )}
      </div>
    </div>
  )
}
