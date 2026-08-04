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
    <div className="login-page min-h-screen bg-bg-0 text-ivory antialiased relative overflow-hidden">
      {/* Animated glassmorphism background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[15%] -top-[20%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute -right-[15%] top-[25%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.14),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}} />
        <div className="absolute left-[25%] bottom-[-15%] h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_65%)] blur-[3px] animate-pulse" style={{animationDuration: '12s', animationDelay: '4s'}} />
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:`linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize:'52px 52px'}} />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[480px] px-5 py-10 sm:py-16">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="grid h-16 w-16 place-items-center rounded-[20px] login-brand text-[28px] shadow-[0_12px_32px_rgba(139,92,246,0.4)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-[24px] font-black tracking-tight leading-none bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Hindustani</h1>
              <h1 className="text-[24px] font-black tracking-tight leading-none bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">Jyotish</h1>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">ADMINISTRATOR WORKSPACE · SECURE ACCESS</p>
        </div>

        <Card className="login-card p-8 sm:p-10">
          <PageHeader
            title="Welcome back"
            subtitle="Sign in to your administrator account. Your session is encrypted and protected by JWT."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
          />

          {error && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300 animate-slide-up">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Email address</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ivory-faint">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@hindustanijyotish.in" autoComplete="username" required
                  className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl pl-12 pr-4 text-[15px] font-medium outline-none transition-all placeholder:text-ivory-faint/60 focus:border-violet-400/50 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pw" className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-ivory-faint">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ivory-faint">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </span>
                <input id="pw" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required
                  className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl pl-12 pr-14 text-[15px] font-medium outline-none transition-all placeholder:text-ivory-faint/60 focus:border-violet-400/50 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
                />
                <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-ivory-faint transition-all hover:bg-white/8 hover:text-ivory" aria-label="Toggle password">
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:brightness-110 hover:shadow-[0_12px_32px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0">
              {busy ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[12px] text-ivory-faint">
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                JWT · Encrypted session
              </span>
              <span>Need help? Contact ops</span>
            </div>
          </form>
        </Card>

        <div className="mt-10 text-center text-[12px] text-ivory-faint">
          © {new Date().getFullYear()} Hindustani Jyotish · Secure Admin v3
        </div>
      </main>
    </div>
  )
}
