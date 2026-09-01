import DigitalCard from '../components/DigitalCard.jsx'
import { useAuth } from '../lib/auth.jsx'
import { TIER_LABEL, fmtDate } from '../lib/format'

export default function CardPage() {
  const { family } = useAuth()
  const membership = family?.wallet?.membership
  return (
    <div>
      <h1>بطاقتك الرقمية</h1>
      <p className="muted">لقطة الشاشة مسموحة. البطاقة تتغيّر مع نقاط السنة، واستبدال الجوائز لا يخفض مستواها.</p>
      <DigitalCard membership={membership} name={family?.parent?.full_name} />
      <section className="panel" style={{ marginTop: '1rem' }}>
        <h2>{TIER_LABEL[membership?.tier] || 'ابدأ الجمع'}</h2>
        <p>خصم المركز: {membership?.discount || 0}٪ على الباقة القادمة.</p>
        <ul>
          <li>برونز: 5٪ بعد 100 نقطة</li>
          <li>فضة: 10٪ بعد 400 نقطة وأهلية لجدار الشركاء</li>
          <li>بلاتين: 15٪ بعد 1000 نقطة وظهور VIP</li>
        </ul>
        <p className="muted">رقم البطاقة: {membership?.card_number || 'ستُصدر عند أول مستوى'}</p>
        {membership?.period_end ? <p className="muted">دورة النقاط حتى {fmtDate(membership.period_end)}</p> : null}
      </section>
    </div>
  )
}
