import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const stars = [
    { l: 15, t: 20, s: 3, d: 0 },
    { l: 28, t: 60, s: 2, d: 0.5, warm: true },
    { l: 65, t: 25, s: 2.5, d: 1.0 },
    { l: 80, t: 65, s: 2, d: 1.5, warm: true },
    { l: 45, t: 15, s: 2, d: 2.0 },
    { l: 55, t: 80, s: 3, d: 0.8 },
    { l: 88, t: 40, s: 2, d: 1.2, violet: true },
    { l: 25, t: 85, s: 2.5, d: 1.8, warm: true },
  ]

  return (
    <div className="grid grid-cols-[1.2fr_1fr] min-h-screen max-lg:grid-cols-1">
      {/* ── Brand / showcase panel ── */}
      <aside className="relative overflow-hidden p-14 flex flex-col justify-between max-lg:hidden"
        style={{
          background: `radial-gradient(ellipse 800px 500px at 15% 5%, rgba(244, 129, 31, 0.25), transparent 70%),
                       radial-gradient(ellipse 900px 600px at 90% 95%, var(--color-bg-glow), transparent 70%),
                       radial-gradient(ellipse 500px 400px at 50% 50%, rgba(167, 139, 250, 0.1), transparent 60%),
                       linear-gradient(160deg, var(--color-bg-2), var(--color-bg-0))`
        }}
      >
        {/* Orbit rings */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed opacity-15 animate-[orbit-spin_100s_linear_infinite]" style={{ borderColor: 'var(--color-saffron)' }} />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-solid opacity-10 animate-[orbit-spin_70s_linear_infinite_reverse]" style={{ borderColor: 'var(--color-saffron)' }} />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full border border-solid opacity-12 animate-[orbit-spin_50s_linear_infinite]" style={{ borderColor: 'var(--color-violet)' }} />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full border border-solid opacity-10 animate-[orbit-spin_35s_linear_infinite]" style={{ borderColor: 'var(--color-gold)' }} />
        </div>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {stars.map((st, i) => (
            <span
              key={i}
              className={`absolute rounded-full animate-[twinkle_3.5s_ease-in-out_infinite] ${st.warm ? 'bg-saffron-bright shadow-[0_0_12px_var(--color-saffron)]' : st.violet ? 'bg-violet shadow-[0_0_12px_var(--color-violet)]' : 'bg-ivory/70 shadow-[0_0_10px_currentColor]'}`}
              style={{
                left: `${st.l}%`,
                top: `${st.t}%`,
                width: st.s,
                height: st.s,
                animationDelay: `${st.d}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <span className="text-[36px] w-14 h-14 flex items-center justify-center rounded-[--radius-lg] bg-gradient-to-br from-saffron-soft to-transparent border border-border-soft shadow-[0_0_30px_var(--color-saffron-glow)] animate-[glow-pulse_3s_ease-in-out_infinite]">
              🪔
            </span>
            <div>
              <div className="font-display text-[20px] font-semibold tracking-tight">Hindustani Jyotish</div>
              <div className="text-[11px] tracking-widest uppercase text-ivory-faint mt-1">Admin Console</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="font-display text-[clamp(32px,4vw,48px)] font-semibold leading-tight tracking-tight bg-gradient-to-r from-ivory to-saffron-bright bg-clip-text text-transparent mb-4">
              Guide the stars,<br />run the platform.
            </h2>
            <p className="text-[16px] max-w-[40ch] leading-relaxed">
              Manage astrologers, wallets, sessions and payouts — all in one refined control deck powered by celestial insights.
            </p>
            <div className="flex flex-col gap-3 mt-8">
              <span className="text-[14px] font-semibold text-ivory-dim font-mono flex items-center gap-2.5"><span className="text-saffron-bright">✦</span> Real-time mission control</span>
              <span className="text-[14px] font-semibold text-ivory-dim font-mono flex items-center gap-2.5"><span className="text-saffron-bright">✦</span> KYC & payout review</span>
              <span className="text-[14px] font-semibold text-ivory-dim font-mono flex items-center gap-2.5"><span className="text-saffron-bright">✦</span> Live session management</span>
              <span className="text-[14px] font-semibold text-ivory-dim font-mono flex items-center gap-2.5"><span className="text-saffron-bright">✦</span> Cosmic service catalog</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="flex items-center justify-center p-12 bg-bg-1 relative overflow-hidden max-lg:min-h-screen"
        style={{
          background: `radial-gradient(circle at 80% -20%, var(--color-bg-glow), transparent 60%), linear-gradient(180deg, var(--color-bg-1), var(--color-bg-0))`
        }}
      >
        {/* Glow */}
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(circle,var(--color-saffron-soft),transparent_70%)] pointer-events-none" />

        <form className="w-full max-w-[420px] relative z-10" onSubmit={handleSubmit}>
          <h1 className="text-[32px] font-bold mb-2">Welcome back</h1>
          <p className="text-ivory-dim mt-1.5 text-[15px]">Sign in to your administrator account.</p>

          {error && (
            <div className="flex gap-3 p-4 rounded-[--radius-md] bg-danger-bg border border-danger/30 text-danger-text mt-5 animate-[slide-in_0.3s_ease]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="mt-4.5">
            <label className="block text-[13px] font-semibold text-ivory-dim mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hindustanijyotish.in"
              autoComplete="username"
              required
              className="w-full bg-surface-1 border border-border-soft text-ivory rounded-[--radius-sm] py-3 px-3.5 text-[14px] transition-all hover:border-border-mid hover:bg-surface-2 focus:outline-none focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
            />
          </div>

          <div className="mt-4.5">
            <label className="block text-[13px] font-semibold text-ivory-dim mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full bg-surface-1 border border-border-soft text-ivory rounded-[--radius-sm] py-3 px-3.5 pr-12 text-[14px] transition-all hover:border-border-mid hover:bg-surface-2 focus:outline-none focus:border-saffron focus:bg-surface-2 focus:shadow-[0_0_0_4px_var(--color-saffron-soft)]"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none p-2 text-[18px] leading-none w-10 h-10 rounded-[--radius-sm] hover:bg-surface-2 transition-all"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="w-full mt-7 py-3.5 px-5 text-[16px] rounded-[--radius-md] font-semibold flex items-center justify-center gap-2 bg-gradient-to-br from-saffron-bright to-saffron text-on-accent shadow-[--shadow-1] hover:brightness-110 hover:shadow-[--shadow-2] hover:shadow-saffron/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            type="submit"
            disabled={busy}
          >
            {busy ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center mt-7 text-[13px] text-ivory-faint">
            <svg className="inline align-middle mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure admin access · protected by JWT authentication
          </p>
        </form>
      </main>
    </div>
  )
}
