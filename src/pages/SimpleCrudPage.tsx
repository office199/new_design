import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { api, mediaUrl } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { Row } from '../components/DataTable'

export interface SelectOption {
  value: string
  label: string
}

export interface CrudField {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  /**
   * 'image' / 'video' render a file-upload control next to the URL text
   * input — picking a file uploads it immediately and fills the URL in.
   * 'select' renders a dropdown backed by `loadOptions`. Defaults to 'text'.
   */
  kind?: 'text' | 'image' | 'video' | 'select'
  /** For kind: 'select' — fetched once per page load (e.g. the astrologer list). */
  loadOptions?: () => Promise<SelectOption[]>
}

interface SimpleCrudPageProps {
  title: string
  subtitle?: string
  endpoint: string
  fields: CrudField[]
  /** Columns (row keys) to display in the table. */
  display: { key: string; label: string }[]
}

function emptyForm(fields: CrudField[]): Record<string, string> {
  const form: Record<string, string> = {}
  for (const f of fields) form[f.key] = ''
  return form
}

function normalizeBody(fields: CrudField[], form: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const f of fields) {
    const v = (form[f.key] ?? '').trim()
    // Select fields (e.g. astrologer_id) send null rather than "" when cleared.
    body[f.key] = v === '' && f.kind === 'select' ? null : v
  }
  return body
}

/** List + create + edit + delete for simple content resources (banners, videos). */
export default function SimpleCrudPage({ title, subtitle, endpoint, fields, display }: SimpleCrudPageProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(fields))
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)
  const [optionsMap, setOptionsMap] = useState<Record<string, SelectOption[]>>({})

  const selectFields = useMemo(() => fields.filter((f) => f.kind === 'select' && f.loadOptions), [fields])

  const load = useCallback(async () => {
    try {
      setRows(await api<Row[]>(endpoint))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [endpoint])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    for (const f of selectFields) {
      f.loadOptions!()
        .then((opts) => {
          if (!cancelled) setOptionsMap((prev) => ({ ...prev, [f.key]: opts }))
        })
        .catch(() => {
          // Non-fatal — the field falls back to a plain text/UUID input.
        })
    }
    return () => {
      cancelled = true
    }
  }, [selectFields])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api(endpoint, { method: 'POST', body: normalizeBody(fields, form) })
      setForm(emptyForm(fields))
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(id: string) {
    await api(`${endpoint}/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div className="page-head">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {error && <div className="error-banner">{error}</div>}

      <form className="card" style={{ marginBottom: 20 }} onSubmit={create}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {fields.map((f) => (
            <div key={f.key} style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--color-ivory-dim)', marginBottom: 6 }}>
                {f.label}
              </label>
              <FieldControl
                field={f}
                value={form[f.key] ?? ''}
                options={optionsMap[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            </div>
          ))}
          <button className="btn-primary" type="submit">Add</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr>
              {display.map((d) => <th key={d.key}>{d.label}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id as string}>
                {display.map((d) => {
                  const field = fields.find((f) => f.key === d.key)
                  return (
                    <td key={d.key} data-label={d.label}>
                      {renderDisplayValue(r[d.key], field, optionsMap)}
                    </td>
                  )
                })}
                <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-ghost" onClick={() => setEditing(r)}>Edit</button>
                  <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => remove(r.id as string)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td data-empty colSpan={display.length + 1}><div className="empty">Nothing here yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          endpoint={endpoint}
          fields={fields}
          row={editing}
          optionsMap={optionsMap}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

function renderDisplayValue(
  value: unknown,
  field: CrudField | undefined,
  optionsMap: Record<string, SelectOption[]>,
): ReactNode {
  if (value == null || value === '') return <span className="faint">—</span>

  if (field?.kind === 'image') {
    const url = mediaUrl(String(value))
    return (
      <a href={url} target="_blank" rel="noreferrer" title={String(value)}>
        <img src={url} alt="" style={{ height: 32, borderRadius: 6, objectFit: 'cover', verticalAlign: 'middle' }} />
      </a>
    )
  }

  if (field?.kind === 'video') {
    const url = mediaUrl(String(value))
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 12 }}>
        🎬 {String(value).split('/').pop()}
      </a>
    )
  }

  if (field?.kind === 'select') {
    const opts = optionsMap[field.key] ?? []
    const match = opts.find((o) => o.value === String(value))
    return match ? match.label : <span className="mono">{String(value)}</span>
  }

  return String(value)
}

function FieldControl({
  field,
  value,
  onChange,
  options,
}: {
  field: CrudField
  value: string
  onChange: (v: string) => void
  options?: SelectOption[]
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (field.kind === 'select') {
    return (
      <select value={value} required={field.required} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.placeholder ?? '— none —'}</option>
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    )
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const { url } = field.kind === 'video' ? await adminApi.uploadVideo(file) : await adminApi.uploadImage(file)
      onChange(url)
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <input
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(e) => onChange(e.target.value)}
      />
      {(field.kind === 'image' || field.kind === 'video') && (
        <div className="row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="file"
            accept={field.kind === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFile}
            disabled={uploading}
            style={{ fontSize: 12, padding: 0, border: 'none', background: 'none' }}
          />
          {uploading && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
          {!uploading && value && field.kind === 'image' && (
            <img src={mediaUrl(value)} alt="" style={{ height: 36, borderRadius: 6, objectFit: 'cover' }} />
          )}
          {!uploading && value && field.kind === 'video' && (
            <span className="muted mono" style={{ fontSize: 12 }} title={value}>
              🎬 {value.split('/').pop()}
            </span>
          )}
        </div>
      )}
      {uploadError && (
        <div className="error-banner" style={{ marginTop: 6, fontSize: 12, padding: '6px 10px' }}>{uploadError}</div>
      )}
    </div>
  )
}

function EditModal({
  endpoint,
  fields,
  row,
  optionsMap,
  onClose,
  onDone,
}: {
  endpoint: string
  fields: CrudField[]
  row: Row
  optionsMap: Record<string, SelectOption[]>
  onClose: () => void
  onDone: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of fields) {
      const v = row[f.key]
      init[f.key] = v == null ? '' : String(v)
    }
    return init
  })
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
      await api(`${endpoint}/${row.id as string}`, { method: 'PATCH', body: normalizeBody(fields, form) })
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20 }}>Edit</h2>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
        {fields.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            <FieldControl
              field={f}
              value={form[f.key] ?? ''}
              options={optionsMap[f.key]}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
            />
          </div>
        ))}
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
