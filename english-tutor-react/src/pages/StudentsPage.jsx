import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { clipText, fmtDate, latestSessionForStudent } from '../lib/studentDisplay'

const emptyForm = { full_name: '', email: '', password: '', teacher_id: '' }

export default function StudentsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const isOps = profile?.role === 'operations'
  const isRosterAdmin = isManager || isOps
  const base = isManager ? '/manager/students' : isOps ? '/operations/students' : '/teacher/students'
  const back = isManager ? '/manager' : isOps ? '/operations' : '/teacher'
  const location = useLocation()
  const [students, setStudents] = useState([])
  const [sessions, setSessions] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    try {
      const [rows, sessionRows] = await Promise.all([
        api.listStudents(profile),
        api.listSessions(profile).catch(() => []),
      ])
      setStudents(rows)
      setSessions(sessionRows)
      if (isRosterAdmin) {
        if (isOps) {
          const schedule = await api.getSchedules()
          setTeachers((schedule.teachers || []).map((row) => row.teacher).filter(Boolean))
        } else {
          const profiles = await api.listProfiles()
          setTeachers(profiles.filter((p) => p.role === 'teacher'))
        }
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
        teacher_id: isRosterAdmin ? form.teacher_id || null : undefined,
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
      <p className="crumb">
        <Link to={back}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>{isRosterAdmin ? 'Students' : 'My students'}</h1>
          <p className="muted">
            {isRosterAdmin
              ? 'Add students and assign each one to a teacher. The weekly chart uses this roster.'
              : 'Tap a name to read every note and homework you logged for that student.'}
          </p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {isRosterAdmin && needsTeacher.length ? (
        <p className="notice">
          {needsTeacher.length} student{needsTeacher.length === 1 ? '' : 's'} still need a teacher.
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
            {isRosterAdmin ? (
              <div className="field">
                <label htmlFor="stu-teacher">Teacher</label>
                <select
                  id="stu-teacher"
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                >
                  <option value="">Assign later</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="stu-email">Email</label>
                <input
                  id="stu-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>
          <div className="grid-2">
            {isRosterAdmin ? (
              <div className="field">
                <label htmlFor="stu-email-mgr">Email</label>
                <input
                  id="stu-email-mgr"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Optional"
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
                placeholder="With email, to let them sign in"
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
          <p className="muted">No students yet. Add one above.</p>
        ) : (
          <ul className="teacher-account-list">
            {students.map((s) => {
              const last = latestSessionForStudent(sessions, s)
              const notes = clipText(last?.notes)
              const homework = clipText(last?.homework_assigned)
              const body = (
                <>
                  <strong>{s.full_name}</strong>
                  <span className="muted">
                    {s.email || 'No login yet'}
                    {isRosterAdmin && s.teacher?.full_name ? ` · ${s.teacher.full_name}` : ''}
                    {isRosterAdmin && !s.teacher_id ? ' · Needs a teacher' : ''}
                    {last ? ` · Last class ${fmtDate(last.session_date || last.created_at)}` : ''}
                  </span>
                  {!isOps && notes ? (
                    <span className="person-row__note">
                      <span className="person-row__note-label">Notes</span>
                      {notes}
                    </span>
                  ) : null}
                  {!isOps && homework ? (
                    <span className="person-row__note">
                      <span className="person-row__note-label">Homework</span>
                      {homework}
                    </span>
                  ) : !isOps && last && !notes ? (
                    <span className="muted">No notes or homework on the last class.</span>
                  ) : !isOps && !last ? (
                    <span className="muted">No classes logged yet.</span>
                  ) : null}
                </>
              )
              return (
              <li key={s.id} className="person-row">
                {isOps ? (
                  <div className="person-row__main">{body}</div>
                ) : (
                  <Link className="person-row__main" to={`${base}/${s.id}`}>
                    {body}
                  </Link>
                )}
                <div className="person-row__tools">
                  {isRosterAdmin ? (
                    <select
                      className={`person-row__select${s.teacher_id ? '' : ' is-empty'}`}
                      value={s.teacher_id || ''}
                      aria-label={`Teacher for ${s.full_name}`}
                      disabled={Boolean(busyId)}
                      onChange={(e) => assignTeacher(s.id, e.target.value)}
                    >
                      <option value="">{s.teacher_id ? 'Unassigned' : 'Assign teacher'}</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    className="btn text-danger"
                    aria-label={`Delete ${s.full_name}`}
                    disabled={Boolean(busyId)}
                    onClick={() => removeStudent(s)}
                  >
                    {busyId === s.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
