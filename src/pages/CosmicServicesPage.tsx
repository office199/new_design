import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

interface Service {
  id: string
  key: string
  name: string
  price: string
  is_active: boolean
}

export default function CosmicServicesPage() {
  const [rows, setRows] = useState<Service[]>([])
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const list = await api<Service[]>('/admin/cosmic-services')
      setRows(list)
      setDrafts(Object.fromEntries(list.map((s) => [s.key, s.price])))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function save(s: Service) {
    try {
      await api(`/admin/cosmic-services/${s.key}`, { method: 'PATCH', body: { price: drafts[s.key] } })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function toggle(s: Service) {
    await api(`/admin/cosmic-services/${s.key}`, { method: 'PATCH', body: { is_active: !s.is_active } })
    await load()
  }

  return (
    <div>
      <div className="page-head">
        <h1>Cosmic Services</h1>
        <p className="muted">Pricing for the Kundli &amp; cosmic-insight tiles.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table table-cards">
          <thead>
            <tr><th>Service</th><th>Price (₹)</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.key}>
                <td data-label="Service">{s.name}</td>
                <td data-label="Price (₹)">
                  <input
                    style={{ maxWidth: 150 }}
                    value={drafts[s.key] ?? ''}
                    onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                  />
                </td>
                <td data-label="Status"><span className={`badge badge-${s.is_active ? 'approved' : 'rejected'}`}>{s.is_active ? 'on' : 'off'}</span></td>
                <td data-actions style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-primary" onClick={() => save(s)}>Save</button>
                  <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => toggle(s)}>
                    {s.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
