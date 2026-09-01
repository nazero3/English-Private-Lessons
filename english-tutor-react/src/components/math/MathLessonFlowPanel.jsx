import { getMathLessonFlow } from '../../data/mathGrade9'

export default function MathLessonFlowPanel({ unit, studentName }) {
  const flow = getMathLessonFlow(unit)

  return (
    <section className="panel lesson-flow" dir="rtl">
      <h3>ملخص المعلم (ابدأ من بداية الوحدة)</h3>
      {studentName ? (
        <p className="muted" style={{ marginTop: 0 }}>
          الطالب: <strong>{studentName}</strong>
        </p>
      ) : null}

      <div className="lesson-flow__summary">
        <p>{unit.summary}</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          صفحات الكتاب من ص {unit.bookPageStart} · يفتح PDF من الصفحة {unit.pageStart}
        </p>
      </div>

      <h4 className="lesson-flow__subheading">دروس هذه الوحدة</h4>
      <div className="lesson-flow__lessons">
        {(unit.lessons || []).map((lesson) => (
          <article key={`${lesson.number}-${lesson.title}`} className="lesson-flow__lesson-card">
            <div className="lesson-flow__lesson-head">
              <strong>
                {lesson.number}) {lesson.title}
              </strong>
              <span className="muted">ص {lesson.bookPage}</span>
            </div>
            <p>
              <span className="muted">ابدأ بـ:</span> {lesson.startWith}
            </p>
            <p>
              <span className="muted">التركيز:</span> {lesson.focus}
            </p>
          </article>
        ))}
      </div>

      <h4 className="lesson-flow__subheading">خطة حصة ≈ 60 دقيقة</h4>
      <ol className="lesson-flow__list">
        {flow.map((item) => (
          <li key={item.step}>
            <div className="lesson-flow__step">
              <span className="lesson-flow__label">{item.step}</span>
              <span className="lesson-flow__mins">{item.minutes} د</span>
            </div>
            <p className="lesson-flow__detail">{item.detail}</p>
          </li>
        ))}
      </ol>

      <div className="lesson-flow__focus">
        <div>
          <span className="muted">موضوع الوحدة</span>
          <p>{unit.grammar}</p>
        </div>
        <div>
          <span className="muted">تسلسل الدرس في الكتاب</span>
          <p>{unit.vocab}</p>
        </div>
      </div>
    </section>
  )
}
