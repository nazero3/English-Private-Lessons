import { NameDateLines, SheetChrome } from './SheetChrome'

function unitHeading(lesson) {
  const label = lesson.unit_label || 'Unit'
  return `${label} ${lesson.unit_number}: ${lesson.theme}`
}

function courseHeading(course, lesson) {
  if (course?.subtitle) return `${course.title} — ${course.subtitle}`
  return course?.title || `Grade ${lesson.course?.grade || ''}`
}

export function TeacherBrief({ lesson, course, studentName, showAnswerKey = true }) {
  const copy = lesson.copy || {}
  const dir = lesson.dir || copy.dir || 'ltr'

  return (
    <SheetChrome
      title={copy.briefTitle || 'Teacher Lesson Brief'}
      subtitle={`${courseHeading(course, lesson)} · ${unitHeading(lesson)}`}
      meta={
        <>
          <div>{lesson.theme}</div>
          <div>{new Date().toLocaleDateString()}</div>
        </>
      }
      dir={dir}
      lang={lesson.lang || copy.locale}
      showAnswerKey={showAnswerKey}
      answerKeyTitle={copy.answerKeyTitle || 'Teacher answer key'}
      answerKey={
        <>
          <h3>{copy.worksheetKeyTitle || 'Worksheet'}</h3>
          <ol>
            {(lesson.worksheet || []).map((item) => (
              <li key={item.id}>
                {item.prompt}
                {item.answer ? ` → ${item.answer}` : ' → (open response)'}
              </li>
            ))}
          </ol>
          <h3>{copy.homeworkKeyTitle || 'Homework'}</h3>
          <ol>
            {(lesson.homework || []).map((item) => (
              <li key={item.id}>
                {item.prompt}
                {item.answer ? ` → ${item.answer}` : ' → (open response)'}
              </li>
            ))}
          </ol>
        </>
      }
    >
      <NameDateLines
        studentName={studentName}
        studentLabel={copy.studentLabel}
        dateLabel={copy.dateLabel}
      />

      <section className="print-block">
        <h2>{copy.objectivesTitle || 'Learning objectives'}</h2>
        <ul>
          {(lesson.objectives || []).map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="print-block">
        <h2>{copy.grammarTitle || 'Grammar focus'}</h2>
        <p>
          <strong>{lesson.grammar}</strong>
          {lesson.arabic ? ` · ${lesson.arabic}` : ''}
        </p>
        <p>{lesson.explanation}</p>
      </section>

      {lesson.visual?.length ? (
        <section className="print-block">
          <h2>{copy.visualTitle || 'Visual contrast'}</h2>
          <table className="table">
            <tbody>
              {lesson.visual.map(([label, example]) => (
                <tr key={label + example}>
                  <td>
                    <strong>{label}</strong>
                  </td>
                  <td>{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="print-block">
        <h2>{copy.flowTitle || 'Session flow (≈55 min)'}</h2>
        <ol>
          {(lesson.session_flow || []).map((step) => (
            <li key={step.step}>
              <strong>
                {step.minutes} {dir === 'rtl' ? 'د' : 'min'} — {step.step}:
              </strong>{' '}
              {step.detail}
            </li>
          ))}
        </ol>
      </section>

      {(lesson.common_mistakes || []).length ? (
        <section className="print-block">
          <h2>{copy.mistakesTitle || 'Common L1 mistakes'}</h2>
          <ul>
            {(lesson.common_mistakes || []).map((m) => (
              <li key={m.wrong}>
                <strong>{dir === 'rtl' ? 'انتبه:' : 'Watch for:'}</strong> {m.wrong}
                <br />
                <span className="muted">
                  {dir === 'rtl' ? 'نصيحة:' : 'Tip:'} {m.tip}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lesson.teacher_notes ? (
        <section className="print-block">
          <h2>{copy.notesTitle || 'Teacher notes'}</h2>
          <p>{lesson.teacher_notes}</p>
        </section>
      ) : null}
    </SheetChrome>
  )
}
