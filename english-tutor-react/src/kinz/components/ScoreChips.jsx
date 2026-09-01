import { fmtPct } from '../lib/format'

export default function ScoreChips({ summary }) {
  const items = [
    { label: 'الإجمالي', value: summary?.overall_avg },
    { label: 'الاختبارات', value: summary?.tests_avg },
    { label: 'المسابقات', value: summary?.quiz_avg },
    { label: 'الواجبات', value: summary?.homework_avg },
  ]
  return (
    <section className="score-row">
      {items.map((item) => (
        <div key={item.label} className="score-chip">
          <span>{item.label}</span>
          <strong>{fmtPct(item.value)}</strong>
        </div>
      ))}
    </section>
  )
}
