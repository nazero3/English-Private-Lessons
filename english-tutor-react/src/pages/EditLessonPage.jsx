import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'

function asLines(arr) {
  return (arr || []).join('\n')
}

function parseLines(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function EditLessonPage() {
  const { lessonId } = useParams()
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const lesson = await api.getLesson(lessonId)
        setForm({
          theme: lesson.theme,
          grammar: lesson.grammar,
          arabic: lesson.arabic || '',
          explanation: lesson.explanation || '',
          teacher_notes: lesson.teacher_notes || '',
          objectivesText: asLines(lesson.objectives),
          worksheetJson: JSON.stringify(lesson.worksheet || [], null, 2),
          homeworkJson: JSON.stringify(lesson.homework || [], null, 2),
          quizBankJson: JSON.stringify(lesson.quiz_bank || [], null, 2),
          sessionFlowJson: JSON.stringify(lesson.session_flow || [], null, 2),
          commonMistakesJson: JSON.stringify(lesson.common_mistakes || [], null, 2),
          visualJson: JSON.stringify(lesson.visual || [], null, 2),
          unit_number: lesson.unit_number,
          course: lesson.course,
        })
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [lessonId])

  const save = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const patch = {
        theme: form.theme,
        grammar: form.grammar,
        arabic: form.arabic,
        explanation: form.explanation,
        teacher_notes: form.teacher_notes,
        objectives: parseLines(form.objectivesText),
        worksheet: JSON.parse(form.worksheetJson),
        homework: JSON.parse(form.homeworkJson),
        quiz_bank: JSON.parse(form.quizBankJson),
        session_flow: JSON.parse(form.sessionFlowJson),
        common_mistakes: JSON.parse(form.commonMistakesJson),
        visual: JSON.parse(form.visualJson),
      }
      await api.updateLesson(lessonId, patch)
      setMessage('Lesson saved.')
    } catch (err) {
      setError(err.message || 'Invalid JSON or save failed')
    }
  }

  if (error && !form) return <p className="error">{error}</p>
  if (!form) return <p className="muted">Loading…</p>

  return (
    <div>
      <p className="muted">
        <Link to={`/manager/courses/${form.course?.id}`}>← Course</Link>
      </p>
      <h1>
        Edit Unit {form.unit_number}: {form.theme}
      </h1>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <form className="panel" onSubmit={save}>
        <div className="grid-2">
          <div className="field">
            <label>Theme</label>
            <input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
          </div>
          <div className="field">
            <label>Grammar</label>
            <input
              value={form.grammar}
              onChange={(e) => setForm({ ...form, grammar: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Arabic label</label>
          <input value={form.arabic} onChange={(e) => setForm({ ...form, arabic: e.target.value })} />
        </div>
        <div className="field">
          <label>Explanation</label>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Objectives (one per line)</label>
          <textarea
            value={form.objectivesText}
            onChange={(e) => setForm({ ...form, objectivesText: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Teacher notes</label>
          <textarea
            value={form.teacher_notes}
            onChange={(e) => setForm({ ...form, teacher_notes: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Visual JSON</label>
          <textarea
            value={form.visualJson}
            onChange={(e) => setForm({ ...form, visualJson: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Session flow JSON</label>
          <textarea
            value={form.sessionFlowJson}
            onChange={(e) => setForm({ ...form, sessionFlowJson: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Common mistakes JSON</label>
          <textarea
            value={form.commonMistakesJson}
            onChange={(e) => setForm({ ...form, commonMistakesJson: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Worksheet JSON</label>
          <textarea
            value={form.worksheetJson}
            onChange={(e) => setForm({ ...form, worksheetJson: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Homework JSON</label>
          <textarea
            value={form.homeworkJson}
            onChange={(e) => setForm({ ...form, homeworkJson: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Quiz bank JSON</label>
          <textarea
            value={form.quizBankJson}
            onChange={(e) => setForm({ ...form, quizBankJson: e.target.value })}
          />
        </div>
        <button className="btn" type="submit">
          Save lesson
        </button>
      </form>
    </div>
  )
}
