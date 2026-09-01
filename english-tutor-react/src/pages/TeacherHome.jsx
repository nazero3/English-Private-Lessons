import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ENGLISH_FILE_COURSES } from '../data/englishFile'
import { MATH_GRADES } from '../data/mathRegistry'
import { PHYSICS_GRADES } from '../data/physicsRegistry'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function TeacherHome() {
  const {
    profile,
    canAccessPrivateLessons,
    canAccessMathGrade9,
    canAccessMathGrade12,
    canAccessPhysicsGrade12,
  } = useAuth()
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const coursesData = await api.listCourses(profile)
        setCourses(coursesData)
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [profile])

  const mathGrades = [
    canAccessMathGrade9 ? MATH_GRADES.grade9 : null,
    canAccessMathGrade12 ? MATH_GRADES.grade12 : null,
  ].filter(Boolean)

  const physicsGrades = [canAccessPhysicsGrade12 ? PHYSICS_GRADES.grade12 : null].filter(Boolean)

  const hasAnything =
    courses.length > 0 || canAccessPrivateLessons || mathGrades.length > 0 || physicsGrades.length > 0

  return (
    <div className="teacher-dash">
      <header className="teacher-dash__hero">
        <div>
          <h1>Teacher workspace</h1>
          <p className="muted">
            Open the curriculum your manager assigned. Lesson packs, private lessons, and math
            live here.
          </p>
        </div>
        <div className="actions">
          <Link className="btn secondary" to="/teacher/students">
            Students
          </Link>
          <Link className="btn secondary" to="/teacher/parents">
            Families
          </Link>
          <Link className="btn secondary" to="/teacher/sessions">
            My sessions
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {!hasAnything ? (
        <section className="panel">
          <p style={{ margin: 0 }}>
            Nothing assigned yet. Ask your manager to enable courses or curriculum access.
          </p>
        </section>
      ) : null}

      {courses.length ? (
        <section className="teacher-block">
          <div className="teacher-block__intro">
            <h2>English lesson packs</h2>
            <p className="muted">Printable briefs, worksheets, quizzes, and homework.</p>
          </div>
          <div className="library-grid">
            {courses.map((course) => (
              <Link
                key={course.id}
                className="library-card"
                to={`/teacher/courses/${course.id}`}
              >
                <span className="library-card__tag">Sheets</span>
                <strong>{course.title}</strong>
                <span className="muted">Grade {course.grade} · open units</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {canAccessPrivateLessons ? (
        <section className="teacher-block">
          <div className="teacher-block__intro">
            <h2>English File · private lessons</h2>
            <p className="muted">
              Beginner and Intermediate coursebooks with PDF sessions and printable sheets.
            </p>
          </div>
          <div className="library-grid">
            {ENGLISH_FILE_COURSES.map((c) => (
              <Link
                key={c.id}
                className="library-card"
                to={`/teacher/private-lessons/${c.id}`}
                style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
              >
                <span className="library-card__tag">Sheets + PDF</span>
                <strong>
                  {c.title} {c.subtitle}
                </strong>
                <span className="muted">
                  {c.files.length} Files · {c.level}
                </span>
              </Link>
            ))}
            <Link className="library-card library-card--subtle" to="/teacher/private-lessons">
              <span className="library-card__tag">Overview</span>
              <strong>English File levels</strong>
              <span className="muted">Beginner + Intermediate</span>
            </Link>
          </div>
        </section>
      ) : null}

      {mathGrades.map((grade) => (
        <section className="teacher-block" key={grade.key}>
          <div className="teacher-block__intro" dir="rtl">
            <h2>{grade.title}</h2>
            <p className="muted">{grade.subtitle} — ملخص معلم، ورقة عمل، وواجب للطباعة مع PDF.</p>
          </div>
          <div className="library-grid">
            {grade.courses.map((c) => (
              <Link
                key={c.id}
                className="library-card"
                to={`${grade.basePath}/${c.id}`}
                style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                dir="rtl"
              >
                <span className="library-card__tag">{c.cefr}</span>
                <strong>{c.subtitle}</strong>
                <span className="muted">
                  {c.files.length} وحدات · {c.pageCount} صفحة
                </span>
              </Link>
            ))}
            <Link
              className="library-card library-card--subtle"
              to={grade.basePath}
              dir="rtl"
            >
              <span className="library-card__tag">نظرة عامة</span>
              <strong>كل كتب {grade.title}</strong>
              <span className="muted">{grade.subtitle}</span>
            </Link>
          </div>
        </section>
      ))}

      {physicsGrades.map((grade) => (
        <section className="teacher-block" key={`physics-${grade.key}`}>
          <div className="teacher-block__intro" dir="rtl">
            <h2>{grade.title}</h2>
            <p className="muted">{grade.subtitle} — ملخص معلم، ورقة عمل، وواجب للطباعة مع PDF.</p>
          </div>
          <div className="library-grid">
            {grade.courses.map((c) => (
              <Link
                key={c.id}
                className="library-card"
                to={`${grade.basePath}/${c.id}`}
                style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                dir="rtl"
              >
                <span className="library-card__tag">{c.cefr}</span>
                <strong>{c.subtitle}</strong>
                <span className="muted">
                  {c.files.length} وحدات · {c.pageCount} صفحة
                </span>
              </Link>
            ))}
            <Link
              className="library-card library-card--subtle"
              to={grade.basePath}
              dir="rtl"
            >
              <span className="library-card__tag">نظرة عامة</span>
              <strong>{grade.title}</strong>
              <span className="muted">{grade.subtitle}</span>
            </Link>
          </div>
        </section>
      ))}
    </div>
  )
}
