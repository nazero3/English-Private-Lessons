import { NameDateLines, SheetChrome } from './SheetChrome'

function unitHeading(lesson) {
  const label = lesson.unit_label || 'Unit'
  return `${label} ${lesson.unit_number}: ${lesson.theme}`
}

function courseHeading(course) {
  if (course?.subtitle) return `${course.title} — ${course.subtitle}`
  return course?.title || ''
}

export function Worksheet({ lesson, course, studentName }) {
  const copy = lesson.copy || {}
  const dir = lesson.dir || copy.dir || 'ltr'

  return (
    <SheetChrome
      title={copy.worksheetTitle || 'In-lesson Worksheet'}
      subtitle={`${courseHeading(course)} · ${unitHeading(lesson)}`}
      meta={<div>{lesson.grammar}</div>}
      dir={dir}
      lang={lesson.lang || copy.locale}
    >
      <NameDateLines
        studentName={studentName}
        studentLabel={copy.studentLabel}
        dateLabel={copy.dateLabel}
      />

      <section className="print-block">
        <h2>{copy.warmupTitle || 'Warm-up'}</h2>
        <p>{copy.warmup || 'Tell your teacher one sentence about your week. Then listen for today’s grammar.'}</p>
        <div className="lined" />
      </section>

      <section className="print-block">
        <h2>{copy.practiceTitle || 'Practice'}</h2>
        <ol>
          {(lesson.worksheet || [])
            .filter((i) => i.type !== 'write')
            .map((item) => (
              <li key={item.id} className="ws-item">
                {item.prompt}
                <div className="lined" />
              </li>
            ))}
        </ol>
      </section>

      <section className="print-block">
        <h2>{copy.writeTitle || 'Write'}</h2>
        {(lesson.worksheet || [])
          .filter((i) => i.type === 'write')
          .map((item) => (
            <div key={item.id} className="lined-block">
              <p>{item.prompt}</p>
              <div className="lined" />
              <div className="lined" />
              <div className="lined" />
              <div className="lined" />
            </div>
          ))}
      </section>
    </SheetChrome>
  )
}
