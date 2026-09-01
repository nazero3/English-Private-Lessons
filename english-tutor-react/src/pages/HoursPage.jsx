import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { homePath } from '../lib/permissions'

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthBounds(ym) {
  const [year, month] = ym.split('-').map(Number)
  const last = new Date(year, month, 0).getDate()
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
  }
}

function formatHours(n) {
  const value = Number(n) || 0
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export default function HoursPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const home = homePath(profile?.role)
  const [month, setMonth] = useState(currentMonthValue)
  const [summary, setSummary] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setError('')
    try {
      const { from, to } = monthBounds(month)
      const [hours, sessionRows] = await Promise.all([
        api.hoursSummary({ from, to }),
        api.listSessions(profile),
      ])
      setSummary(hours)
      setSessions(sessionRows)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile, month])

  const selectedTeacher = summary?.teachers?.find((t) => t.teacher_id === selectedTeacherId)

  const hoursForTeacher = useCallback(
    (teacherId) => {
      if (!teacherId) return []
      const { from, to } = monthBounds(month)
      const start = new Date(`${from}T00:00:00`)
      const end = new Date(`${to}T23:59:59`)
      return sessions.filter((s) => {
        if (s.teacher_id !== teacherId) return false
        if (s.hours == null || s.hours === '') return false
        const d = new Date(s.session_date || s.created_at)
        return d >= start && d <= end
      })
    },
    [sessions, month],
  )

  const teacherSessions = useMemo(
    () => hoursForTeacher(selectedTeacherId),
    [hoursForTeacher, selectedTeacherId],
  )

  const deleteHour = async (session) => {
    const when = new Date(session.session_date || session.created_at).toLocaleDateString()
    const ok = window.confirm(
      `Delete ${formatHours(session.hours)} hours for ${session.student_name} on ${when}?`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    try {
      await api.deleteSession(session.id)
      await load()
      setMessage('Hours removed.')
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteTeacherMonthHours = async (teacherId, teacherName) => {
    const rows = hoursForTeacher(teacherId)
    if (!rows.length) return
    const ok = window.confirm(
      `Delete ${rows.length} class${rows.length === 1 ? '' : 'es'} (${formatHours(
        rows.reduce((sum, s) => sum + Number(s.hours || 0), 0),
      )} hours) for ${teacherName || 'this teacher'} in ${month}?`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    try {
      for (const row of rows) {
        await api.deleteSession(row.id)
      }
      await load()
      setMessage('Teacher hours removed for this month.')
    } catch (e) {
      setError(e.message)
      await load()
    }
  }

  const exportCsv = () => {
    if (!summary?.teachers?.length) return
    const header = ['teacher', 'email', 'sessions', 'hours']
    const rows = summary.teachers.map((t) => [
      t.teacher?.full_name || '',
      t.teacher?.email || '',
      t.session_count,
      formatHours(t.total_hours),
    ])
    rows.push(['Total', '', summary.session_count, formatHours(summary.total_hours)])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teacher-hours-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <p className="muted">
        <Link to={home}>← Back</Link>
      </p>
      <div className="topbar" style={{ border: 'none', paddingBottom: 0 }}>
        <h1 style={{ margin: 0 }}>Teacher hours</h1>
        <button type="button" className="btn secondary" onClick={exportCsv} disabled={!summary?.teachers?.length}>
          Export CSV
        </button>
      </div>
      <p className="muted">Hours logged on class sessions this month. Check-mode scores are not counted.</p>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <section className="panel">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="hours-month">Month</label>
            <input
              id="hours-month"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                setSelectedTeacherId(null)
              }}
            />
          </div>
          <div className="field">
            <label>Totals</label>
            <p style={{ margin: '0.45rem 0 0' }}>
              <strong>{formatHours(summary?.total_hours || 0)}</strong> hours · {summary?.session_count || 0}{' '}
              classes
            </p>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Classes</th>
              <th>Hours</th>
              {isManager ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {!summary?.teachers?.length ? (
              <tr>
                <td colSpan={isManager ? 4 : 3} className="muted">
                  No teachers yet.
                </td>
              </tr>
            ) : (
              summary.teachers.map((row) => (
                <tr
                  key={row.teacher_id}
                  className={selectedTeacherId === row.teacher_id ? 'is-selected' : ''}
                >
                  <td>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        setSelectedTeacherId((id) => (id === row.teacher_id ? null : row.teacher_id))
                      }
                    >
                      {row.teacher?.full_name || 'Teacher'}
                    </button>
                  </td>
                  <td>{row.session_count}</td>
                  <td>{formatHours(row.total_hours)}</td>
                  {isManager ? (
                    <td>
                      <button
                        type="button"
                        className="btn ghost"
                        disabled={!hoursForTeacher(row.teacher_id).length}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTeacherMonthHours(row.teacher_id, row.teacher?.full_name)
                        }}
                      >
                        Delete hours
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {selectedTeacher ? (
        <section className="panel">
          <div className="topbar" style={{ border: 'none', padding: 0, marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>
              {selectedTeacher.teacher?.full_name} · {month}
            </h2>
            {isManager && teacherSessions.length ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  deleteTeacherMonthHours(selectedTeacher.teacher_id, selectedTeacher.teacher?.full_name)
                }
              >
                Delete hours
              </button>
            ) : null}
          </div>
          {!teacherSessions.length ? (
            <p className="muted">No timed classes this month.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Hours</th>
                  {isManager ? <th></th> : null}
                </tr>
              </thead>
              <tbody>
                {teacherSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.session_date || s.created_at).toLocaleDateString()}</td>
                    <td>{s.student_name}</td>
                    <td>
                      {s.course?.title || 'Course'}
                      {s.lesson?.unit_number != null ? ` · U${s.lesson.unit_number}` : ''}
                    </td>
                    <td>{formatHours(s.hours)}</td>
                    {isManager ? (
                      <td>
                        <button type="button" className="btn ghost" onClick={() => deleteHour(s)}>
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : (
        <p className="muted">Select a teacher to see their classes this month.</p>
      )}
    </div>
  )
}
