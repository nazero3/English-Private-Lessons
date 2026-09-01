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
    const rows = sessions.map((s) => [
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
    setSearchParams(sessionId ? { edit: sessionId } : {}, { replace: true })
  }

  const stopEdit = () => {
    setEditingId('')
    setSearchParams({}, { replace: true })
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
      <p className="muted">
        <Link to={home}>← Back</Link>
      </p>
      <div className="topbar" style={{ border: 'none', paddingBottom: 0 }}>
        <div>
          <h1 style={{ margin: 0 }}>{canSeeAll ? 'All classes' : 'Your classes'}</h1>
          {canLogSession ? (
            <p className="muted" style={{ margin: '0.35rem 0 0' }}>
              This month · {formatHours(monthHours)} hours
            </p>
          ) : null}
        </div>
        <button type="button" className="btn secondary" onClick={exportCsv} disabled={!sessions.length}>
          Export CSV
        </button>
      </div>
      {isManager ? (
        <p className="muted">Review teacher classes and leave feedback.</p>
      ) : isOperations ? (
        <p className="muted">Every logged class with hours. Open Hours for monthly totals.</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

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
                  <tr key={s.id} className={s.id === editingId ? 'is-selected' : ''}>
                    <td>{new Date(s.session_date || s.created_at).toLocaleDateString()}</td>
                    <td>
                      {s.student_name}
                      {s.notes ? <div className="muted">{s.notes}</div> : null}
                    </td>
                    <td>
                      {s.course?.title || 'Course'}
                      {s.lesson?.unit_number != null ? ` · U${s.lesson.unit_number}` : ''}
                    </td>
                    <td>{formatHours(s.hours)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => (s.id === editingId ? stopEdit() : startEdit(s.id))}
                      >
                        {s.id === editingId ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : (
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
                      {canSeeAll ? ` · ${s.teacher?.full_name || 'Teacher'}` : ''}
                      {s.hours != null ? ` · ${formatHours(s.hours)}h` : ''}
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
                    <span className="muted">
                      Manager feedback
                      {s.manager_feedback_at
                        ? ` · ${new Date(s.manager_feedback_at).toLocaleString()}`
                        : ''}
                    </span>
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
                    <button type="button" className="btn" onClick={() => saveFeedback(s.id)}>
                      Save & notify teacher
                    </button>
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
