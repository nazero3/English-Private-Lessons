import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'

export default function PrizesPage() {
  const { family, reloadFamily } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [optIn, setOptIn] = useState(Boolean(family?.spotlights?.some((s) => s.opted_in)))

  const redeem = async (prizeId) => {
    setBusy(prizeId)
    setError('')
    setMessage('')
    try {
      await api.redeemPrize(prizeId)
      await reloadFamily()
      setMessage('تم إرسال الطلب. يُنفَّذ في المركز.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const saveSpotlight = async (checked) => {
    setOptIn(checked)
    try {
      await api.setSpotlight({ opted_in: checked, kind: 'good_parent' })
      await reloadFamily()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1>الجوائز</h1>
      <p className="muted">الرصيد الحالي: {family?.wallet?.balance ?? 0} نقطة</p>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {(family?.prizes || []).map((prize) => (
        <article key={prize.id} className="panel">
          <h2>{prize.title}</h2>
          <p className="muted">{prize.description}</p>
          <p>
            <span className="badge">{prize.credit_cost} نقطة</span>
          </p>
          <button
            type="button"
            className="btn btn-gold"
            disabled={busy === prize.id}
            onClick={() => redeem(prize.id)}
          >
            استبدال
          </button>
        </article>
      ))}
      <section className="panel">
        <h2>الظهور في كينز تُضيء</h2>
        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input type="checkbox" checked={optIn} onChange={(e) => saveSpotlight(e.target.checked)} />
          أوافق على ظهور اسمي الأول فقط على الصفحة العامة (بدون درجات أو رقم هاتف)
        </label>
      </section>
      {(family?.redemptions || []).length ? (
        <section className="panel">
          <h2>طلباتك</h2>
          {(family.redemptions || []).map((row) => (
            <p key={row.id}>
              {row.prize?.title || 'جائزة'} · {row.status === 'fulfilled' ? 'تم التنفيذ' : 'قيد التنفيذ'}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  )
}
