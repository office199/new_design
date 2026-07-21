// Thin fetch wrapper: base URL, bearer token, JSON, and 401 handling.

const BASE = import.meta.env.VITE_API_TARGET ?? 'https://fastapi.hindustanijyotish.com/v1'
const TOKEN_KEY = 'hj_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
}

async function handleResponse<T>(resp: Response): Promise<T> {
  if (resp.status === 401) {
    setToken(null)
    // Let the router redirect to /login on the next render.
    if (location.pathname !== '/login') location.href = '/login'
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  const text = await resp.text()
  const data = text ? JSON.parse(text) : null

  if (!resp.ok) {
    const detail = (data && (data.detail || data.message)) || resp.statusText
    throw new ApiError(resp.status, typeof detail === 'string' ? detail : 'Request failed')
  }
  return data as T
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  return handleResponse<T>(resp)
}

/**
 * Multipart upload helper (bearer auth, no Content-Type set so the browser
 * fills in the multipart boundary). Used for the content-media upload routes
 * (`/admin/uploads/image`, `/admin/uploads/video`).
 */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const formData = new FormData()
  formData.append('file', file)

  const resp = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData })
  return handleResponse<T>(resp)
}

export interface DownloadResult {
  blob: Blob
  /** Filename inferred from the `Content-Disposition` header, if present. */
  filename: string | null
}

/**
 * Fetches a binary resource (bearer auth) and returns the raw Blob (plus an
 * inferred filename) — used for "does a config file exist / let me download
 * it" flows (Firebase per-app client-config). A 404 response throws
 * `ApiError(404, …)` so callers can treat "not configured yet" as an
 * expected, non-fatal case.
 */
export async function apiDownload(path: string): Promise<DownloadResult> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch(`${BASE}${path}`, { method: 'GET', headers })

  if (resp.status === 401) {
    setToken(null)
    if (location.pathname !== '/login') location.href = '/login'
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  if (!resp.ok) {
    let detail = resp.statusText
    try {
      const text = await resp.text()
      if (text) {
        const data = JSON.parse(text)
        detail = (data && (data.detail || data.message)) || detail
      }
    } catch {
      // Non-JSON error body — fall back to statusText.
    }
    throw new ApiError(resp.status, typeof detail === 'string' ? detail : 'Request failed')
  }

  const disposition = resp.headers.get('content-disposition')
  const match = disposition ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition) : null
  const filename = match ? decodeURIComponent(match[1]) : null

  return { blob: await resp.blob(), filename }
}

/** Triggers a browser "Save As" download for an in-memory Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Resolves a possibly root-relative media URL (e.g. `/media/content/...`
 * returned by the upload endpoints) against the API origin, so `<img>`/
 * `<video>` previews work regardless of the admin console's own origin.
 */
export function mediaUrl(path: string): string {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  try {
    return `${new URL(BASE).origin}${path}`
  } catch {
    return path
  }
}
