import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Row } from '../components/DataTable'

interface Paged<T> {
  items?: T[]
  results?: T[]
  data?: T[]
  total?: number
  count?: number
}

export interface PagedResult<T> {
  rows: T[]
  total: number | null
  page: number
  size: number
  loading: boolean
  error: string | null
  hasPrev: boolean
  hasNext: boolean
  setPage: (p: number) => void
  setSize: (s: number) => void
  reload: () => void
}

/** Normalise either a bare array or a `{items,total}` wrapper into rows+total. */
function normalise<T>(payload: unknown): { rows: T[]; total: number | null } {
  if (Array.isArray(payload)) return { rows: payload as T[], total: null }
  const p = (payload ?? {}) as Paged<T>
  const rows = p.items ?? p.results ?? p.data ?? []
  const total = p.total ?? p.count ?? null
  return { rows, total }
}

/**
 * Fetches `endpoint` with backend `page`/`size` query params. Works whether the
 * endpoint returns a bare array (page-sized slice) or a `{items,total}` wrapper.
 */
export function usePagedData<T = Row>(
  endpoint: string,
  initialSize = 25,
): PagedResult<T> {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initialSize)
  const [rows, setRows] = useState<T[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sep = endpoint.includes('?') ? '&' : '?'
      const payload = await api<unknown>(`${endpoint}${sep}page=${page}&size=${size}`)
      const n = normalise<T>(payload)
      setRows(n.rows)
      setTotal(n.total)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, size])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const hasPrev = page > 1
  const hasNext = total != null ? page * size < total : rows.length >= size

  return {
    rows,
    total,
    page,
    size,
    loading,
    error,
    hasPrev,
    hasNext,
    setPage,
    setSize,
    reload: load,
  }
}
