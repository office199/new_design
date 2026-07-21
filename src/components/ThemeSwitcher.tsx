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
        <span aria-hidden>{mode === 'dark' ? '🌙' : '☀️'}</span>
      </button>
      {open && (
        <div className="notif-panel card theme-panel">
          <div className="notif-head">Appearance</div>

          <button className="theme-mode-row" onClick={toggleMode}>
            <span>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</span>
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
