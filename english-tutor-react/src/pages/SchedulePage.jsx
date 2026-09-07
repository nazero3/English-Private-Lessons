import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { homePath } from '../lib/permissions'
import {
  ALLOWED_DURATIONS,
  DEFAULT_DURATION_MINUTES,
  WEEKDAYS,
  colorForStudent,
  downloadBlob,
  formatClock,
  timeStarts,
  weeklyHours,
} from '../lib/scheduleGrid'

export default function SchedulePage() {
  const { profile } = useAuth()
  const home = homePath(profile?.role)
  const studentsPath = profile?.role === 'manager' ? '/manager/students' : '/operations/students'
  const [overview, setOverview] = useState(null)
  const [teacherId, setTeacherId] = useState('')
  const [detail, setDetail] = useState(null)
  const [studentId, setStudentId] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION_MINUTES)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const starts = timeStarts(detail?.time_starts || overview?.time_starts)
  const weekdays = detail?.weekdays || overview?.weekdays || WEEKDAYS
  const teachers = overview?.teachers || []
  const students = detail?.students || []
  const slots = detail?.slots || []

  const loadOverview = async (preferredTeacherId) => {
    const data = await api.getSchedules()
    setOverview(data)
    const rows = data.teachers || []
    setTeacherId((current) => {
      const next = preferredTeacherId || current
      if (next && rows.some((row) => row.teacher_id === next)) return next
      return rows[0]?.teacher_id || ''
    })
    return data
  }

  const loadTeacher = async (id) => {
    if (!id) {
      setDetail(null)
      return
    }
    const data = await api.getTeacherSchedule(id)
    setDetail(data)
    setStudentId((current) => {
      if (current && (data.students || []).some((student) => student.id === current)) return current
      return data.students?.[0]?.id || ''
    })
    return data
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        await loadOverview()
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile])

  useEffect(() => {
    if (!teacherId) return
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        await loadTeacher(teacherId)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [teacherId])

  const selectedStudent = students.find((student) => student.id === studentId)
  const teacherName = detail?.teacher?.full_name || teachers.find((row) => row.teacher_id === teacherId)?.teacher?.full_name

  const occupancy = useMemo(() => {
    const map = new Map()
    for (const slot of detail?.slots || []) {
      const ticks = slot.duration_minutes / 30
      for (let i = 0; i < ticks; i += 1) {
        map.set(`${slot.weekday}-${slot.start_minutes + i * 30}`, slot)
      }
    }
    return map
  }, [detail])

  const paintCell = async (weekday, startMinutes) => {
    const existing = occupancy.get(`${weekday}-${startMinutes}`)
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (existing) {
        await api.deleteScheduleSlot(existing.id)
        setMessage('Slot cleared.')
      } else {
        if (!studentId) {
          setError('Pick a student, then tap an empty time.')
          return
        }
        const remaining = starts.filter((minute) => minute >= startMinutes).length
        const nextDuration = Math.min(duration, remaining * 30)
        await api.addScheduleSlot(teacherId, {
          student_id: studentId,
          weekday,
          start_minutes: startMinutes,
          duration_minutes: nextDuration,
          color: colorForStudent(slots, studentId),
        })
        setMessage('Class added.')
      }
      await Promise.all([loadTeacher(teacherId), loadOverview(teacherId)])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const exportExcel = async () => {
    setError('')
    setMessage('')
    try {
      const { blob, filename } = await api.exportTeacherScheduleExcel(teacherId)
      downloadBlob(blob, filename)
      setMessage('Excel file downloaded.')
    } catch (err) {
      setError(err.message)
    }
  }

  const onKeyCell = (event, weekday, startMinutes) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!busy) paintCell(weekday, startMinutes)
    }
  }

  return (
    <div className="schedule-page">
      <p className="crumb">
        <Link to={home}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>Weekly schedule</h1>
          <p className="muted">
            Paint each teacher’s Sat–Thu chart, then export Excel or print a hard copy. Times run from 12:00 to
            10:00.
          </p>
        </div>
        <div className="schedule-page__tools no-print">
          <button type="button" className="btn secondary compact" onClick={exportExcel} disabled={!teacherId || busy}>
            Export Excel
          </button>
          <button type="button" className="btn compact" onClick={() => window.print()} disabled={!teacherId}>
            Print / PDF
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success no-print">{message}</p> : null}

      <section className="panel no-print">
        <div className="field">
          <span className="schedule-label">Teacher</span>
          {!teachers.length ? (
            <p className="muted">No teachers yet. Ask a manager to add teacher logins.</p>
          ) : (
            <div className="schedule-teachers">
              {teachers.map((row) => (
                <button
                  key={row.teacher_id}
                  type="button"
                  className={`schedule-teacher${teacherId === row.teacher_id ? ' is-on' : ''}`}
                  onClick={() => setTeacherId(row.teacher_id)}
                >
                  <strong>{row.teacher?.full_name || 'Teacher'}</strong>
                  <span>
                    {row.weekly_hours || 0} h/week · {row.student_count} students
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {teacherId ? (
        <section className="panel">
          <div className="schedule-toolbar no-print">
            <div>
              <h2 style={{ margin: 0 }}>{teacherName}</h2>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                {weeklyHours(slots)} planned hours this week
              </p>
            </div>
            <div className="hour-chips" role="group" aria-label="Class length">
              {ALLOWED_DURATIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`hour-chip${duration === mins ? ' is-on' : ''}`}
                  onClick={() => setDuration(mins)}
                >
                  {mins === 60 ? '1 hour' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>

          {!students.length ? (
            <p className="notice no-print">
              This teacher has no students yet.{' '}
              <Link to={studentsPath}>Assign students</Link> first, then come back to fill the chart.
            </p>
          ) : (
            <div className="schedule-palette no-print" role="listbox" aria-label="Students">
              {students.map((student) => {
                const color = colorForStudent(slots, student.id)
                return (
                  <button
                    key={student.id}
                    type="button"
                    role="option"
                    aria-selected={studentId === student.id}
                    className={`schedule-chip${studentId === student.id ? ' is-on' : ''}`}
                    style={{ '--chip': color }}
                    onClick={() => setStudentId(student.id)}
                  >
                    {student.full_name}
                  </button>
                )
              })}
            </div>
          )}

          {selectedStudent ? (
            <p className="muted no-print">
              Selected: {selectedStudent.full_name}. Tap an empty cell to place them, or tap a filled cell to clear it.
            </p>
          ) : null}

          <div className="timetable-wrap">
            <table className="timetable" dir="rtl">
              <caption className="visually-hidden">
                Weekly schedule for {teacherName || 'teacher'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">الوقت</th>
                  {weekdays.map((day) => (
                    <th key={day.id} scope="col">
                      <span className="timetable__ar">{day.ar}</span>
                      <span className="timetable__en">{day.en}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {starts.map((minute) => (
                  <tr key={minute}>
                    <th scope="row">{formatClock(minute)}</th>
                    {weekdays.map((day) => {
                      const key = `${day.id}-${minute}`
                      const slot = occupancy.get(key)
                      if (slot && slot.start_minutes !== minute) return null
                      const span = slot ? slot.duration_minutes / 30 : 1
                      const label = slot
                        ? slot.label || `${slot.student_name} / ${teacherName}`
                        : `Empty ${day.en} ${formatClock(minute)}`
                      return (
                        <td
                          key={day.id}
                          rowSpan={span > 1 ? span : undefined}
                          className={slot ? 'is-filled' : 'is-empty'}
                          style={slot ? { background: slot.color } : undefined}
                        >
                          <button
                            type="button"
                            className="timetable__cell"
                            disabled={busy || (!slot && !studentId)}
                            aria-label={slot ? `Clear ${label}` : `Place ${selectedStudent?.full_name || 'student'} at ${label}`}
                            onClick={() => paintCell(day.id, minute)}
                            onKeyDown={(event) => onKeyCell(event, day.id, minute)}
                          >
                            {slot ? (
                              <>
                                <strong>{slot.student_name}</strong>
                                <span>{teacherName}</span>
                              </>
                            ) : (
                              <span className="timetable__ghost">+</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
