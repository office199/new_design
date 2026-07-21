import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: FormEvent){
    e.preventDefault()
    setError(null); setBusy(true)
    try{ await login(email,password); navigate('/') }
    catch(err){ setError(err instanceof ApiError ? err.message : 'Login failed') }
    finally{ setBusy(false) }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-bg-0">
      {/* Brand panel - desktop */}
      <div className="relative hidden overflow-hidden bg-[#0e1022] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[20%] -top-[10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,129,31,0.22),transparent_70%)] blur-[1px]" />
          <div className="absolute -right-[20%] top-[40%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.22),transparent_70%)]" />
          <div className="absolute left-[20%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,181,71,0.18),transparent_70%)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{backgroundImage:`linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`, backgroundSize:'48px 48px'}} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 border border-white/15 text-[24px] shadow-[0_0_30px_rgba(244,129,31,0.35)]">🪔</div>
          <div>
            <div className="font-display text-[19px] font-bold tracking-tight text-white">Hindustani Jyotish</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Admin Console · Pro</div>
          </div>
        </div>

        <div className="relative z-10 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white/70 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live Platform Control · v2.0
          </div>
          <h1 className="mt-6 font-display text-[42px] xl:text-[48px] font-[750] leading-[0.9] tracking-[-0.03em] text-white">
            Guide the stars, <span className="bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">run the platform.</span>
          </h1>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-white/60">
            A refined mission control for astrologers, seekers, wallets, sessions and content — built for scale, speed and trust.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-[420px]">
            {[
              { k:'KYC Review', v:'Approve astrologers in seconds', icon:'🪪' },
              { k:'Wallet Ops', v:'Recharges, payouts & refunds', icon:'💳' },
              { k:'Live Sessions', v:'Chat / Call / Video insights', icon:'📹' },
              { k:'Content Hub', v:'Banners, videos, gifts', icon:'🎁' },
            ].map(c=>(
              <div key={c.k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-white/80"><span>{c.icon}</span>{c.k}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-white/45">{c.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-[380px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div><div className="text-[11px] uppercase font-bold tracking-wide text-white/40">Uptime</div><div className="mt-1 font-mono text-[13px] font-bold text-white">99.9%</div></div>
            <div><div className="text-[11px] uppercase font-bold tracking-wide text-white/40">Latency</div><div className="mt-1 font-mono text-[13px] font-bold text-white">42ms avg</div></div>
            <div><div className="text-[11px] uppercase font-bold tracking-wide text-white/40">Region</div><div className="mt-1 font-mono text-[13px] font-bold text-white">AP-South</div></div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/30">
          <span className="h-px w-8 bg-white/20" /> © {new Date().getFullYear()} Hindustani Jyotish · Secure Admin Access · Encrypted
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-screen items-center justify-center bg-bg-1 px-5 py-8 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute right-[-30%] top-[-30%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(244,129,31,0.12),transparent_70%)]" />
        <div className="pointer-events-none absolute left-[-20%] bottom-[-20%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.10),transparent_70%)]" />

        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 border border-amber-500/20 text-[22px] shadow-[0_6px_18px_rgba(244,129,31,0.35)]">🪔</div>
              <div><div className="font-display text-[16px] font-bold">Hindustani Jyotish</div><div className="text-[10px] font-bold uppercase tracking-wide text-saffron">Admin Console · Pro</div></div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400">Live</span>
          </div>

          <div className="rounded-[28px] border border-border-soft bg-surface-raised p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[26px] sm:text-[28px] font-bold tracking-tight leading-tight">Welcome back</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ivory-dim">Sign in to your administrator account. Secure, encrypted, JWT protected.</p>
              </div>
              <div className="hidden sm:grid h-10 w-10 place-items-center rounded-xl bg-surface-1 border border-border-soft text-[18px]">🔐</div>
            </div>

            {error && (
              <div className="mt-6 flex gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Email address</label>
                <div className="relative group">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint group-focus-within:text-saffron transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@hindustanijyotish.in" autoComplete="username" required
                    className="h-[48px] w-full rounded-xl border border-border-soft bg-surface-1 pl-11 pr-4 text-[14px] font-medium outline-none transition-all placeholder:text-ivory-faint focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Password</label>
                <div className="relative group">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint group-focus-within:text-saffron transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required
                    className="h-[48px] w-full rounded-xl border border-border-soft bg-surface-1 pl-11 pr-11 text-[14px] font-medium outline-none transition-all placeholder:text-ivory-faint focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
                  />
                  <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ivory-faint transition-colors hover:bg-surface-2 hover:text-ivory">
                    {showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={busy} className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 text-[14px] font-bold text-black shadow-[0_8px_20px_rgba(244,129,31,0.28)] transition-all hover:brightness-105 hover:shadow-[0_10px_28px_rgba(244,129,31,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0">
                {busy ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in…</> : <>Sign in <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
              </button>

              <div className="flex items-center justify-between text-[11px] text-ivory-faint">
                <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> JWT · encrypted session</span>
                <span className="hidden sm:block">Need help? contact devops</span>
              </div>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-ivory-faint">
            <span className="h-px w-8 bg-border-soft" />
            © {new Date().getFullYear()} Hindustani Jyotish · Secure Admin v2
            <span className="h-px w-8 bg-border-soft" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
            {[
              { k:'KYC', v:'Fast review' },
              { k:'Wallet', v:'Real-time' },
              { k:'Live', v:'24/7' },
            ].map(i=>(
              <div key={i.k} className="rounded-xl border border-border-soft bg-surface-1/60 p-3 text-center"><div className="text-[11px] font-bold uppercase tracking-wide text-ivory-faint">{i.k}</div><div className="mt-1 text-[11px] text-ivory-dim">{i.v}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
