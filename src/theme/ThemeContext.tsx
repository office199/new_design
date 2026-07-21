import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'dark' | 'light'
export type Accent = 'saffron' | 'azure' | 'emerald' | 'rose' | 'violet'

// eslint-disable-next-line react-refresh/only-export-components
export const ACCENTS: { key: Accent; label: string; swatch: string }[] = [
  { key: 'saffron', label: 'Saffron', swatch: '#f4811f' },
  { key: 'azure', label: 'Azure', swatch: '#3b82f6' },
  { key: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { key: 'rose', label: 'Rose', swatch: '#f43f5e' },
  { key: 'violet', label: 'Violet', swatch: '#8b5cf6' },
]

const MODE_KEY = 'hj_admin_theme_mode'
const ACCENT_KEY = 'hj_admin_theme_accent'

function readMode(): ThemeMode {
  const stored = localStorage.getItem(MODE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readAccent(): Accent {
  const stored = localStorage.getItem(ACCENT_KEY) as Accent | null
  return stored && ACCENTS.some((a) => a.key === stored) ? stored : 'saffron'
}

interface ThemeContextValue {
  mode: ThemeMode
  accent: Accent
  toggleMode: () => void
  setAccent: (accent: Accent) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Applies data-theme / data-accent to <html> and persists the choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readMode)
  const [accent, setAccentState] = useState<Accent>(readAccent)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
    localStorage.setItem(ACCENT_KEY, accent)
  }, [accent])

  const toggleMode = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const setAccent = useCallback((a: Accent) => setAccentState(a), [])

  const value = useMemo(() => ({ mode, accent, toggleMode, setAccent }), [mode, accent, toggleMode, setAccent])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
