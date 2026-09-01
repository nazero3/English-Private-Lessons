import { getPrivateLessonFlow } from '../../data/englishFile'

export default function LessonFlowPanel({ unit, studentName }) {
  const flow = getPrivateLessonFlow(unit)

  return (
    <section className="panel lesson-flow">
      <h3>Teacher summary (start from the beginning)</h3>
      {studentName ? (
        <p className="muted" style={{ marginTop: 0 }}>
          Student: <strong>{studentName}</strong>
        </p>
      ) : null}

      <div className="lesson-flow__summary">
        <p>{unit.summary}</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          Book pages from p.{unit.bookPageStart} · PDF opens at page {unit.pageStart}
        </p>
      </div>

      <h4 className="lesson-flow__subheading">Lessons in this File</h4>
      <div className="lesson-flow__lessons">
        {(unit.lessons || []).map((lesson) => (
          <article key={lesson.code} className="lesson-flow__lesson-card">
            <div className="lesson-flow__lesson-head">
              <strong>
                {lesson.code} · {lesson.title}
              </strong>
              <span className="muted">p.{lesson.bookPage}</span>
            </div>
            <p>
              <span className="muted">Start with:</span> {lesson.startWith}
            </p>
            <p>
              <span className="muted">G:</span> {lesson.grammar}
            </p>
            <p>
              <span className="muted">V:</span> {lesson.vocab}
            </p>
            {lesson.pronunciation ? (
              <p>
                <span className="muted">P:</span> {lesson.pronunciation}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {unit.practicalEnglish ? (
        <div className="lesson-flow__extra">
          <strong>{unit.practicalEnglish.title}</strong>
          <p>
            Book p.{unit.practicalEnglish.bookPage} · {unit.practicalEnglish.focus}
          </p>
        </div>
      ) : null}

      {unit.reviseAndCheck ? (
        <div className="lesson-flow__extra">
          <strong>{unit.reviseAndCheck.title}</strong>
          <p>Book p.{unit.reviseAndCheck.bookPage}</p>
        </div>
      ) : null}

      <h4 className="lesson-flow__subheading">60-minute session flow</h4>
      <ol className="lesson-flow__list">
        {flow.map((item) => (
          <li key={item.step}>
            <div className="lesson-flow__step">
              <span className="lesson-flow__label">{item.step}</span>
              <span className="lesson-flow__mins">{item.minutes} min</span>
            </div>
            <p className="lesson-flow__detail">{item.detail}</p>
          </li>
        ))}
      </ol>

      <div className="lesson-flow__focus">
        <div>
          <span className="muted">Grammar focus (whole File)</span>
          <p>{unit.grammar}</p>
        </div>
        <div>
          <span className="muted">Vocabulary (whole File)</span>
          <p>{unit.vocab}</p>
        </div>
      </div>
    </section>
  )
}
