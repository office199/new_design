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
    <div className="login-page min-h-screen text-ivory antialiased relative overflow-hidden">
      {/* Heritage backdrop — soft gold & peacock orbs over silk */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[15%] -top-[20%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(200,147,42,0.16),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '9s'}} />
        <div className="absolute -right-[15%] top-[22%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(14,79,69,0.13),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '11s', animationDelay: '2s'}} />
        <div className="absolute left-[22%] bottom-[-16%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(192,91,60,0.09),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '13s', animationDelay: '4s'}} />
        <div className="motif absolute inset-0 opacity-[0.07]" />
        {/* corner motifs */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-[3rem] border border-[rgba(200,147,42,0.25)] [transform:rotate(45deg)]" />
        <div className="absolute -right-28 -bottom-28 h-80 w-80 rounded-[3.5rem] border border-[rgba(14,79,69,0.2)] [transform:rotate(45deg)]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[480px] px-5 py-10 sm:py-16">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="grid h-16 w-16 place-items-center rounded-[22px] login-brand text-[30px] shadow-[0_14px_36px_rgba(200,147,42,0.35)]">
              <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">✦</span>
            </div>
            <div className="text-left">
              <h1 className="font-display text-[26px] font-bold tracking-tight leading-none text-[#0E4F45]">Hindustani</h1>
              <h1 className="font-display text-[26px] font-bold tracking-tight leading-none text-[#0E4F45]">Jyotish</h1>
            </div>
          </div>
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-[#A87A1D]">✦ ADMINISTRATOR WORKSPACE · SECURE ACCESS ✦</p>
          <div className="zari-line mx-auto mt-4 w-44" />
        </div>

        <Card className="login-card p-8 sm:p-10">
          <PageHeader
            title="Welcome back"
            subtitle="Sign in to your administrator account. Your session is encrypted and protected by JWT."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A87A1D]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
          />
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[rgba(179,64,46,0.3)] bg-[rgba(179,64,46,0.08)] px-4 py-3 text-[13px] font-medium text-[#96291B]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-7">
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@hindustanijyotish.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                className="h-[48px]"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="h-[48px] pr-12"
                />
                <button
                  type="button"
                  onClick={()=>setShowPw(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-ivory-faint hover:text-ivory hover:bg-surface-2 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn-primary mt-7 w-full h-[50px] text-[14.5px] disabled:opacity-60">
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  Signing in…
                </span>
              ) : 'Sign in securely'}
            </button>
          </form>
        </Card>

        <p className="mt-8 text-center text-[11px] font-medium tracking-wide text-ivory-faint">
          Protected by JWT · Hindustani Jyotish Admin Console
          <br />
          <span className="text-[10.5px] text-[rgba(168,122,29,0.8)]">Backend offline? Any credentials open the console in design-preview mode.</span>
        </p>
      </main>
    </div>
  )
}
