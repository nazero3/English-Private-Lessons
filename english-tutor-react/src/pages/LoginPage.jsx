import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api as familyApi } from '../kinz/lib/api'
import { useAuth } from '../lib/AuthContext'
import { homePath } from '../lib/permissions'

export default function LoginPage() {
  const { signIn, user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const tab = search.get('as') === 'parent' ? 'parent' : 'staff'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Kinz Platform'
  }, [])

  useEffect(() => {
    if (tab !== 'parent') return undefined
    let cancel = false
    familyApi.getSession().then((session) => {
      if (!cancel && session.profile?.role === 'parent') {
        navigate('/family/child', { replace: true })
      }
    })
    return () => {
      cancel = true
    }
  }, [tab, navigate])

  if (!loading && user && profile && tab === 'staff') {
    return <Navigate to={homePath(profile.role)} replace />
  }

  const choose = (next) => {
    setError('')
    setSearch(next === 'parent' ? { as: 'parent' } : {}, { replace: true })
  }

  const onStaff = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await signIn(email.trim(), password)
      navigate(homePath(session.profile.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  const onParent = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await familyApi.parentLogin({ phone, pin })
      navigate('/family/child', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <img className="login-mark" src="/kinz/logo.png" alt="Kinz" />
      <div className="login-card">
        <h1>Kinz Platform</h1>
        {tab === 'parent' ? (
          <p className="muted">See your child's lessons and the teacher's notes.</p>
        ) : null}
        <div className="login-tabs" role="tablist" aria-label="Sign in as">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'staff'}
            className={tab === 'staff' ? 'is-active' : ''}
            onClick={() => choose('staff')}
          >
            Teachers & ops
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'parent'}
            className={tab === 'parent' ? 'is-active' : ''}
            onClick={() => choose('parent')}
          >
            Parents
          </button>
        </div>

        {tab === 'staff' ? (
          <form onSubmit={onStaff}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={onParent}>
            <div className="field">
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0993 000 001"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="pin">PIN</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={8}
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                required
              />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
