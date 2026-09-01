import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { scoreFill, scoreMcq } from '../lib/sheets'

export default function CheckModePage() {
  const { lessonId, kind } = useParams()
  const [params] = useSearchParams()
  const studentName = params.get('student') || 'Student'
  const { profile } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [reviewItems, setReviewItems] = useState([])
  const [answers, setAnswers] = useState({})
  const [score, setScore] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        if (kind === 'review-quiz') {
          const quiz = await api.getReviewQuiz(lessonId)
          setReviewItems(quiz.items || [])
          setLesson({
            id: lessonId,
            unit_number: quiz.unitNumber,
            course: quiz.course,
          })
        } else {
          setLesson(await api.getLesson(lessonId))
        }
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [lessonId, kind])

  const items = useMemo(() => {
    if (!lesson) return []
    if (kind === 'worksheet') return (lesson.worksheet || []).filter((i) => i.type === 'fill')
    if (kind === 'homework') return (lesson.homework || []).filter((i) => i.type === 'fill')
    if (kind === 'review-quiz') return reviewItems
    return []
  }, [lesson, kind, reviewItems])

  const runScore = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      if (kind === 'review-quiz') {
        // Server/local mirror grades without sending keys to the client payload path
        const result = await api.gradeReviewQuiz(lessonId, answers)
        setScore({ correct: result.correct, total: result.total })
      } else {
        const gradeable = items.filter((i) => i.type === 'mcq' || (i.type === 'fill' && i.answer))
        let correct = 0
        gradeable.forEach((item) => {
          const key = item.compositeId || item.id
          if (item.type === 'mcq') {
            if (scoreMcq(answers[key], item.correct)) correct += 1
          } else if (scoreFill(answers[key], item.answer)) {
            correct += 1
          }
        })
        setScore({ correct, total: gradeable.length })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const saveSession = async () => {
    if (!score || !lesson) return
    setMessage('')
    try {
      const payload = {
        teacher_id: profile.id,
        lesson_id: lesson.id,
        student_name: studentName,
        notes: `Checked ${kind}`,
      }
      if (kind === 'worksheet') {
        payload.worksheet_score = score.correct
        payload.worksheet_total = score.total
      } else if (kind === 'homework') {
        payload.homework_score = score.correct
        payload.homework_total = score.total
      } else if (kind === 'review-quiz') {
        payload.quiz_score = score.correct
        payload.quiz_total = score.total
      }
      await api.createSession(payload)
      setMessage('Session score saved.')
    } catch (e) {
      setError(e.message)
    }
  }

  if (error && !lesson) return <p className="error">{error}</p>
  if (!lesson) return <p className="muted">Loading…</p>

  const title =
    kind === 'worksheet'
      ? 'Worksheet check'
      : kind === 'homework'
        ? 'Homework check'
        : 'Checkpoint quiz check'

  return (
    <div>
      <div className="actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn secondary" to={`/teacher/lessons/${lessonId}`}>
          ← Pack
        </Link>
      </div>
      <h1>{title}</h1>
      <p className="muted">
        Unit {lesson.unit_number} · {studentName}
        {kind === 'review-quiz'
          ? ' · Scored via secure RPC (no answer keys in quiz payload).'
          : ' · Auto-score fill/MCQ items (write tasks are open).'}
      </p>
      {error ? <p className="error">{error}</p> : null}

      {items.map((item) => {
        const key = item.compositeId || item.id
        return (
          <div className="check-item" key={key}>
            <div>
              <strong>{item.prompt}</strong>
              {item.sourceUnit ? (
                <span className="muted"> · unit {item.sourceUnit}</span>
              ) : null}
            </div>
            {item.type === 'mcq' ? (
              <div className="actions" style={{ marginTop: '0.4rem' }}>
                {(item.options || []).map((opt, idx) => (
                  <label key={opt} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name={key}
                      checked={Number(answers[key]) === idx}
                      onChange={() => setAnswers({ ...answers, [key]: idx })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <div className="field" style={{ marginTop: '0.4rem', marginBottom: 0 }}>
                <input
                  value={answers[key] || ''}
                  onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                  placeholder="Student answer"
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="actions">
        <button type="button" className="btn" onClick={runScore} disabled={busy}>
          {busy ? 'Scoring…' : 'Score'}
        </button>
        {score ? (
          <button type="button" className="btn secondary" onClick={saveSession}>
            Save session
          </button>
        ) : null}
      </div>

      {score ? (
        <p className="success">
          Score: {score.correct} / {score.total} (
          {score.total ? Math.round((score.correct / score.total) * 100) : 0}%)
        </p>
      ) : null}
      {message ? <p className="success">{message}</p> : null}
    </div>
  )
}
