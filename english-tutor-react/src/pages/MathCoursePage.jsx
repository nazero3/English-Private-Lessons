import { Link, useParams } from 'react-router-dom'
import { getCoursebookCourse, getCoursebookGrade } from '../data/coursebookRegistry'
import { useCoursebookSubjectKey } from '../lib/coursebookRoutes'

export default function MathCoursePage() {
  const subjectKey = useCoursebookSubjectKey()
  const { gradeKey, courseId } = useParams()
  const grade = getCoursebookGrade(subjectKey, gradeKey)
  const course = getCoursebookCourse(subjectKey, gradeKey, courseId)

  if (!grade || !course) {
    return (
      <div className="math-page" dir="rtl" lang="ar">
        <p className="error">الكتاب غير موجود.</p>
        <Link className="btn secondary" to={grade?.basePath || '/teacher'}>
          العودة
        </Link>
      </div>
    )
  }

  return (
    <div className="math-page" dir="rtl" lang="ar">
      <p className="muted math-back">
        <Link to={grade.basePath}>→ {grade.title}</Link>
      </p>

      <header
        className="coursebook-header"
        style={{ '--course-accent': course.color, '--course-soft': course.softColor }}
      >
        <div>
          <span className="coursebook-header__badge">
            {course.level} · {course.cefr}
          </span>
          <h1>
            {course.title} — {course.subtitle}
          </h1>
          <p>{course.description}</p>
        </div>
        <a className="btn math-btn" href={course.pdf} target="_blank" rel="noreferrer">
          فتح PDF كامل
        </a>
      </header>

      <div className="unit-card-list">
        {course.files.map((unit) => {
          const lastLesson = unit.lessons?.[unit.lessons.length - 1]
          const endBookPage = lastLesson?.bookPage || unit.bookPageStart
          return (
            <article key={unit.file} className="unit-card">
              <div className="unit-card__main">
                <span className="file-badge">وحدة {unit.file}</span>
                <h3>{unit.title}</h3>
                <p className="muted unit-card__topic">{unit.topic}</p>
                <p className="unit-card__lessons">
                  {(unit.lessons || []).map((l) => `${l.number}) ${l.title}`).join(' · ')}
                </p>
                <p className="muted unit-card__pages">
                  صفحات الكتاب: ص {unit.bookPageStart}–{endBookPage}
                </p>
              </div>
              <Link
                className="btn math-btn"
                to={`${grade.basePath}/${course.id}/unit/${unit.file}`}
              >
                فتح الحصة
              </Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
