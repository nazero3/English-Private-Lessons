import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HomeworkSheet } from '../components/sheets/HomeworkSheet'
import { ReviewQuizSheet } from '../components/sheets/ReviewQuizSheet'
import { TeacherBrief } from '../components/sheets/TeacherBrief'
import { Worksheet } from '../components/sheets/Worksheet'
import { api } from '../lib/api'

function useStudentName() {
  const [params] = useSearchParams()
  return params.get('student') || ''
}

function SheetActions({ lessonId, kind, studentName }) {
  const q = studentName ? `?student=${encodeURIComponent(studentName)}` : ''
  return (
    <div className="actions no-print" style={{ marginBottom: '1rem' }}>
      <Link className="btn secondary" to={`/teacher/lessons/${lessonId}`}>
        ← Pack
      </Link>
      <Link className="btn" to={`/print/lessons/${lessonId}/${kind}${q}`} target="_blank">
        Print / PDF
      </Link>
      {kind !== 'brief' ? (
        <Link className="btn secondary" to={`/teacher/lessons/${lessonId}/check/${kind}${q}`}>
          Check mode
        </Link>
      ) : null}
      <button type="button" className="btn secondary" onClick={() => window.print()}>
        Print this page
      </button>
    </div>
  )
}

export function BriefPage() {
  const { lessonId } = useParams()
  const studentName = useStudentName()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getLesson(lessonId)
      .then(setLesson)
      .catch((e) => setError(e.message))
  }, [lessonId])

  if (error) return <p className="error">{error}</p>
  if (!lesson) return <p className="muted">Loading…</p>

  return (
    <div>
      <SheetActions lessonId={lessonId} kind="brief" studentName={studentName} />
      <TeacherBrief lesson={lesson} course={lesson.course} studentName={studentName} />
    </div>
  )
}

export function WorksheetPage() {
  const { lessonId } = useParams()
  const studentName = useStudentName()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getLesson(lessonId)
      .then(setLesson)
      .catch((e) => setError(e.message))
  }, [lessonId])

  if (error) return <p className="error">{error}</p>
  if (!lesson) return <p className="muted">Loading…</p>

  return (
    <div>
      <SheetActions lessonId={lessonId} kind="worksheet" studentName={studentName} />
      <Worksheet lesson={lesson} course={lesson.course} studentName={studentName} />
    </div>
  )
}

export function HomeworkPage() {
  const { lessonId } = useParams()
  const studentName = useStudentName()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getLesson(lessonId)
      .then(setLesson)
      .catch((e) => setError(e.message))
  }, [lessonId])

  if (error) return <p className="error">{error}</p>
  if (!lesson) return <p className="muted">Loading…</p>

  return (
    <div>
      <SheetActions lessonId={lessonId} kind="homework" studentName={studentName} />
      <HomeworkSheet lesson={lesson} course={lesson.course} studentName={studentName} />
    </div>
  )
}

export function ReviewQuizPage() {
  const { lessonId } = useParams()
  const studentName = useStudentName()
  const [quiz, setQuiz] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getReviewQuiz(lessonId)
      .then(setQuiz)
      .catch((e) => setError(e.message))
  }, [lessonId])

  if (error) return <p className="error">{error}</p>
  if (!quiz) return <p className="muted">Loading…</p>

  return (
    <div>
      <SheetActions lessonId={lessonId} kind="review-quiz" studentName={studentName} />
      <ReviewQuizSheet
        lessonsMeta={quiz.lessonsMeta}
        items={quiz.items}
        course={quiz.course}
        studentName={studentName}
      />
    </div>
  )
}
