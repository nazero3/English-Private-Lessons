import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { fmtDate, fmtPct, fmtScore, toDateInput, todayInputValue } from '../lib/studentDisplay'

const emptyAccount = { full_name: '', email: '', password: '', teacher_id: '' }
const emptyLesson = {
  course_id: '',
  lesson_id: '',
  session_date: todayInputValue(),
  notes: '',
  homework_assigned: '',
  quiz_score: '',
  quiz_total: '',
  homework_score: '',
  homework_total: '',
}
const emptyTest = {
  title: '',
  score: '',
  total: '',
  notes: '',
  test_date: todayInputValue(),
}

function numOrNull(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export default function StudentProfilePage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const base = isManager ? '/manager/students' : '/teacher/students'
  const [data, setData] = useState(null)
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [teachers, setTeachers] = useState([])
  const [account, setAccount] = useState(emptyAccount)
  const [lessonForm, setLessonForm] = useState(emptyLesson)
  const [testForm, setTestForm] = useState(emptyTest)
  const [editingSession, setEditingSession] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    const portal = await api.getStudent(studentId)
    setData(portal)
    setAccount({
      full_name: portal.student.full_name || '',
      email: portal.student.email || '',
      password: '',
      teacher_id: portal.student.teacher_id || '',
    })
    const courseRows = await api.listCourses(profile)
    setCourses(courseRows)
    if (isManager) {
      const profiles = await api.listProfiles()
      setTeachers(profiles.filter((p) => p.role === 'teacher'))
    }
    return { portal, courseRows }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { courseRows } = await load()
        if (courseRows[0]) {
          const lessonRows = await api.listLessons(courseRows[0].id)
          setLessons(lessonRows)
          setLessonForm((prev) => ({
            ...prev,
            course_id: prev.course_id || courseRows[0].id,
            lesson_id: prev.lesson_id || lessonRows[0]?.id || '',
          }))
        }
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [studentId, profile])

  const onCourseChange = async (courseId) => {
    setLessonForm((prev) => ({ ...prev, course_id: courseId, lesson_id: '' }))
    const lessonRows = await api.listLessons(courseId)
    setLessons(lessonRows)
    setLessonForm((prev) => ({
      ...prev,
      course_id: courseId,
      lesson_id: lessonRows[0]?.id || '',
    }))
  }

  const run = async (fn, success) => {
    setError('')
    setMessage('')
    try {
      await fn()
      await load()
      if (success) setMessage(success)
    } catch (err) {
      setError(err.message)
    }
  }

  const saveAccount = (e) => {
    e.preventDefault()
    return run(
      () =>
        api.updateStudent(studentId, {
          full_name: account.full_name.trim(),
          email: account.email.trim() || undefined,
          password: account.password || undefined,
          teacher_id: isManager ? account.teacher_id || null : undefined,
        }),
      'Student account updated.',
    )
  }

  const removeStudent = async () => {
    const ok = window.confirm(`Delete ${data?.student.full_name}? This removes their login and test scores. Class hours are kept.`)
    if (!ok) return
    setError('')
    setDeleting(true)
    try {
      await api.deleteStudent(studentId)
      navigate(base, { replace: true, state: { message: `${data?.student.full_name || 'Student'} was removed.` } })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const addLesson = (e) => {
    e.preventDefault()
    return run(async () => {
      if (!lessonForm.lesson_id) throw new Error('Choose a lesson unit')
      await api.createSession({
        student_id: studentId,
        lesson_id: lessonForm.lesson_id,
        notes: lessonForm.notes.trim(),
        homework_assigned: lessonForm.homework_assigned.trim(),
        session_date: new Date(`${lessonForm.session_date}T12:00:00`).toISOString(),
        quiz_score: numOrNull(lessonForm.quiz_score),
        quiz_total: numOrNull(lessonForm.quiz_total),
        homework_score: numOrNull(lessonForm.homework_score),
        homework_total: numOrNull(lessonForm.homework_total),
      })
      setLessonForm((prev) => ({
        ...emptyLesson,
        course_id: prev.course_id,
        lesson_id: prev.lesson_id,
        session_date: todayInputValue(),
      }))
    }, 'Lesson saved. The student can see notes and homework after they sign in.')
  }

  const saveSessionEdit = (sessionId) =>
    run(async () => {
      await api.updateSession(sessionId, {
        notes: editingSession.notes,
        homework_assigned: editingSession.homework_assigned,
        quiz_score: numOrNull(editingSession.quiz_score),
        quiz_total: numOrNull(editingSession.quiz_total),
        homework_score: numOrNull(editingSession.homework_score),
        homework_total: numOrNull(editingSession.homework_total),
        session_date: new Date(`${editingSession.session_date}T12:00:00`).toISOString(),
      })
      setEditingSession(null)
    }, 'Lesson updated.')

  const addTest = (e) => {
    e.preventDefault()
    return run(async () => {
      if (!testForm.title.trim()) throw new Error('Test title is required')
      await api.addStudentScore(studentId, {
        title: testForm.title.trim(),
        score: numOrNull(testForm.score),
        total: numOrNull(testForm.total),
        notes: testForm.notes.trim(),
        test_date: new Date(`${testForm.test_date}T12:00:00`).toISOString(),
      })
      setTestForm(emptyTest)
    }, 'Test score saved.')
  }

  if (error && !data) return <p className="error">{error}</p>
  if (!data) return <p className="muted">Loading student…</p>

  const { student, sessions, scores, summary } = data

  return (
    <div>
      <p className="muted">
        <Link to={base}>← Students</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>{student.full_name}</h1>
          <p className="muted">
            {student.email || 'No login yet'}
            {student.teacher?.full_name ? ` · ${student.teacher.full_name}` : isManager ? ' · No teacher' : ''}
          </p>
        </div>
        <span className={`badge${!student.teacher_id && isManager ? ' is-warn' : ''}`}>
          {!student.teacher_id && isManager
            ? 'Needs a teacher'
            : student.has_login
              ? 'Can sign in'
              : 'No login'}
        </span>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {isManager && !student.teacher_id ? (
        <p className="notice">This student has no teacher. Assign one below so they appear on a teacher roster.</p>
      ) : null}

      <section className="score-summary">
        <div className="score-card">
          <span className="muted">Overall</span>
          <strong>{fmtPct(summary.overall_avg)}</strong>
        </div>
        <div className="score-card">
          <span className="muted">Tests</span>
          <strong>{fmtPct(summary.tests_avg)}</strong>
        </div>
        <div className="score-card">
          <span className="muted">Quizzes</span>
          <strong>{fmtPct(summary.quiz_avg)}</strong>
        </div>
        <div className="score-card">
          <span className="muted">Homework</span>
          <strong>{fmtPct(summary.homework_avg)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>{isManager ? 'Edit student' : 'Account'}</h2>
        <form onSubmit={saveAccount}>
          <div className="grid-2">
            <div className="field">
              <label>Full name</label>
              <input
                value={account.full_name}
                onChange={(e) => setAccount({ ...account, full_name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                placeholder="Required to create a login"
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>{student.has_login ? 'New password (optional)' : 'Password'}</label>
              <input
                type="password"
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
                minLength={6}
                placeholder={student.has_login ? 'Leave blank to keep current password' : 'Needed with email'}
              />
            </div>
            {isManager ? (
              <div className="field">
                <label>Teacher</label>
                <select
                  value={account.teacher_id}
                  onChange={(e) => setAccount({ ...account, teacher_id: e.target.value })}
                >
                  <option value="">No teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              Save account
            </button>
            <button type="button" className="btn ghost" onClick={removeStudent} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete student'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Give a lesson</h2>
        <p className="muted">Notes and homework appear on the student’s home page.</p>
        <form onSubmit={addLesson}>
          <div className="grid-2">
            <div className="field">
              <label>Course</label>
              <select value={lessonForm.course_id} onChange={(e) => onCourseChange(e.target.value)} required>
                {!courses.length ? <option value="">No courses</option> : null}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Lesson unit</label>
              <select
                value={lessonForm.lesson_id}
                onChange={(e) => setLessonForm({ ...lessonForm, lesson_id: e.target.value })}
                required
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Unit {l.unit_number}: {l.theme}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={lessonForm.session_date}
              onChange={(e) => setLessonForm({ ...lessonForm, session_date: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Notes for the student</label>
            <textarea
              value={lessonForm.notes}
              onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
              placeholder="What to review, pronunciation notes, encouragement…"
            />
          </div>
          <div className="field">
            <label>Homework</label>
            <textarea
              value={lessonForm.homework_assigned}
              onChange={(e) => setLessonForm({ ...lessonForm, homework_assigned: e.target.value })}
              placeholder="Workbook p.12, or extra writing…"
            />
          </div>
          <div className="grid-4">
            <div className="field">
              <label>Quiz score</label>
              <input
                type="number"
                value={lessonForm.quiz_score}
                onChange={(e) => setLessonForm({ ...lessonForm, quiz_score: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Quiz total</label>
              <input
                type="number"
                value={lessonForm.quiz_total}
                onChange={(e) => setLessonForm({ ...lessonForm, quiz_total: e.target.value })}
              />
            </div>
            <div className="field">
              <label>HW score</label>
              <input
                type="number"
                value={lessonForm.homework_score}
                onChange={(e) => setLessonForm({ ...lessonForm, homework_score: e.target.value })}
              />
            </div>
            <div className="field">
              <label>HW total</label>
              <input
                type="number"
                value={lessonForm.homework_total}
                onChange={(e) => setLessonForm({ ...lessonForm, homework_total: e.target.value })}
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Save lesson
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Lesson history</h2>
        {!sessions.length ? <p className="muted">No lessons logged yet.</p> : null}
        <div className="session-list">
          {sessions.map((s) => {
            const editing = editingSession?.id === s.id
            return (
              <article key={s.id} className="session-card">
                <div className="session-card__head">
                  <div>
                    <strong>{s.lesson?.theme || 'Lesson'}</strong>
                    <div className="muted" style={{ fontSize: '0.88rem' }}>
                      {fmtDate(s.session_date)} · {s.course?.title || 'Course'} · U{s.lesson?.unit_number}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        setEditingSession(
                          editing
                            ? null
                            : {
                                id: s.id,
                                notes: s.notes || '',
                                homework_assigned: s.homework_assigned || '',
                                quiz_score: s.quiz_score ?? '',
                                quiz_total: s.quiz_total ?? '',
                                homework_score: s.homework_score ?? '',
                                homework_total: s.homework_total ?? '',
                                session_date: toDateInput(s.session_date),
                              },
                        )
                      }
                    >
                      {editing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        run(() => api.deleteSession(s.id), 'Lesson removed.')
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editing ? (
                  <>
                    <div className="field">
                      <label>Notes</label>
                      <textarea
                        value={editingSession.notes}
                        onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Homework</label>
                      <textarea
                        value={editingSession.homework_assigned}
                        onChange={(e) =>
                          setEditingSession({ ...editingSession, homework_assigned: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid-4">
                      <div className="field">
                        <label>Quiz</label>
                        <input
                          type="number"
                          value={editingSession.quiz_score}
                          onChange={(e) =>
                            setEditingSession({ ...editingSession, quiz_score: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Quiz total</label>
                        <input
                          type="number"
                          value={editingSession.quiz_total}
                          onChange={(e) =>
                            setEditingSession({ ...editingSession, quiz_total: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>HW</label>
                        <input
                          type="number"
                          value={editingSession.homework_score}
                          onChange={(e) =>
                            setEditingSession({ ...editingSession, homework_score: e.target.value })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>HW total</label>
                        <input
                          type="number"
                          value={editingSession.homework_total}
                          onChange={(e) =>
                            setEditingSession({ ...editingSession, homework_total: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <button type="button" className="btn" onClick={() => saveSessionEdit(s.id)}>
                      Save changes
                    </button>
                  </>
                ) : (
                  <>
                    {s.notes ? (
                      <div className="session-card__block">
                        <span className="muted">Notes</span>
                        <p>{s.notes}</p>
                      </div>
                    ) : (
                      <p className="muted">No notes.</p>
                    )}
                    {s.homework_assigned ? (
                      <div className="session-card__block">
                        <span className="muted">Homework</span>
                        <p>{s.homework_assigned}</p>
                      </div>
                    ) : null}
                    <p className="muted" style={{ fontSize: '0.88rem' }}>
                      Quiz {fmtScore(s.quiz_score, s.quiz_total)} · HW{' '}
                      {fmtScore(s.homework_score, s.homework_total)}
                    </p>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Test scores</h2>
        <form onSubmit={addTest}>
          <div className="grid-2">
            <div className="field">
              <label>Test name</label>
              <input
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                placeholder="Unit 3 quiz, Midterm…"
                required
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={testForm.test_date}
                onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Score</label>
              <input
                type="number"
                value={testForm.score}
                onChange={(e) => setTestForm({ ...testForm, score: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Total</label>
              <input
                type="number"
                value={testForm.total}
                onChange={(e) => setTestForm({ ...testForm, total: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <input
              value={testForm.notes}
              onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
              placeholder="Optional comment"
            />
          </div>
          <button className="btn" type="submit">
            Add test score
          </button>
        </form>

        {!scores.length ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            No tests yet.
          </p>
        ) : (
          <table className="table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Score</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{fmtDate(row.test_date)}</td>
                  <td>
                    {fmtScore(row.score, row.total)}
                    {row.percent != null ? ` (${row.percent}%)` : ''}
                  </td>
                  <td>{row.notes || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        run(() => api.deleteStudentScore(studentId, row.id), 'Score removed.')
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
