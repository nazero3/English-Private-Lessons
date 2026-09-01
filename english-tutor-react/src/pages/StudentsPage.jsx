import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const emptyForm = { full_name: '', email: '', password: '', teacher_id: '' }

export default function StudentsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const base = isManager ? '/manager/students' : '/teacher/students'
  const back = isManager ? '/manager' : '/teacher'
  const location = useLocation()
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    try {
      const rows = await api.listStudents(profile)
      setStudents(rows)
      if (isManager) {
        const profiles = await api.listProfiles()
        setTeachers(profiles.filter((p) => p.role === 'teacher'))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile])

  useEffect(() => {
    if (location.state?.message) setMessage(location.state.message)
  }, [location.state])

  const createStudent = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.createStudent(profile, {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        password: form.password || undefined,
        teacher_id: isManager ? form.teacher_id || null : undefined,
      })
      setForm(emptyForm)
      await load()
      setMessage('Student saved. They can sign in if you set an email and password.')
    } catch (err) {
      setError(err.message)
    }
  }

  const assignTeacher = async (studentId, teacherId) => {
    setError('')
    setMessage('')
    try {
      await api.updateStudent(studentId, { teacher_id: teacherId || null })
      await load()
      setMessage(teacherId ? 'Teacher assigned.' : 'Teacher cleared.')
    } catch (err) {
      setError(err.message)
    }
  }

  const removeStudent = async (student) => {
    const ok = window.confirm(
      `Delete ${student.full_name}? This removes their login and test scores. Class hours are kept.`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    setBusyId(student.id)
    try {
      await api.deleteStudent(student.id)
      await load()
      setMessage(`${student.full_name} was removed.`)
    } catch (err) {
      setError(err.message)
      try {
        await load()
      } catch {
        /* keep the delete error visible */
      }
    } finally {
      setBusyId('')
    }
  }

  const needsTeacher = students.filter((s) => !s.teacher_id)

  return (
    <div>
      <p className="muted">
        <Link to={back}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>{isManager ? 'Students' : 'My students'}</h1>
          <p className="muted">
            Create a login so each student can see homework, notes, and test scores.
          </p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {isManager && needsTeacher.length ? (
        <p className="notice">
          {needsTeacher.length} student{needsTeacher.length === 1 ? '' : 's'} need a teacher
          assigned.
        </p>
      ) : null}

      <section className="panel">
        <h2>Add student</h2>
        <form onSubmit={createStudent}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="stu-name">Full name</label>
              <input
                id="stu-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            {isManager ? (
              <div className="field">
                <label htmlFor="stu-teacher">Teacher</label>
                <select
                  id="stu-teacher"
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                >
                  <option value="">No teacher yet</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="stu-email">Email (for login)</label>
                <input
                  id="stu-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Optional until you give them a login"
                />
              </div>
            )}
          </div>
          <div className="grid-2">
            {isManager ? (
              <div className="field">
                <label htmlFor="stu-email-mgr">Email (for login)</label>
                <input
                  id="stu-email-mgr"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Optional until you give them a login"
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="stu-pass">Password</label>
              <input
                id="stu-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                placeholder="Needed with email to create a login"
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Save student
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Roster ({students.length})</h2>
        {!students.length ? (
          <p className="muted">
            No students in the roster. Add them above. If you deleted a teacher while students were
            still assigned, those students were removed and need to be added again.
          </p>
        ) : (
          <ul className="teacher-account-list">
            {students.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.full_name}</strong>
                  <div className="muted">
                    {s.email || 'No login yet'}
                    {isManager
                      ? s.teacher?.full_name
                        ? ` · ${s.teacher.full_name}`
                        : ' · No teacher'
                      : ''}
                  </div>
                </div>
                <div className="actions">
                  {!s.teacher_id && isManager ? (
                    <span className="badge is-warn">Needs a teacher</span>
                  ) : (
                    <span className="badge">{s.has_login ? 'Can sign in' : 'No login'}</span>
                  )}
                  {isManager ? (
                    <select
                      className="roster-teacher-select"
                      value={s.teacher_id || ''}
                      aria-label={`Teacher for ${s.full_name}`}
                      onChange={(e) => assignTeacher(s.id, e.target.value)}
                    >
                      <option value="">No teacher</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <Link className="btn secondary" to={`${base}/${s.id}`}>
                    Open profile
                  </Link>
                  <button
                    type="button"
                    className="btn ghost"
                    aria-label={`Delete ${s.full_name}`}
                    disabled={Boolean(busyId)}
                    onClick={() => removeStudent(s)}
                  >
                    {busyId === s.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
