import { useEffect, useRef, useState } from 'react'
import { ACCENTS, useTheme } from '../theme/ThemeContext'

/** Header control: light/dark toggle + brand-accent color picker. */
export default function ThemeSwitcher() {
  const { mode, accent, toggleMode, setAccent } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div className="notif" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen((o) => !o)} aria-label="Theme">
        {mode === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
      {open && (
        <div className="notif-panel card theme-panel">
          <div className="notif-head">Appearance</div>

          <button className="theme-mode-row" onClick={toggleMode}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {mode === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
              {mode === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="theme-mode-switch" data-on={mode === 'light'}>
              <span className="theme-mode-knob" />
            </span>
          </button>

          <div className="theme-accent-label faint">Accent color</div>
          <div className="theme-swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                className="theme-swatch"
                data-active={a.key === accent}
                style={{ background: a.swatch }}
                onClick={() => setAccent(a.key)}
                aria-label={a.label}
                title={a.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
