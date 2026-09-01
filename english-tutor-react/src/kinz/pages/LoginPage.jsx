import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { KINZ_LOGO, WHATSAPP, kinzPath } from '../lib/format'

export default function LoginPage() {
  const { profile, login } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (profile?.role === 'parent') {
    return <Navigate to={kinzPath('/app')} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login({ phone, family_code: familyCode, pin })
      navigate(kinzPath('/app'), { replace: true })
    } catch (err) {
      setError(err.message || 'تعذّر الدخول')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src={KINZ_LOGO} alt="كينز" />
        <h1 style={{ textAlign: 'center' }}>دخول الأهل</h1>
        <p className="muted" style={{ textAlign: 'center' }}>
          رقم الموبايل ورمز من 6 أرقام. يمكنك استخدام رمز العائلة إن أعطاك المركز إياه.
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="phone">رقم الموبايل</label>
            <input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0993 000 001"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="code">رمز العائلة (اختياري)</label>
            <input
              id="code"
              autoComplete="off"
              placeholder="KFDEMO1"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pin">رمز الدخول</label>
            <input
              id="pin"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-gold btn-block" type="submit" disabled={busy}>
            {busy ? 'جارٍ الدخول…' : 'دخول'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
          نسيت الرمز؟{' '}
          <a href={`${WHATSAPP}?text=${encodeURIComponent('مرحباً، نسيت رمز دخول عائلة كينز')}`}>
            واتساب للدعم
          </a>
          <br />
          <Link to={kinzPath()}>العودة للصفحة العامة</Link>
        </p>
      </div>
    </div>
  )
}
