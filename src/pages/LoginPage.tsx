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

  return (
    <div className="login-wrap">
      {/* ── Brand / showcase panel ── */}
      <aside className="login-aside">
        <div className="login-orbits" aria-hidden>
          <span className="orbit o1" />
          <span className="orbit o2" />
          <span className="orbit o3" />
          <span className="orbit o4" />
          {[
            { l: 15, t: 20, s: 3, d: 0 },
            { l: 28, t: 60, s: 2, d: 0.5, warm: true },
            { l: 65, t: 25, s: 2.5, d: 1.0 },
            { l: 80, t: 65, s: 2, d: 1.5, warm: true },
            { l: 45, t: 15, s: 2, d: 2.0 },
            { l: 55, t: 80, s: 3, d: 0.8 },
            { l: 88, t: 40, s: 2, d: 1.2, violet: true },
            { l: 25, t: 85, s: 2.5, d: 1.8, warm: true },
          ].map((st, i) => (
            <span
              key={i}
              className={`login-star${st.warm ? ' warm' : ''}${st.violet ? ' violet' : ''}`}
              style={{ left: `${st.l}%`, top: `${st.t}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
            />
          ))}
        </div>

        <div className="login-aside-inner">
          <div className="login-brand">
            <span className="brand-mark">🪔</span>
            <div>
              <div className="login-brand-name">Hindustani Jyotish</div>
              <div className="login-brand-sub">Admin Console</div>
            </div>
          </div>

          <div className="login-aside-foot">
            <h2 className="login-aside-title">
              Guide the stars,<br />
              run the platform.
            </h2>
            <p className="login-aside-sub">
              Manage astrologers, wallets, sessions and payouts — all in one refined control deck powered by celestial insights.
            </p>
            <div className="login-aside-feats">
              <span>Real-time mission control</span>
              <span>KYC & payout review</span>
              <span>Live session management</span>
              <span>Cosmic service catalog</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="login-main">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="muted login-form-sub">Sign in to your administrator account.</p>

          {error && (
            <div className="error-banner" style={{ marginTop: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hindustanijyotish.in"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="login-pw">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pw-toggle"
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

          <button className="btn-primary login-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
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

          <p className="login-hint faint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure admin access · protected by JWT authentication
          </p>
        </form>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
