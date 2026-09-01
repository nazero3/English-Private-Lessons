import { TIER_LABEL } from '../lib/format'

export default function DigitalCard({ membership, name }) {
  const tier = membership?.tier || 'none'
  return (
    <article className={`digital-card ${tier}`}>
      <div className="metal">عائلة كينز · {TIER_LABEL[tier] || TIER_LABEL.none}</div>
      <h2>{name || 'ولي الأمر'}</h2>
      <p style={{ margin: 0, opacity: 0.9 }}>المعرفة هي الكنز الحقيقي</p>
      <div className="num">
        <span>{membership?.card_number || 'KF-NEW'}</span>
        <span>{membership?.discount ? `خصم ${membership.discount}٪` : 'ابدأ الرحلة'}</span>
      </div>
    </article>
  )
}
