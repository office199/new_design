import { useEffect, useRef, useState } from 'react'
import { ACCENTS, useTheme } from '../theme/ThemeContext'

export default function ThemeSwitcher() {
  const { mode, accent, toggleMode, setAccent } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[])

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} className="grid h-9 w-9 place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory-dim transition-colors hover:bg-surface-2 hover:text-ivory hover:border-border-mid" aria-label="Theme">
        {mode==='dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[260px] overflow-hidden rounded-2xl border border-border-mid bg-surface-raised shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-pop-in">
          <div className="border-b border-border-soft p-4">
            <h4 className="text-[13px] font-semibold">Appearance</h4>
            <p className="mt-1 text-[11px] text-ivory-faint">Customize look & feel</p>
          </div>

          <button onClick={toggleMode} className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-surface-1">
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 border border-border-soft">
                {mode==='dark' ? '🌙' : '☀️'}
              </span>
              {mode==='dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className={`relative h-[22px] w-[36px] rounded-full border transition-all ${mode==='light' ? 'bg-saffron border-saffron' : 'bg-surface-3 border-border-soft'}`}>
              <span className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all ${mode==='light' ? 'translate-x-[15px]' : 'translate-x-[2px]'}`} />
            </span>
          </button>

          <div className="border-t border-border-soft px-4 py-3">
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ivory-faint">Accent</div>
            <div className="flex gap-2">
              {ACCENTS.map(a=>(
                <button key={a.key} onClick={()=>setAccent(a.key)} className={`h-8 w-8 rounded-full border-2 transition-all ${a.key===accent ? 'scale-110 border-ivory shadow-[0_0_0_3px_var(--color-surface-2)]' : 'border-transparent hover:scale-105'}`} style={{background:a.swatch}} title={a.label} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
