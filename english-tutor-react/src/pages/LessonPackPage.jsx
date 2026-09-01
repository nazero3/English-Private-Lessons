import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { isReviewQuizUnit } from '../lib/sheets'

export default function LessonPackPage() {
  const { lessonId } = useParams()
  const location = useLocation()
  const { profile } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLesson(await api.getLesson(lessonId))
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [lessonId])

  if (error) return <p className="error">{error}</p>
  if (!lesson) return <p className="muted">Loading lesson…</p>

  const course = lesson.course
  const q = studentName ? `?student=${encodeURIComponent(studentName)}` : ''
  const showReviewQuiz = isReviewQuizUnit(lesson.unit_number)
  const fromManager =
    location.state?.fromManager || profile?.role === 'manager'
  const backTo =
    fromManager && (location.state?.courseId || course?.id)
      ? `/manager/courses/${location.state?.courseId || course?.id}`
      : course?.id
        ? `/teacher/courses/${course.id}`
        : '/teacher'
  const backLabel = fromManager ? '← Course' : '← Courses'

  const cards = [
    {
      title: 'Teacher Brief',
      desc: 'Prep summary: objectives, flow, L1 tips, answer keys.',
      view: `/teacher/lessons/${lessonId}/brief${q}`,
      print: `/print/lessons/${lessonId}/brief${q}`,
      check: null,
    },
    {
      title: 'In-lesson Worksheet',
      desc: 'Student practice sheet for the private session.',
      view: `/teacher/lessons/${lessonId}/worksheet${q}`,
      print: `/print/lessons/${lessonId}/worksheet${q}`,
      check: `/teacher/lessons/${lessonId}/check/worksheet${q}`,
    },
    ...(showReviewQuiz
      ? [
          {
            title: 'Checkpoint Quiz (3 units)',
            desc: `Covers units ${lesson.unit_number - 2}–${lesson.unit_number} only (every 3 units).`,
            view: `/teacher/lessons/${lessonId}/review-quiz${q}`,
            print: `/print/lessons/${lessonId}/review-quiz${q}`,
            check: `/teacher/lessons/${lessonId}/check/review-quiz${q}`,
          },
        ]
      : []),
    {
      title: 'Homework',
      desc: 'Independent check for next session.',
      view: `/teacher/lessons/${lessonId}/homework${q}`,
      print: `/print/lessons/${lessonId}/homework${q}`,
      check: `/teacher/lessons/${lessonId}/check/homework${q}`,
    },
  ]

  return (
    <div>
      <p className="muted">
        <Link to={backTo}>{backLabel}</Link>
      </p>
      <h1>
        Unit {lesson.unit_number}: {lesson.theme}
      </h1>
      <p>
        {course?.title} · {lesson.grammar}
        {lesson.arabic ? ` · ${lesson.arabic}` : ''}
      </p>
      {!showReviewQuiz ? (
        <p className="muted">
          Checkpoint quiz appears on units 3, 6, 9, and 12 (not on this unit).
        </p>
      ) : null}

      <section className="panel">
        <div className="field" style={{ maxWidth: 360, marginBottom: 0 }}>
          <label htmlFor="student">Student name (optional, prints on sheets)</label>
          <input
            id="student"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Sara"
          />
        </div>
      </section>

      <div className={showReviewQuiz ? 'grid-4' : 'grid-2'}>
        {cards.map((card) => (
          <div className="panel pack-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <div className="actions">
              <Link className="btn secondary" to={card.view}>
                Preview
              </Link>
              <Link className="btn" to={card.print} target="_blank" rel="noreferrer">
                Print
              </Link>
              {card.check ? (
                <Link className="btn secondary" to={card.check}>
                  Check mode
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
