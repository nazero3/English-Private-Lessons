import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import {
  currentMonthValue,
  formatHours,
  groupHoursByStudent,
  monthBounds,
  sessionInMonth,
  studentHoursKey,
} from '../lib/hours'
import { homePath } from '../lib/permissions'
import { sortSessionsByEnteredAt } from '../lib/studentDisplay'

const HOUR_CHIPS = ['0.5', '1', '1.5', '2']

export default function HoursPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const canSeeTeachers = profile?.role === 'manager' || profile?.role === 'operations'
  const home = homePath(profile?.role)
  const location = useLocation()
  const atHome = location.pathname === home
  const [searchParams, setSearchParams] = useSearchParams()
  const view = !canSeeTeachers || searchParams.get('by') === 'students' ? 'students' : 'teachers'
  const [month, setMonth] = useState(currentMonthValue)
  const [summary, setSummary] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [selectedStudentKey, setSelectedStudentKey] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [hoursDraft, setHoursDraft] = useState('')

  const setView = (next) => {
    const nextParams = new URLSearchParams(searchParams)
    if (next === 'students' && canSeeTeachers) nextParams.set('by', 'students')
    else nextParams.delete('by')
    setSearchParams(nextParams, { replace: true })
    setEditingId('')
  }

  const showDetail = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('hours-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openTeacher = (teacherId) => {
    setSelectedTeacherId(teacherId)
    setEditingId('')
    showDetail()
  }

  const openStudent = (key) => {
    setSelectedStudentKey(key)
    setEditingId('')
    showDetail()
  }

  const fetchHoursData = useCallback(async () => {
    const { from, to } = monthBounds(month)
    if (canSeeTeachers) {
      const [hours, sessionRows] = await Promise.all([
        api.hoursSummary({ from, to }),
        api.listSessions(profile),
      ])
      return { hours, sessionRows }
    }
    return { hours: null, sessionRows: await api.listSessions(profile) }
  }, [profile, month, canSeeTeachers])

  const load = async () => {
    try {
      const { hours, sessionRows } = await fetchHoursData()
      setSummary(hours)
      setSessions(sessionRows)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { hours, sessionRows } = await fetchHoursData()
        if (cancelled) return
        setSummary(hours)
        setSessions(sessionRows)
        setError('')
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchHoursData])

  const bounds = useMemo(() => monthBounds(month), [month])
  const studentRows = useMemo(() => groupHoursByStudent(sessions, bounds), [sessions, bounds])
  const studentTotals = useMemo(
    () =>
      studentRows.reduce(
        (acc, row) => ({
          total_hours: acc.total_hours + row.total_hours,
          session_count: acc.session_count + row.session_count,
        }),
        { total_hours: 0, session_count: 0 },
      ),
    [studentRows],
  )

  const totalHours = canSeeTeachers ? summary?.total_hours || 0 : studentTotals.total_hours
  const totalClasses = canSeeTeachers ? summary?.session_count || 0 : studentTotals.session_count

  const teachers = summary?.teachers || []
  const selectedTeacher =
    teachers.find((t) => t.teacher_id === selectedTeacherId) ||
    teachers.find((t) => t.session_count > 0) ||
    teachers[0] ||
    null
  const selectedStudent =
    studentRows.find((row) => row.key === selectedStudentKey) || studentRows[0] || null
  const activeTeacherId = selectedTeacher?.teacher_id || null
  const activeStudentKey = selectedStudent?.key || null

  const hoursForTeacher = useCallback(
    (teacherId) => {
      if (!teacherId) return []
      return sessions.filter((s) => s.teacher_id === teacherId && sessionInMonth(s, bounds))
    },
    [sessions, bounds],
  )

  const teacherSessions = useMemo(
    () => [...hoursForTeacher(activeTeacherId)].sort(sortSessionsByEnteredAt),
    [hoursForTeacher, activeTeacherId],
  )

  const studentSessions = useMemo(() => {
    if (!activeStudentKey) return []
    return sessions
      .filter((s) => sessionInMonth(s, bounds) && studentHoursKey(s) === activeStudentKey)
      .sort(sortSessionsByEnteredAt)
  }, [sessions, bounds, activeStudentKey])

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
    if (view === 'students') {
      if (!studentRows.length) return
      const header = canSeeTeachers
        ? ['student', 'teacher', 'sessions', 'hours']
        : ['student', 'sessions', 'hours']
      const rows = studentRows.map((row) =>
        canSeeTeachers
          ? [row.student_name, row.teacher_label, row.session_count, formatHours(row.total_hours)]
          : [row.student_name, row.session_count, formatHours(row.total_hours)],
      )
      rows.push(
        canSeeTeachers
          ? ['Total', '', totalClasses, formatHours(totalHours)]
          : ['Total', totalClasses, formatHours(totalHours)],
      )
      const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-hours-${month}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
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

  const canExport = view === 'students' ? studentRows.length > 0 : Boolean(summary?.teachers?.length)

  const renderHoursCell = (s) => {
    if (isManager && editingId === s.id) {
      return (
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
      )
    }
    return formatHours(s.hours)
  }

  const renderManagerActions = (s) =>
    isManager ? (
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
    ) : null

  return (
    <div>
      {atHome ? null : (
        <p className="crumb">
          <Link to={home}>← Back</Link>
        </p>
      )}
      <header className="teacher-dash__hero">
        <div>
          <h1>{view === 'students' ? 'Hours by student' : 'Teacher hours'}</h1>
          <p className="muted">
            {view === 'students'
              ? 'This month’s hours for each student. Tap Details to see the classes behind that number.'
              : canSeeTeachers
                ? 'Hours each teacher logged this month. Use By student to split the same total by student.'
                : 'Hours logged on class sessions this month. Check-mode scores are not counted.'}
          </p>
        </div>
        <button type="button" className="btn secondary compact" onClick={exportCsv} disabled={!canExport}>
          Export CSV
        </button>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <section className="panel">
        <div className="hours-toolbar">
          <div className="field">
            <label htmlFor="hours-month">Month</label>
            <input
              id="hours-month"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                setSelectedTeacherId(null)
                setSelectedStudentKey(null)
                setEditingId('')
              }}
            />
          </div>
          <div className="hours-toolbar__side">
            <p className="hours-totals">
              <strong>{formatHours(totalHours)}</strong> hours · {totalClasses} classes
            </p>
            {canSeeTeachers ? (
              <div className="hours-view-switch" role="group" aria-label="How to group hours">
                <button
                  type="button"
                  className={`btn compact${view === 'teachers' ? '' : ' secondary'}`}
                  aria-pressed={view === 'teachers'}
                  onClick={() => setView('teachers')}
                >
                  By teacher
                </button>
                <button
                  type="button"
                  className={`btn compact${view === 'students' ? '' : ' secondary'}`}
                  aria-pressed={view === 'students'}
                  onClick={() => setView('students')}
                >
                  By student
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {view === 'teachers' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Classes</th>
                <th>Hours</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!summary?.teachers?.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No teachers yet.
                  </td>
                </tr>
              ) : (
                summary.teachers.map((row) => (
                  <tr
                    key={row.teacher_id}
                    className={activeTeacherId === row.teacher_id ? 'is-selected' : ''}
                  >
                    <td>{row.teacher?.full_name || 'Teacher'}</td>
                    <td>{row.session_count}</td>
                    <td>{formatHours(row.total_hours)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn secondary compact"
                        onClick={() => openTeacher(row.teacher_id)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                {canSeeTeachers ? <th>Teacher</th> : null}
                <th>Classes</th>
                <th>Hours</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!studentRows.length ? (
                <tr>
                  <td colSpan={canSeeTeachers ? 5 : 4} className="muted">
                    No timed classes this month.
                  </td>
                </tr>
              ) : (
                studentRows.map((row) => (
                  <tr key={row.key} className={activeStudentKey === row.key ? 'is-selected' : ''}>
                    <td>{row.student_name}</td>
                    {canSeeTeachers ? <td>{row.teacher_label}</td> : null}
                    <td>{row.session_count}</td>
                    <td>{formatHours(row.total_hours)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn secondary compact"
                        onClick={() => openStudent(row.key)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {view === 'teachers' && selectedTeacher ? (
        <section className="panel" id="hours-detail">
          <h2 style={{ marginTop: 0 }}>
            {selectedTeacher.teacher?.full_name} · {month}
          </h2>
          <p className="muted">
            {isManager
              ? 'These classes add up to the hours above. Edit or delete one if it was wrong or cancelled.'
              : 'These classes add up to the hours above.'}
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
                    <td>{renderHoursCell(s)}</td>
                    {renderManagerActions(s)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {view === 'students' && selectedStudent ? (
        <section className="panel" id="hours-detail">
          <h2 style={{ marginTop: 0 }}>
            {selectedStudent.student_name} · {month}
          </h2>
          <p className="muted">
            {formatHours(selectedStudent.total_hours)} hours from {selectedStudent.session_count}{' '}
            {selectedStudent.session_count === 1 ? 'class' : 'classes'}
            {canSeeTeachers && selectedStudent.teacher_label !== '—'
              ? ` · ${selectedStudent.teacher_label}`
              : ''}
            . These classes add up to that total.
          </p>
          {!studentSessions.length ? (
            <p className="muted">No timed classes this month.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  {canSeeTeachers ? <th>Teacher</th> : null}
                  <th>Course</th>
                  <th>Hours</th>
                  {isManager ? <th></th> : null}
                </tr>
              </thead>
              <tbody>
                {studentSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.session_date || s.created_at).toLocaleDateString()}</td>
                    {canSeeTeachers ? <td>{s.teacher?.full_name || '—'}</td> : null}
                    <td>
                      {s.course?.title || 'Course'}
                      {s.lesson?.unit_number != null ? ` · U${s.lesson.unit_number}` : ''}
                    </td>
                    <td>{renderHoursCell(s)}</td>
                    {renderManagerActions(s)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {view === 'teachers' && !selectedTeacher ? (
        <p className="muted">Tap Details on a teacher to see their classes this month.</p>
      ) : null}
    </div>
  )
}
