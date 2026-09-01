import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

function todayInputValue() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function SessionsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const [sessions, setSessions] = useState([])
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [feedbackDrafts, setFeedbackDrafts] = useState({})
  const [form, setForm] = useState({
    student_name: '',
    course_id: '',
    lesson_id: '',
    session_date: todayInputValue(),
    notes: '',
    homework_assigned: '',
  })

  const load = async () => {
    try {
      const [sessionRows, courseRows] = await Promise.all([
        api.listSessions(profile),
        api.listCourses(profile),
      ])
      setSessions(sessionRows)
      setCourses(courseRows)

      if (!isManager) {
        const studentRows = await api.listStudents(profile)
        setStudents(studentRows)
        if (!form.course_id && courseRows[0]) {
          const firstCourse = courseRows[0].id
          const lessonRows = await api.listLessons(firstCourse)
          setLessons(lessonRows)
          setForm((prev) => ({
            ...prev,
            course_id: firstCourse,
            lesson_id: lessonRows[0]?.id || '',
          }))
        }
      }
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile])

  const onCourseChange = async (courseId) => {
    setForm((prev) => ({ ...prev, course_id: courseId, lesson_id: '' }))
    try {
      const lessonRows = await api.listLessons(courseId)
      setLessons(lessonRows)
      setForm((prev) => ({
        ...prev,
        course_id: courseId,
        lesson_id: lessonRows[0]?.id || '',
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  const createSession = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      if (!form.student_name.trim()) throw new Error('Choose or enter a student name')
      if (!form.lesson_id) throw new Error('Choose a lesson unit')

      const created = await api.createStudent(profile, form.student_name.trim())
      await api.createSession({
        teacher_id: profile.id,
        lesson_id: form.lesson_id,
        student_id: created?.id,
        student_name: form.student_name.trim(),
        notes: form.notes.trim(),
        homework_assigned: form.homework_assigned.trim(),
        session_date: new Date(`${form.session_date}T12:00:00`).toISOString(),
      })
      setForm((prev) => ({
        ...prev,
        student_name: '',
        notes: '',
        homework_assigned: '',
        session_date: todayInputValue(),
      }))
      await load()
      setMessage('Session saved for the student.')
    } catch (err) {
      setError(err.message)
    }
  }

  const saveFeedback = async (sessionId) => {
    setError('')
    setMessage('')
    try {
      await api.addManagerFeedback(profile, {
        sessionId,
        feedback: feedbackDrafts[sessionId] || '',
      })
      setFeedbackDrafts((prev) => ({ ...prev, [sessionId]: '' }))
      await load()
      setMessage('Feedback saved and teacher notified.')
    } catch (err) {
      setError(err.message)
    }
  }

  const exportCsv = () => {
    const header = [
      'date',
      'teacher',
      'student',
      'course',
      'unit',
      'theme',
      'teacher_notes',
      'manager_feedback',
    ]
    const rows = sessions.map((s) => [
      s.session_date || s.created_at,
      s.teacher?.full_name || '',
      s.student_name,
      s.course?.title || '',
      s.lesson?.unit_number ?? '',
      s.lesson?.theme || '',
      (s.notes || '').replaceAll(',', ';'),
      (s.manager_feedback || '').replaceAll(',', ';'),
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lesson-sessions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const studentOptions = useMemo(
    () => students.map((s) => s.full_name),
    [students],
  )

  return (
    <div>
      <p className="muted">
        <Link to={isManager ? '/manager' : '/teacher'}>← Back</Link>
      </p>
      <div className="topbar" style={{ border: 'none', paddingBottom: 0 }}>
        <h1 style={{ margin: 0 }}>{isManager ? 'All sessions' : 'My sessions'}</h1>
        <button type="button" className="btn secondary" onClick={exportCsv} disabled={!sessions.length}>
          Export CSV
        </button>
      </div>
      <p className="muted">
        {isManager
          ? 'Review teacher sessions and leave feedback. The teacher gets an in-app notification.'
          : 'Log a private lesson for a specific student. Your manager can review it and leave feedback.'}
      </p>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {!isManager ? (
        <section className="panel">
          <h2>Add session</h2>
          <form onSubmit={createSession}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="student">Student</label>
                <input
                  id="student"
                  list="student-options"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  placeholder="Select or type a student name"
                  required
                />
                <datalist id="student-options">
                  {studentOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label htmlFor="session-date">Session date</label>
                <input
                  id="session-date"
                  type="date"
                  value={form.session_date}
                  onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="course">Course</label>
                <select
                  id="course"
                  value={form.course_id}
                  onChange={(e) => onCourseChange(e.target.value)}
                  required
                >
                  {!courses.length ? <option value="">No assigned courses</option> : null}
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="lesson">Lesson unit</label>
                <select
                  id="lesson"
                  value={form.lesson_id}
                  onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}
                  required
                >
                  {!lessons.length ? <option value="">Choose a course first</option> : null}
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Unit {l.unit_number}: {l.theme}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="notes">Teacher notes</label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What went well, what to review next…"
              />
            </div>
            <div className="field">
              <label htmlFor="homework">Homework for the student</label>
              <textarea
                id="homework"
                value={form.homework_assigned}
                onChange={(e) => setForm({ ...form, homework_assigned: e.target.value })}
                placeholder="Workbook page, extra writing, what to prepare…"
              />
            </div>

            <button className="btn" type="submit">
              Save session
            </button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>{isManager ? 'Session review' : 'Session history'}</h2>
        {!sessions.length ? <p className="muted">No sessions yet.</p> : null}
        <div className="session-list">
          {sessions.map((s) => (
            <article key={s.id} className="session-card">
              <div className="session-card__head">
                <div>
                  <strong>{s.student_name}</strong>
                  <div className="muted" style={{ fontSize: '0.88rem' }}>
                    {new Date(s.session_date || s.created_at).toLocaleString()}
                    {isManager ? ` · ${s.teacher?.full_name || 'Teacher'}` : ''}
                  </div>
                </div>
                <div className="badge">
                  {s.course?.title || 'Course'} · U{s.lesson?.unit_number}
                </div>
              </div>

              <p className="session-card__lesson">{s.lesson?.theme || 'Lesson'}</p>

              {s.notes ? (
                <div className="session-card__block">
                  <span className="muted">Teacher notes</span>
                  <p>{s.notes}</p>
                </div>
              ) : (
                <p className="muted">No teacher notes.</p>
              )}

              {s.homework_assigned ? (
                <div className="session-card__block">
                  <span className="muted">Homework</span>
                  <p>{s.homework_assigned}</p>
                </div>
              ) : null}

              {(s.worksheet_score != null || s.quiz_score != null || s.homework_score != null) && (
                <p className="muted" style={{ fontSize: '0.88rem' }}>
                  Scores:
                  {s.worksheet_score != null ? ` WS ${s.worksheet_score}/${s.worksheet_total}` : ''}
                  {s.quiz_score != null ? ` · Q ${s.quiz_score}/${s.quiz_total}` : ''}
                  {s.homework_score != null
                    ? ` · HW ${s.homework_score}/${s.homework_total}`
                    : ''}
                </p>
              )}

              {s.manager_feedback ? (
                <div className="session-card__feedback">
                  <span className="muted">
                    Manager feedback
                    {s.manager_feedback_at
                      ? ` · ${new Date(s.manager_feedback_at).toLocaleString()}`
                      : ''}
                  </span>
                  <p>{s.manager_feedback}</p>
                </div>
              ) : (
                <p className="muted">No manager feedback yet.</p>
              )}

              {isManager ? (
                <div className="session-card__manager-form">
                  <div className="field" style={{ marginBottom: '0.6rem' }}>
                    <label htmlFor={`feedback-${s.id}`}>
                      {s.manager_feedback ? 'Update feedback / note' : 'Add feedback / note'}
                    </label>
                    <textarea
                      id={`feedback-${s.id}`}
                      value={feedbackDrafts[s.id] ?? ''}
                      onChange={(e) =>
                        setFeedbackDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      placeholder="Write a note for this teacher about the session…"
                    />
                  </div>
                  <button type="button" className="btn" onClick={() => saveFeedback(s.id)}>
                    Save & notify teacher
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
