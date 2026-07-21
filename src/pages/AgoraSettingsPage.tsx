import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { AgoraDiagnoseResult } from '../api/types'

interface AgoraSetting {
  id: string
  app_name: string | null
  app_id: string
  app_certificate: string
  token_expire_seconds: number
  is_active: boolean
}

export default function AgoraSettingsPage() {
  const [rows, setRows] = useState<AgoraSetting[]>([])
  const [error, setError] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [appId, setAppId] = useState('')
  const [cert, setCert] = useState('')
  const [expiry, setExpiry] = useState('3600')

  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnose, setDiagnose] = useState<AgoraDiagnoseResult | null>(null)
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await api<AgoraSetting[]>('/admin/agora-settings'))
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
      await api('/admin/agora-settings', {
        method: 'POST',
        body: {
          app_name: appName || null,
          app_id: appId.trim(),
          app_certificate: cert.trim(),
          token_expire_seconds: Number(expiry) || 3600,
          is_active: rows.length === 0, // first one becomes active automatically
        },
      })
      setAppName('')
      setAppId('')
      setCert('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function activate(id: string) {
    await api(`/admin/agora-settings/${id}/activate`, { method: 'POST' })
    await load()
  }

  async function remove(id: string) {
    await api(`/admin/agora-settings/${id}`, { method: 'DELETE' })
    await load()
  }

  async function runDiagnose() {
    setDiagnosing(true)
    setDiagnoseError(null)
    try {
      setDiagnose(await adminApi.diagnoseAgora())
    } catch (e) {
      setDiagnose(null)
      setDiagnoseError((e as Error).message)
    } finally {
      setDiagnosing(false)
    }
  }

  const diagnoseOk = diagnose?.diagnosis.startsWith('OK')

  return (
    <div>
      <div className="page-head row spread" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1>Agora Settings</h1>
          <p className="muted">
            Add Agora credential sets and activate the one the apps should use for
            audio/video calls &amp; live streaming. Only one can be active at a time.
          </p>
        </div>
        <button className="btn-ghost" type="button" onClick={runDiagnose} disabled={diagnosing}>
          {diagnosing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {diagnoseError && <div className="error-banner">Diagnose failed: {diagnoseError}</div>}
      {diagnose && (
        <div className={diagnoseOk ? 'success-banner' : 'error-banner'}>
          <strong>{diagnoseOk ? 'Connection OK' : 'Connection problem'}</strong> — {diagnose.diagnosis}
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            package installed: {String(diagnose.agora_token_builder_installed)} · app id set:{' '}
            {String(diagnose.active_creds_app_id_set)} · certificate set:{' '}
            {String(diagnose.active_creds_app_certificate_set)} · test token: {diagnose.test_token_prefix}… (
            {diagnose.test_token_is_placeholder ? 'placeholder' : 'real'})
          </div>
        </div>
      )}

      <form className="card" style={{ marginBottom: 20 }} onSubmit={create}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <Field label="App name" flex="1 1 160px">
            <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. Production" />
          </Field>
          <Field label="App ID" flex="1 1 220px">
            <input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Agora App ID" required />
          </Field>
          <Field label="App Certificate" flex="1 1 220px">
            <input value={cert} onChange={(e) => setCert(e.target.value)} placeholder="Agora App Certificate" required />
          </Field>
          <Field label="Token expiry (s)" flex="0 0 120px">
            <input value={expiry} onChange={(e) => setExpiry(e.target.value)} inputMode="numeric" />
          </Field>
          <button className="btn-primary" type="submit">Add credentials</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              <th>Active</th><th>Name</th><th>App ID</th><th>Certificate</th><th>Expiry</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="Active">
                  {r.is_active ? (
                    <span className="badge badge-approved">active</span>
                  ) : (
                    <span className="badge badge-rejected">off</span>
                  )}
                </td>
                <td data-label="Name">{r.app_name ?? <span className="faint">—</span>}</td>
                <td data-label="App ID" className="mono">{r.app_id}</td>
                <td data-label="Certificate" className="mono">{mask(r.app_certificate)}</td>
                <td data-label="Expiry">{r.token_expire_seconds}s</td>
                <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {!r.is_active && (
                    <button className="btn-primary" onClick={() => activate(r.id)}>Activate</button>
                  )}
                  <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td data-empty colSpan={6}><div className="empty">No Agora credentials yet. Add one above.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function mask(s: string): string {
  if (s.length <= 8) return '••••'
  return `${s.slice(0, 4)}••••${s.slice(-4)}`
}

function Field({ label, flex, children }: { label: string; flex: string; children: React.ReactNode }) {
  return (
    <div style={{ flex }}>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--color-ivory-dim)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
