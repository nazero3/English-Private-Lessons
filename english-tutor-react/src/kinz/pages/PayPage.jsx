import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { kinzPath } from '../lib/format'

export default function PayPage() {
  const { family, profile, loading, reloadFamily } = useAuth()
  const [period, setPeriod] = useState('monthly')
  const [method, setMethod] = useState('whatsapp')
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const sub = family?.subscription

  if (loading) return <p className="muted" style={{ padding: '2rem' }}>جارٍ التحميل…</p>
  if (!profile) return <Navigate to={kinzPath('/login')} replace />

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const row = await api.createPayIntent({ period, method })
      setInvoice(row)
      await reloadFamily()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="paywall">
      <div className="login-card">
        <h1>اشتراك عائلة كينز</h1>
        {sub?.status === 'complimentary' ? (
          <p className="gift">عضويتك مجانية مع كورس الابن</p>
        ) : (
          <p className="muted">ادفع في المركز أو عبر المحافظ، ثم تؤكد الإدارة من لوحة المعلّمين.</p>
        )}
        {sub?.access ? (
          <p className="success">اشتراكك فعّال حتى {sub.ends_at?.slice(0, 10) || '—'}</p>
        ) : (
          <form onSubmit={create}>
            <div className="field">
              <label htmlFor="period">المدة</label>
              <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="monthly">شهر — 25,000 ل.س</option>
                <option value="term">فصل — 60,000 ل.س</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="method">طريقة التحويل</label>
              <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="whatsapp">واتساب / كاش</option>
                <option value="syriatel_cash">Syriatel Cash</option>
                <option value="sham_cash">Sham Cash</option>
                <option value="cash">كاش في المركز</option>
              </select>
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn btn-gold btn-block" type="submit">
              إنشاء فاتورة
            </button>
          </form>
        )}
        {invoice ? (
          <div style={{ marginTop: '1rem' }}>
            <p>رقم الفاتورة: {invoice.id}</p>
            <p className="muted">{invoice.instructions}</p>
            <a className="btn btn-whatsapp btn-block" href={invoice.whatsapp_url} target="_blank" rel="noreferrer">
              إرسال عبر واتساب
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
