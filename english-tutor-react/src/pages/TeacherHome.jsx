import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ENGLISH_FILE_COURSES } from '../data/englishFile'
import { MATH_GRADES } from '../data/mathRegistry'
import { PHYSICS_GRADES } from '../data/physicsRegistry'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import LogClassForm from '../components/teacher/LogClassForm'

function monthStartIso() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

function formatHours(n) {
  const value = Number(n) || 0
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export default function TeacherHome() {
  const {
    profile,
    canAccessPrivateLessons,
    canAccessMathGrade9,
    canAccessMathGrade12,
    canAccessPhysicsGrade12,
  } = useAuth()
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [coursesData, sessionRows] = await Promise.all([
        api.listCourses(profile),
        api.listSessions(profile),
      ])
      setCourses(coursesData)
      setSessions(sessionRows)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile])

  const mathGrades = [
    canAccessMathGrade9 ? MATH_GRADES.grade9 : null,
    canAccessMathGrade12 ? MATH_GRADES.grade12 : null,
  ].filter(Boolean)

  const physicsGrades = [canAccessPhysicsGrade12 ? PHYSICS_GRADES.grade12 : null].filter(Boolean)

  const hasAnything =
    courses.length > 0 || canAccessPrivateLessons || mathGrades.length > 0 || physicsGrades.length > 0

  const monthHours = useMemo(() => {
    const start = monthStartIso()
    return sessions.reduce((sum, s) => {
      if (s.hours == null || s.hours === '') return sum
      const t = new Date(s.session_date || s.created_at).getTime()
      if (t < start) return sum
      return sum + Number(s.hours)
    }, 0)
  }, [sessions])

  const recent = sessions.slice(0, 4)

  return (
    <div className="teacher-dash">
      <header className="teacher-dash__hero">
        <div>
          <h1>Hi, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
          <p className="muted">After class, log the hours. Materials are below when you need them.</p>
        </div>
        <div className="teacher-dash__stat">
          <span className="muted">This month</span>
          <strong>{formatHours(monthHours)}h</strong>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel log-class-panel">
        <div className="log-class-panel__head">
          <div>
            <h2>Log a class</h2>
            <p className="muted">Student, hours, and the unit you taught. That is enough.</p>
          </div>
        </div>
        <LogClassForm profile={profile} onSaved={load} />
      </section>

      {recent.length ? (
        <section className="teacher-block">
          <div className="teacher-block__intro teacher-block__intro--row">
            <h2>Recent classes</h2>
            <Link to="/teacher/sessions">See all</Link>
          </div>
          <ul className="recent-class-list">
            {recent.map((s) => (
              <li key={s.id}>
                <span className="recent-class-list__who">{s.student_name}</span>
                <span className="muted">
                  {new Date(s.session_date || s.created_at).toLocaleDateString()}
                  {s.course?.title ? ` · ${s.course.title}` : ''}
                </span>
                <strong>{s.hours != null ? `${formatHours(s.hours)}h` : '—'}</strong>
                <Link className="table-link" to={`/teacher/sessions?edit=${s.id}`}>
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
              <Link key={course.id} className="library-card" to={`/teacher/courses/${course.id}`}>
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
            <p className="muted">Beginner and Intermediate coursebooks with PDF sessions.</p>
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
          </div>
        </section>
      ))}
    </div>
  )
}
