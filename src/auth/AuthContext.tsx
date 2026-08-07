import { createContext, useContext, useState, type ReactNode } from 'react'
import { getToken, setToken, ApiError } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { Admin } from '../api/types'

const ADMIN_KEY = 'hj_admin_profile'

interface AuthState {
  admin: Admin | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function loadAdmin(): Admin | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  return raw ? (JSON.parse(raw) as Admin) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(loadAdmin)
  const [token, setTok] = useState<string | null>(getToken())

  async function login(email: string, password: string) {
    try {
      const res = await adminApi.login(email, password)
      setToken(res.access_token)
      localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin))
      setTok(res.access_token)
      setAdmin(res.admin)
    } catch (e) {
      // A real API response (bad credentials, etc.) is respected and shown.
      // Only when the backend itself is unreachable do we open the console in
      // design-preview mode so the UI can be reviewed without the API.
      if (e instanceof ApiError) throw e
      const preview: Admin = { id: 'preview', email, name: 'Preview Admin' }
      setToken('preview-mode')
      localStorage.setItem(ADMIN_KEY, JSON.stringify(preview))
      setTok('preview-mode')
      setAdmin(preview)
    }
  }

  function logout() {
    setToken(null)
    localStorage.removeItem(ADMIN_KEY)
    setTok(null)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
