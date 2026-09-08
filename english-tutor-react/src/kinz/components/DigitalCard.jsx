import { COPY, TIER_LABEL } from '../lib/format'

export default function DigitalCard({ membership, name, compact = false }) {
  const tier = membership?.tier || 'none'
  return (
    <article className={`digital-card ${tier}${compact ? ' compact' : ''}`}>
      <div className="metal">عائلة كينز · {TIER_LABEL[tier] || TIER_LABEL.none}</div>
      <h2>{name || 'ولي الأمر'}</h2>
      {compact ? null : <p style={{ margin: 0, opacity: 0.9 }}>{COPY.motto}</p>}
      <div className="num">
        <span>{membership?.card_number || 'KF-NEW'}</span>
        <span>{membership?.discount ? `خصم ${membership.discount}٪` : 'ابدأ الرحلة'}</span>
      </div>
    </article>
  )
}
