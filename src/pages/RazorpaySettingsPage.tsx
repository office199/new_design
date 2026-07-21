import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { RazorpayDiagnoseResult, RazorpaySettings } from '../api/types'

/**
 * Razorpay payment-gateway credentials. Secrets are returned masked from the
 * backend; the admin must click "Replace" to enter a new value, otherwise the
 * stored secret is left untouched (sent as empty string = "keep existing").
 */
export default function RazorpaySettingsPage() {
  const [current, setCurrent] = useState<RazorpaySettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [keyId, setKeyId] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [editSecret, setEditSecret] = useState(false)
  const [keySecret, setKeySecret] = useState('')
  const [editWebhook, setEditWebhook] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState('')

  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnose, setDiagnose] = useState<RazorpayDiagnoseResult | null>(null)
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const s = await adminApi.getRazorpay()
      setCurrent(s)
      setKeyId(s.key_id ?? '')
      setIsActive(s.is_active)
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
    setSaving(true)
    try {
      await adminApi.saveRazorpay({
        key_id: keyId.trim(),
        // Empty string tells the backend to keep the existing secret.
        key_secret: editSecret ? keySecret.trim() : '',
        webhook_secret: editWebhook ? webhookSecret.trim() : '',
        is_active: isActive,
      })
      setSaved(true)
      setEditSecret(false)
      setKeySecret('')
      setEditWebhook(false)
      setWebhookSecret('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function runDiagnose() {
    setDiagnosing(true)
    setDiagnoseError(null)
    try {
      setDiagnose(await adminApi.diagnoseRazorpay())
    } catch (e) {
      setDiagnose(null)
      setDiagnoseError((e as Error).message)
    } finally {
      setDiagnosing(false)
    }
  }

  const diagnoseOk = diagnose?.credentials_configured && diagnose.test_order_ok

  return (
    <div>
      <div className="page-head row spread" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1>Razorpay Credentials</h1>
          <p className="muted">Payment-gateway keys used for wallet recharges and webhooks.</p>
        </div>
        <button className="btn-ghost" type="button" onClick={runDiagnose} disabled={diagnosing}>
          {diagnosing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="success-banner">Saved.</div>}
      {diagnoseError && <div className="error-banner">Diagnose failed: {diagnoseError}</div>}
      {diagnose && (
        <div className={diagnoseOk ? 'success-banner' : 'error-banner'}>
          <strong>{diagnoseOk ? 'Connection OK' : 'Connection problem'}</strong> — {diagnose.diagnosis}
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            source: {diagnose.source ?? 'none'} · dev mode: {String(diagnose.dev_mode)}
            {diagnose.key_id_prefix && <> · key id: {diagnose.key_id_prefix}…</>}
            {typeof diagnose.test_order_ok === 'boolean' && <> · test order ok: {String(diagnose.test_order_ok)}</>}
          </div>
          {!diagnoseOk && diagnose.detail && (
            <pre
              className="mono"
              style={{
                marginTop: 8,
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                background: 'var(--surface-1)',
                padding: 10,
                borderRadius: 8,
              }}
            >
              {diagnose.detail}
            </pre>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="row spread" style={{ marginBottom: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Status</span>
          <span className={`badge badge-${current?.configured ? (current.is_active ? 'approved' : 'pending') : 'rejected'}`}>
            {current?.configured ? (current.is_active ? 'active' : 'inactive') : 'not configured'}
          </span>
        </div>

        <div className="field">
          <label>Key ID</label>
          <input value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_live_…" className="mono" />
        </div>

        <SecretField
          label="Key Secret"
          masked={current?.key_secret_masked ?? null}
          editing={editSecret}
          value={keySecret}
          onEdit={() => setEditSecret(true)}
          onCancel={() => {
            setEditSecret(false)
            setKeySecret('')
          }}
          onChange={setKeySecret}
        />

        <SecretField
          label="Webhook Secret"
          masked={current?.webhook_secret_masked ?? null}
          editing={editWebhook}
          value={webhookSecret}
          onEdit={() => setEditWebhook(true)}
          onCancel={() => {
            setEditWebhook(false)
            setWebhookSecret('')
          }}
          onChange={setWebhookSecret}
        />

        <div className="field">
          <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="muted">Active — use these credentials for live payments</span>
          </label>
        </div>

        <button className="btn-primary" style={{ marginTop: 18 }} disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save credentials'}
        </button>
      </div>
    </div>
  )
}

function SecretField({
  label,
  masked,
  editing,
  value,
  onEdit,
  onCancel,
  onChange,
}: {
  label: string
  masked: string | null
  editing: boolean
  value: string
  onEdit: () => void
  onCancel: () => void
  onChange: (v: string) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {editing ? (
        <div className="row" style={{ gap: 8 }}>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`New ${label.toLowerCase()}`} className="mono" autoFocus />
          <button className="btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      ) : (
        <div className="row" style={{ gap: 8 }}>
          <input className="mono" value={masked ?? 'Not set'} readOnly style={{ color: 'var(--ivory-faint)' }} />
          <button className="btn-ghost" type="button" onClick={onEdit}>Replace</button>
        </div>
      )}
    </div>
  )
}
