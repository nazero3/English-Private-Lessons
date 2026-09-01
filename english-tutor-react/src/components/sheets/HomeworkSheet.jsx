import { NameDateLines, SheetChrome } from './SheetChrome'

function unitHeading(lesson) {
  const label = lesson.unit_label || 'Unit'
  return `${label} ${lesson.unit_number}: ${lesson.theme}`
}

function courseHeading(course) {
  if (course?.subtitle) return `${course.title} — ${course.subtitle}`
  return course?.title || ''
}

export function HomeworkSheet({ lesson, course, studentName }) {
  const copy = lesson.copy || {}
  const dir = lesson.dir || copy.dir || 'ltr'

  return (
    <SheetChrome
      title={copy.homeworkTitle || 'Homework'}
      subtitle={`${courseHeading(course)} · ${unitHeading(lesson)}`}
      meta={
        <>
          <div>{copy.dueLabel || 'Due: next session'}</div>
          <div>{lesson.grammar}</div>
        </>
      }
      dir={dir}
      lang={lesson.lang || copy.locale}
    >
      <NameDateLines
        studentName={studentName}
        studentLabel={copy.studentLabel}
        dateLabel={copy.dateLabel}
      />
      <p className="print-block">
        {copy.homeworkIntro ||
          'Complete independently. Bring this sheet to your next private lesson.'}
      </p>

      <ol>
        {(lesson.homework || []).map((item) => (
          <li key={item.id} className="hw-item">
            {item.prompt}
            {item.type === 'write' ? (
              <div className="lined-block">
                <div className="lined" />
                <div className="lined" />
                <div className="lined" />
                <div className="lined" />
              </div>
            ) : (
              <div className="lined" />
            )}
          </li>
        ))}
      </ol>

      <section className="print-block">
        <p>
          <strong>{copy.signature || 'Parent / self-check: I completed this homework. ________________'}</strong>
        </p>
      </section>
    </SheetChrome>
  )
}
