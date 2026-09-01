import { NameDateLines, SheetChrome } from './SheetChrome'

export function ReviewQuizSheet({ lessonsMeta, items, course, studentName }) {
  const meta = lessonsMeta || []
  const units = meta.map((l) => l.unit_number).join(', ')
  const themes = meta
    .map((l) => `U${l.unit_number}${l.grammar ? `: ${l.grammar}` : ''}`)
    .join(' · ')

  return (
    <SheetChrome
      title="Checkpoint Quiz (3 units)"
      subtitle={`${course?.title || ''} · Units ${units}`}
      meta={<div style={{ maxWidth: '70mm' }}>{themes}</div>}
    >
      <NameDateLines studentName={studentName} />
      <p className="muted print-block">
        End-of-block check: these questions cover the last three units only.
      </p>

      <ol>
        {items.map((item) => (
          <li key={item.compositeId || item.id} className="quiz-item">
            <div className="muted" style={{ fontSize: '0.8rem' }}>
              From unit {item.sourceUnit}
            </div>
            <div>{item.prompt}</div>
            {item.type === 'mcq' ? (
              <ul style={{ listStyle: 'upper-alpha' }}>
                {(item.options || []).map((opt) => (
                  <li key={opt}>{opt}</li>
                ))}
              </ul>
            ) : (
              <div className="lined" />
            )}
          </li>
        ))}
      </ol>
    </SheetChrome>
  )
}
