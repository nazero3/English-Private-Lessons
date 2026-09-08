import { TIER_STORY } from '../lib/format'

export default function TierLadder() {
  return (
    <div className="tier-ladder">
      {TIER_STORY.map((row) => (
        <article key={row.tier} className={`tier-card ${row.tier}`}>
          <span className="tier-orb" aria-hidden="true" />
          <h3>{row.title}</h3>
          <p className="muted">{row.hint}</p>
          <p>
            <strong>{row.points}</strong> نقطة · خصم {row.discount}
          </p>
        </article>
      ))}
    </div>
  )
}
