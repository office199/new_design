import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { ApiError, downloadBlob } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { FirebaseServiceAccountStatus, MaintenanceApp } from '../api/types'

const CLIENT_CONFIG_APPS: { app: MaintenanceApp; label: string }[] = [
  { app: 'user', label: 'User App' },
  { app: 'astro', label: 'Astrologer App' },
]

/** Firebase service-account (push notifications) + per-app client config uploads. */
export default function FirebaseConfigPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Firebase Config</h1>
        <p className="muted">
          Manage the Firebase server credential (used for push notifications) and the per-app
          client config files consumed by the mobile app builds.
        </p>
      </div>

      <ServiceAccountSection />

      <div className="page-head" style={{ marginTop: 32, marginBottom: 12 }}>
        <h2 style={{ fontSize: 18 }}>Client Config</h2>
      </div>
      <div className="note-banner">
        Uploading here updates the file available for the next app build — it does NOT push to
        already-installed apps on users&apos; devices.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {CLIENT_CONFIG_APPS.map((a) => (
          <ClientConfigSection key={a.app} app={a.app} label={a.label} />
        ))}
      </div>
    </div>
  )
}

function ServiceAccountSection() {
  const [status, setStatus] = useState<FirebaseServiceAccountStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const configured = status?.exists ?? null

  const load = useCallback(async () => {
    try {
      setStatus(await adminApi.firebaseServiceAccountStatus())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const s = await adminApi.uploadFirebaseServiceAccount(file)
      setSuccess(`Uploaded — project "${s.project_id ?? '?'}" (${s.client_email ?? '?'}).`)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="row spread" style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 18 }}>Service Account</h2>
        <span className={`badge badge-${configured ? 'approved' : 'rejected'}`}>
          {configured ? 'configured' : 'not configured'}
        </span>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Server-side credential used to send push notifications. Only the project id and client
        email are ever shown here — the private key itself is never displayed.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {configured && status && (
        <div className="kv" style={{ margin: '14px 0' }}>
          <div className="k">Project ID</div>
          <div className="v mono">{status.project_id}</div>
          <div className="k">Client email</div>
          <div className="v mono">{status.client_email}</div>
          <div className="k">Push enabled</div>
          <div className="v">{String(status.push_enabled)}</div>
        </div>
      )}

      <div className="field">
        <label>{configured ? 'Replace service-account JSON' : 'Upload service-account JSON'}</label>
        <input type="file" accept="application/json,.json" onChange={handleFile} disabled={uploading} />
        {uploading && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
      </div>
    </div>
  )
}

function ClientConfigSection({ app, label }: { app: MaintenanceApp; label: string }) {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { blob, filename: fname } = await adminApi.downloadFirebaseClientConfig(app)
      setConfigured(true)
      setCachedBlob(blob)
      setFilename(fname ?? `${app}-google-services.json`)
      setError(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setConfigured(false)
        setCachedBlob(null)
        setFilename(null)
        setError(null)
      } else {
        setError((e as Error).message)
      }
    }
  }, [app])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await adminApi.uploadFirebaseClientConfig(app, file)
      setSuccess(result.project_id ? `Uploaded — project "${result.project_id}".` : 'Uploaded.')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function download() {
    if (cachedBlob) downloadBlob(cachedBlob, filename ?? `${app}-google-services.json`)
  }

  return (
    <div className="card">
      <div className="row spread" style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: 16 }}>{label}</h3>
        <span className={`badge badge-${configured ? 'approved' : 'rejected'}`}>
          {configured ? 'configured' : 'not configured'}
        </span>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {configured && (
        <button className="btn-ghost" type="button" onClick={download} style={{ marginBottom: 10 }}>
          Download current config
        </button>
      )}

      <div className="field" style={{ marginTop: configured ? 0 : 10 }}>
        <label>{configured ? 'Replace config file' : 'Upload config file'}</label>
        <input type="file" onChange={handleFile} disabled={uploading} />
        {uploading && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
      </div>
    </div>
  )
}
