import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { Card, PageHeader } from '../components/ui/PageShell'

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
    <div className="page-shell min-h-screen bg-bg-0 text-ivory selection:bg-saffron-soft selection:text-saffron-bright antialiased relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[10%] -top-[15%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(244,129,31,0.12),transparent_65%)] blur-[2px]" />
        <div className="absolute -right-[10%] top-[30%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.11),transparent_65%)] blur-[2px]" />
        <div className="absolute left-[20%] bottom-[-10%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(232,181,71,0.09),transparent_65%)] blur-[2px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:`linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`, backgroundSize:'48px 48px'}} />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[480px] px-5 py-10 sm:py-16">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(244,129,31,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] text-[26px]">🪔</div>
            <div className="text-left">
              <h1 className="font-display text-[22px] font-bold tracking-tight leading-none">Hindustani</h1>
              <h1 className="font-display text-[22px] font-bold tracking-tight leading-none text-saffron-bright">Jyotish</h1>
            </div>
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-saffron">Admin Console · Secure JWT Session</p>
        </div>

        <Card className="p-7 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <PageHeader
            title="Welcome back"
            subtitle="Sign in to your administrator account. Your session is encrypted and protected by JWT."
            icon={<span className="text-[20px]">🔐</span>}
          />

          {error && (
            <div className="mt-5 flex gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300 animate-slide-up">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Email address</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint text-[14px]">✉</span>
                <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@hindustanijyotish.in" autoComplete="username" required
                  className="h-[48px] w-full rounded-xl border border-border-soft bg-surface-1 pl-10 pr-4 text-[14px] font-medium outline-none transition-all placeholder:text-ivory-faint/60 focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pw" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint text-[14px]">🔑</span>
                <input id="pw" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required
                  className="h-[48px] w-full rounded-xl border border-border-soft bg-surface-1 pl-10 pr-12 text-[14px] font-medium outline-none transition-all placeholder:text-ivory-faint/60 focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
                />
                <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ivory-faint transition-colors hover:bg-surface-2 hover:text-ivory" aria-label="Toggle password">
                  {showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 text-[14px] font-bold text-black shadow-[0_8px_20px_rgba(244,129,31,0.28)] transition-all hover:brightness-105 hover:shadow-[0_10px_28px_rgba(244,129,31,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0">
              {busy ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in…</> : <>Sign in <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
            </button>

            <div className="flex items-center justify-between text-[11px] text-ivory-faint">
              <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> JWT · Encrypted session</span>
              <span>Need help? Contact ops</span>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center text-[11px] text-ivory-faint">
          © {new Date().getFullYear()} Hindustani Jyotish · Secure Admin v2
        </div>
      </main>
    </div>
  )
}
