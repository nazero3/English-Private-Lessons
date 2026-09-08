import { Link } from 'react-router-dom'
import { kinzPath } from '../lib/format'

export default function PointsProgress({ membership, balance, compact = false, slim = false }) {
  const earned = membership?.earned_12m || 0
  const next = membership?.next
  const pct = next?.threshold ? Math.min(100, Math.round((earned / next.threshold) * 100)) : 100
  const remaining = next?.tier ? `متبقي ${next.needed} للوصول إلى ${next.label_ar}` : 'أنت في أعلى بطاقة'

  if (slim) {
    return (
      <section className="points-slim">
        <div className="points-slim__row">
          <strong>{balance ?? 0}</strong>
          <span>نقطة قابلة للاستبدال</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={remaining}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <p>
          {remaining}
          {' · '}
          <Link to={kinzPath('/app/wallet')}>المحفظة والجوائز</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="panel">
      {compact ? <h2>نقاطك هذه السنة</h2> : <p className="welcome-kicker">محفظة كينز</p>}
      {!compact ? (
        <div className="balance-hero">
          <span className="muted">الرصيد الإجمالي</span>
          <strong className="figure">{balance ?? 0}</strong>
          <p className="muted">نقطة قابلة للاستبدال</p>
        </div>
      ) : (
        <p>
          {earned} نقطة مكتسبة · الرصيد {balance ?? 0}
        </p>
      )}
      <p>{remaining}</p>
      <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </div>
      {compact ? (
        <p className="muted" style={{ marginTop: '0.7rem' }}>
          <Link to={kinzPath('/app/wallet')}>سجل النقاط والجوائز</Link>
        </p>
      ) : null}
    </section>
  )
}
