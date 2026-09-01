import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LogClassForm from '../components/teacher/LogClassForm'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { homePath } from '../lib/permissions'

function formatHours(n) {
  if (n == null || n === '') return '—'
  const value = Number(n)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export default function SessionsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const isOperations = profile?.role === 'operations'
  const canSeeAll = isManager || isOperations
  const canLogSession = profile?.role === 'teacher'
  const home = homePath(profile?.role)
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [feedbackDrafts, setFeedbackDrafts] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingId, setEditingId] = useState(searchParams.get('edit') || '')
  const focusSessionId = searchParams.get('session') || ''
  const teacherFilter = searchParams.get('teacher') || 'all'
  const openLatestFeedback = searchParams.get('feedback') === '1'

  const patchParams = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === '' || value === 'all') next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next, { replace: true })
  }
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    try {
      setSessions(await api.listSessions(profile))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile])

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

  const removeFeedback = async (session) => {
    const ok = window.confirm(
      `Remove manager feedback for ${session.student_name}'s class? The teacher will no longer see this note.`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    setBusyId(session.id)
    try {
      await api.deleteManagerFeedback(profile, session.id)
      setFeedbackDrafts((prev) => ({ ...prev, [session.id]: '' }))
      await load()
      setMessage('Feedback removed.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  const teacherOptions = useMemo(() => {
    const map = new Map()
    for (const s of sessions) {
      if (!s.teacher_id || map.has(s.teacher_id)) continue
      map.set(s.teacher_id, s.teacher?.full_name || 'Teacher')
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [sessions])

  const visibleSessions = useMemo(() => {
    if (!canSeeAll || teacherFilter === 'all') return sessions
    return sessions.filter((s) => s.teacher_id === teacherFilter)
  }, [canSeeAll, sessions, teacherFilter])

  const selectedTeacherName = teacherOptions.find((t) => t.id === teacherFilter)?.name

  const focusedSession = useMemo(() => {
    if (focusSessionId) return sessions.find((s) => s.id === focusSessionId) || null
    if (openLatestFeedback) return sessions.find((s) => s.manager_feedback) || null
    return null
  }, [focusSessionId, openLatestFeedback, sessions])

  const exportCsv = () => {
    const header = [
      'date',
      'teacher',
      'student',
      'course',
      'unit',
      'hours',
      'theme',
      'teacher_notes',
      'manager_feedback',
    ]
    const rows = visibleSessions.map((s) => [
      s.session_date || s.created_at,
      s.teacher?.full_name || '',
      s.student_name,
      s.course?.title || '',
      s.lesson?.unit_number ?? '',
      s.hours ?? '',
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

  const editingSession = sessions.find((s) => s.id === editingId) || null

  const startEdit = (sessionId) => {
    setEditingId(sessionId)
    patchParams({ edit: sessionId || null })
  }

  const stopEdit = () => {
    setEditingId('')
    patchParams({ edit: null })
  }

  useEffect(() => {
    if (!focusedSession) return
    const timer = window.setTimeout(() => {
      const el =
        document.getElementById('session-feedback-focus') ||
        document.getElementById(`session-${focusedSession.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [focusedSession])

  const removeClass = async (session) => {
    const when = new Date(session.session_date || session.created_at).toLocaleDateString()
    const ok = window.confirm(
      `Remove ${session.student_name}'s class on ${when}? Use this if it was cancelled or postponed.`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    setBusyId(session.id)
    try {
      await api.deleteSession(session.id)
      if (editingId === session.id) stopEdit()
      await load()
      setMessage('Class removed.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
    }
  }

  const monthHours = useMemo(() => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return sessions.reduce((sum, s) => {
      if (s.hours == null || s.hours === '') return sum
      if (new Date(s.session_date || s.created_at) < start) return sum
      return sum + Number(s.hours)
    }, 0)
  }, [sessions])

  return (
    <div>
      <p className="crumb">
        <Link to={home}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>
            {canSeeAll
              ? selectedTeacherName
                ? `${selectedTeacherName}'s classes`
                : 'All classes'
              : 'Your classes'}
          </h1>
          <p className="muted">
            {canLogSession
              ? `This month · ${formatHours(monthHours)} hours`
              : isManager
                ? 'Review teacher classes and leave feedback.'
                : isOperations
                  ? 'Every logged class with hours. Open Hours for monthly totals.'
                  : ''}
          </p>
        </div>
        <button type="button" className="btn secondary compact" onClick={exportCsv} disabled={!visibleSessions.length}>
          Export CSV
        </button>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {canLogSession && focusedSession ? (
        <section className="panel session-feedback-focus" id="session-feedback-focus">
          <h2>Manager feedback</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {focusedSession.student_name}
            {' · '}
            {new Date(focusedSession.session_date || focusedSession.created_at).toLocaleString()}
            {focusedSession.course?.title ? ` · ${focusedSession.course.title}` : ''}
            {focusedSession.lesson?.unit_number != null
              ? ` · U${focusedSession.lesson.unit_number}`
              : ''}
          </p>
          {focusedSession.manager_feedback ? (
            <div className="session-card__feedback">
              <span className="muted">
                {focusedSession.manager_feedback_at
                  ? new Date(focusedSession.manager_feedback_at).toLocaleString()
                  : 'Manager note'}
              </span>
              <p>{focusedSession.manager_feedback}</p>
            </div>
          ) : (
            <p className="muted">No manager feedback on this class yet.</p>
          )}
        </section>
      ) : null}

      {canLogSession && editingSession ? (
        <section className="panel log-class-panel">
          <h2>Fix class · {editingSession.student_name}</h2>
          <p className="muted">Change the hours or the course if the original log was wrong.</p>
          <LogClassForm
            key={editingSession.id}
            profile={profile}
            editingSession={editingSession}
            onSaved={() => {
              stopEdit()
              load()
            }}
            onCancel={stopEdit}
          />
        </section>
      ) : null}

      {canLogSession && !editingSession ? (
        <section className="panel log-class-panel">
          <h2>Log a class</h2>
          <LogClassForm profile={profile} onSaved={load} />
        </section>
      ) : null}

      {canLogSession ? (
        <section className="panel">
          <h2>History</h2>
          {!sessions.length ? <p className="muted">No classes logged yet.</p> : null}
          {sessions.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Hours</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    id={`session-${s.id}`}
                    className={s.id === editingId || s.id === focusSessionId ? 'is-selected' : ''}
                  >
                    <td>{new Date(s.session_date || s.created_at).toLocaleDateString()}</td>
                    <td>
                      {s.student_name}
                      {s.notes ? <div className="muted">{s.notes}</div> : null}
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
                      ) : null}
                    </td>
                    <td>
                      {s.course?.title || 'Course'}
                      {s.lesson?.unit_number != null ? ` · U${s.lesson.unit_number}` : ''}
                    </td>
                    <td>{formatHours(s.hours)}</td>
                    <td>
                      <div className="person-row__tools">
                        <button
                          type="button"
                          className="table-link"
                          onClick={() => (s.id === editingId ? stopEdit() : startEdit(s.id))}
                        >
                          {s.id === editingId ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          className="btn text-danger"
                          disabled={Boolean(busyId)}
                          onClick={() => removeClass(s)}
                        >
                          {busyId === s.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : (
        <section className="panel">
          <div className="sessions-toolbar">
            <h2>{isManager ? 'Session review' : 'Session history'}</h2>
            {canSeeAll && teacherOptions.length ? (
              <div className="field sessions-toolbar__filter">
                <label htmlFor="filter-teacher">Teacher</label>
                <select
                  id="filter-teacher"
                  value={teacherFilter}
                  onChange={(e) => patchParams({ teacher: e.target.value })}
                >
                  <option value="all">All teachers</option>
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          {!sessions.length ? <p className="muted">No sessions yet.</p> : null}
          {sessions.length && !visibleSessions.length ? (
            <p className="muted">No sessions for this teacher.</p>
          ) : null}
          <div className="session-list">
            {visibleSessions.map((s) => (
              <article
                key={s.id}
                id={`session-${s.id}`}
                className={`session-card${s.id === focusSessionId ? ' is-selected' : ''}`}
              >
                <div className="session-card__head">
                  <div>
                    <strong>{s.student_name}</strong>
                    {canSeeAll ? (
                      <div className="session-card__teacher">
                        {s.teacher?.full_name || 'No teacher assigned'}
                      </div>
                    ) : null}
                    <div className="muted" style={{ fontSize: '0.88rem' }}>
                      {new Date(s.session_date || s.created_at).toLocaleString()}
                      {s.hours != null ? ` · ${formatHours(s.hours)}h` : ''}
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: '0.88rem' }}>
                    {s.course?.title || 'Course'}
                    {s.lesson?.unit_number != null ? ` · U${s.lesson.unit_number}` : ''}
                  </div>
                </div>

                <p className="session-card__lesson">{s.lesson?.theme || 'Lesson'}</p>

                {s.notes ? (
                  <div className="session-card__block">
                    <span className="muted">Teacher notes</span>
                    <p>{s.notes}</p>
                  </div>
                ) : null}

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
                    <div className="session-card__feedback-head">
                      <span className="muted">
                        Manager feedback
                        {s.manager_feedback_at
                          ? ` · ${new Date(s.manager_feedback_at).toLocaleString()}`
                          : ''}
                      </span>
                      {isManager ? (
                        <button
                          type="button"
                          className="btn text-danger"
                          disabled={Boolean(busyId)}
                          onClick={() => removeFeedback(s)}
                        >
                          {busyId === s.id ? 'Deleting…' : 'Delete feedback'}
                        </button>
                      ) : null}
                    </div>
                    <p>{s.manager_feedback}</p>
                  </div>
                ) : isManager ? (
                  <p className="muted">No manager feedback yet.</p>
                ) : null}

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
                    <div className="person-row__tools" style={{ justifyContent: 'flex-start' }}>
                      <button type="button" className="btn" onClick={() => saveFeedback(s.id)}>
                        Save & notify teacher
                      </button>
                      {s.manager_feedback ? (
                        <button
                          type="button"
                          className="btn text-danger"
                          disabled={Boolean(busyId)}
                          onClick={() => removeFeedback(s)}
                        >
                          {busyId === s.id ? 'Deleting…' : 'Delete previous feedback'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
