import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { homePath } from '../lib/permissions'

const HOUR_CHIPS = ['0.5', '1', '1.5', '2']

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
  const [busyId, setBusyId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [hoursDraft, setHoursDraft] = useState('')

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

  useEffect(() => {
    const teachers = summary?.teachers || []
    if (!teachers.length) {
      setSelectedTeacherId(null)
      return
    }
    setSelectedTeacherId((id) => {
      if (id && teachers.some((t) => t.teacher_id === id)) return id
      const withHours = teachers.find((t) => t.session_count > 0)
      return (withHours || teachers[0]).teacher_id
    })
  }, [summary])

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
      `Remove ${formatHours(session.hours)} hours for ${session.student_name} on ${when}? Use this if the class was cancelled or postponed.`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    setBusyId(session.id)
    try {
      await api.deleteSession(session.id)
      if (editingId === session.id) setEditingId('')
      await load()
      setMessage('Class removed.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
    }
  }

  const startEditHours = (session) => {
    setEditingId(session.id)
    setHoursDraft(formatHours(session.hours))
    setError('')
    setMessage('')
  }

  const saveHours = async (session) => {
    const n = Number(hoursDraft)
    if (!Number.isFinite(n) || n < 0.5) {
      setError('Hours must be at least 0.5.')
      return
    }
    setBusyId(session.id)
    setError('')
    setMessage('')
    try {
      await api.updateSession(session.id, { hours: n })
      setEditingId('')
      await load()
      setMessage('Hours updated.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
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
      <p className="crumb">
        <Link to={home}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>Teacher hours</h1>
          <p className="muted">
            {isManager
              ? 'Open a teacher, then change or remove one class. Cancelled lessons should be deleted, not the whole month.'
              : 'Hours logged on class sessions this month. Check-mode scores are not counted.'}
          </p>
        </div>
        <button type="button" className="btn secondary compact" onClick={exportCsv} disabled={!summary?.teachers?.length}>
          Export CSV
        </button>
      </header>
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
                setEditingId('')
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
            </tr>
          </thead>
          <tbody>
            {!summary?.teachers?.length ? (
              <tr>
                <td colSpan={3} className="muted">
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
                      className="table-link"
                      onClick={() => {
                        setSelectedTeacherId(row.teacher_id)
                        setEditingId('')
                      }}
                    >
                      {row.teacher?.full_name || 'Teacher'}
                    </button>
                  </td>
                  <td>{row.session_count}</td>
                  <td>{formatHours(row.total_hours)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {selectedTeacher ? (
        <section className="panel">
          <h2 style={{ marginTop: 0 }}>
            {selectedTeacher.teacher?.full_name} · {month}
          </h2>
          <p className="muted">
            {isManager
              ? 'Edit the hours for one class, or delete it if it was cancelled or postponed.'
              : 'Classes counted in this month’s total.'}
          </p>
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
                    <td>
                      {isManager && editingId === s.id ? (
                        <div className="hour-chips">
                          {HOUR_CHIPS.map((h) => (
                            <button
                              key={h}
                              type="button"
                              className={`hour-chip${hoursDraft === h ? ' is-on' : ''}`}
                              onClick={() => setHoursDraft(h)}
                            >
                              {h}
                            </button>
                          ))}
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={hoursDraft}
                            onChange={(e) => setHoursDraft(e.target.value)}
                            aria-label="Hours"
                            style={{ width: '4.5rem' }}
                          />
                        </div>
                      ) : (
                        formatHours(s.hours)
                      )}
                    </td>
                    {isManager ? (
                      <td>
                        <div className="person-row__tools">
                          {editingId === s.id ? (
                            <>
                              <button
                                type="button"
                                className="table-link"
                                disabled={Boolean(busyId)}
                                onClick={() => saveHours(s)}
                              >
                                Save
                              </button>
                              <button type="button" className="table-link" onClick={() => setEditingId('')}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="table-link"
                              disabled={Boolean(busyId)}
                              onClick={() => startEditHours(s)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn text-danger"
                            disabled={Boolean(busyId)}
                            onClick={() => deleteHour(s)}
                          >
                            {busyId === s.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
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
