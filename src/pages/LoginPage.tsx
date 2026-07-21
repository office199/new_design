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
          {[
            { l: 18, t: 24, s: 3, d: 0 },
            { l: 32, t: 64, s: 2, d: 1.2 },
            { l: 70, t: 30, s: 2.5, d: 0.6 },
            { l: 82, t: 70, s: 2, d: 1.8 },
            { l: 50, t: 18, s: 2, d: 2.4 },
            { l: 60, t: 82, s: 3, d: 0.9 },
          ].map((st, i) => (
            <span
              key={i}
              className="login-star"
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
            <h2 className="login-aside-title">Guide the stars,<br />run the platform.</h2>
            <p className="login-aside-sub">
              Manage astrologers, wallets, sessions and payouts — all in one refined control deck.
            </p>
            <div className="login-aside-feats">
              <span>✦ Real-time dashboard</span>
              <span>✦ KYC &amp; payout review</span>
              <span>✦ Live sessions</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="login-main">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="muted login-form-sub">Sign in to your administrator account.</p>

          {error && <div className="error-banner" style={{ marginTop: 18 }}>{error}</div>}

          <div className="field">
            <label>Email</label>
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="btn-primary login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <span aria-hidden>→</span>}
          </button>

          <p className="login-hint faint">
            Secure admin access · protected by JWT authentication
          </p>
        </form>
      </main>
    </div>
  )
}
