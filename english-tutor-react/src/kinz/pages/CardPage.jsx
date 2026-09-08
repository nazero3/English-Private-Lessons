import DigitalCard from '../components/DigitalCard.jsx'
import TierLadder from '../components/TierLadder.jsx'
import { useAuth } from '../lib/auth.jsx'
import { COPY, TIER_LABEL, fmtDate } from '../lib/format'

export default function CardPage() {
  const { family } = useAuth()
  const membership = family?.wallet?.membership
  return (
    <div>
      <h1>بطاقتك الرقمية</h1>
      <p className="muted">تظهر أعلى الحساب ويتغيّر لونها تلقائياً حسب فئتك. لقطة الشاشة مسموحة، واستبدال الجوائز لا يخفض المستوى.</p>
      <DigitalCard membership={membership} name={family?.parent?.full_name} />
      <section className="panel" style={{ marginTop: '1rem' }}>
        <h2>{TIER_LABEL[membership?.tier] || 'ابدأ الجمع'}</h2>
        <p>خصم المركز: {membership?.discount || 0}٪ على الباقة القادمة.</p>
        <p className="muted">رقم البطاقة: {membership?.card_number || 'ستُصدر عند أول مستوى'}</p>
        {membership?.period_end ? <p className="muted">دورة النقاط حتى {fmtDate(membership.period_end)}</p> : null}
      </section>
      <section className="panel">
        <h2>فئات العضوية</h2>
        <p className="muted">{COPY.motto}</p>
        <TierLadder />
      </section>
    </div>
  )
}
