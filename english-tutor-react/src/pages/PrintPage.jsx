import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HomeworkSheet } from '../components/sheets/HomeworkSheet'
import { ReviewQuizSheet } from '../components/sheets/ReviewQuizSheet'
import { TeacherBrief } from '../components/sheets/TeacherBrief'
import { Worksheet } from '../components/sheets/Worksheet'
import { api } from '../lib/api'

export default function PrintPage() {
  const { lessonId, kind } = useParams()
  const [params] = useSearchParams()
  const studentName = params.get('student') || ''
  const [lesson, setLesson] = useState(null)
  const [reviewQuiz, setReviewQuiz] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        if (kind === 'review-quiz') {
          const quiz = await api.getReviewQuiz(lessonId)
          setReviewQuiz(quiz)
          setLesson({ id: lessonId, course: quiz.course, course_id: quiz.courseId })
        } else {
          setLesson(await api.getLesson(lessonId))
        }
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [lessonId, kind])

  useEffect(() => {
    if (kind === 'review-quiz' ? !reviewQuiz : !lesson) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [lesson, reviewQuiz, kind])

  if (error) return <p className="error">{error}</p>
  if (kind === 'review-quiz' ? !reviewQuiz : !lesson) {
    return <p className="muted">Preparing print…</p>
  }

  return (
    <div className="print-root app-shell">
      <div className="actions no-print" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <Link className="btn secondary" to={`/teacher/lessons/${lessonId}`}>
          Back to pack
        </Link>
        <span className="muted" style={{ alignSelf: 'center', fontSize: '0.85rem' }}>
          Tip: use Chrome → Save as PDF · A4 · margins Default
        </span>
      </div>
      {kind === 'brief' ? (
        <TeacherBrief lesson={lesson} course={lesson.course} studentName={studentName} />
      ) : null}
      {kind === 'worksheet' ? (
        <Worksheet lesson={lesson} course={lesson.course} studentName={studentName} />
      ) : null}
      {kind === 'homework' ? (
        <HomeworkSheet lesson={lesson} course={lesson.course} studentName={studentName} />
      ) : null}
      {kind === 'review-quiz' ? (
        <ReviewQuizSheet
          lessonsMeta={reviewQuiz.lessonsMeta}
          items={reviewQuiz.items}
          course={reviewQuiz.course}
          studentName={studentName}
        />
      ) : null}
    </div>
  )
}
