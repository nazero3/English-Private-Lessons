import { useEffect, useMemo, useState } from 'react'

import { api } from '../../lib/api'

function todayInputValue() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const HOUR_CHIPS = ['0.5', '1', '1.5', '2']

export default function LogClassForm({ profile, onSaved }) {
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [form, setForm] = useState({
    student_name: '',
    course_id: '',
    lesson_id: '',
    session_date: todayInputValue(),
    hours: '1',
    notes: '',
    homework_assigned: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [courseRows, studentRows] = await Promise.all([
          api.listCourses(profile),
          api.listStudents(profile),
        ])
        setCourses(courseRows)
        setStudents(studentRows)
        if (courseRows[0]) {
          const lessonRows = await api.listLessons(courseRows[0].id)
          setLessons(lessonRows)
          setForm((prev) => ({
            ...prev,
            course_id: prev.course_id || courseRows[0].id,
            lesson_id: prev.lesson_id || lessonRows[0]?.id || '',
          }))
        }
      } catch (e) {
        setError(e.message)
      }
    })()
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

  const studentOptions = useMemo(() => students.map((s) => s.full_name), [students])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const name = form.student_name.trim()
      if (!name) throw new Error('Choose a student')
      if (!form.lesson_id) throw new Error('Choose a lesson unit')
      const hours = Number(form.hours)
      if (!Number.isFinite(hours) || hours < 0.5) throw new Error('Hours must be at least 0.5')

      const created = await api.createStudent(profile, name)
      await api.createSession({
        teacher_id: profile.id,
        lesson_id: form.lesson_id,
        student_id: created?.id,
        student_name: name,
        notes: form.notes.trim(),
        homework_assigned: form.homework_assigned.trim(),
        hours,
        session_date: new Date(`${form.session_date}T12:00:00`).toISOString(),
      })
      setForm((prev) => ({
        ...prev,
        student_name: '',
        notes: '',
        homework_assigned: '',
        hours: '1',
        session_date: todayInputValue(),
      }))
      setMessage(`Saved ${hours} hour${hours === 1 ? '' : 's'} for ${name}.`)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="log-class" onSubmit={submit}>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="log-class__row">
        <div className="field">
          <label htmlFor="log-student">Student</label>
          <input
            id="log-student"
            list="log-student-options"
            value={form.student_name}
            onChange={(e) => setForm({ ...form, student_name: e.target.value })}
            placeholder="Name"
            required
            autoComplete="off"
          />
          <datalist id="log-student-options">
            {studentOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="log-date">Date</label>
          <input
            id="log-date"
            type="date"
            value={form.session_date}
            onChange={(e) => setForm({ ...form, session_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="log-class__label">Hours taught</span>
        <div className="hour-chips">
          {HOUR_CHIPS.map((value) => (
            <button
              key={value}
              type="button"
              className={`hour-chip ${form.hours === value ? 'is-on' : ''}`}
              onClick={() => setForm({ ...form, hours: value })}
            >
              {value}
            </button>
          ))}
          <input
            className="hour-chip__custom"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            aria-label="Custom hours"
          />
        </div>
      </div>

      <div className="log-class__row">
        <div className="field">
          <label htmlFor="log-course">Course</label>
          <select
            id="log-course"
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
          <label htmlFor="log-lesson">Unit</label>
          <select
            id="log-lesson"
            value={form.lesson_id}
            onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}
            required
          >
            {!lessons.length ? <option value="">Choose a course first</option> : null}
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.unit_number}. {l.theme}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="btn ghost log-class__more"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? 'Hide notes' : 'Add notes or homework'}
      </button>

      {showMore ? (
        <>
          <div className="field">
            <label htmlFor="log-notes">Notes</label>
            <textarea
              id="log-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="field">
            <label htmlFor="log-hw">Homework</label>
            <textarea
              id="log-hw"
              value={form.homework_assigned}
              onChange={(e) => setForm({ ...form, homework_assigned: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </>
      ) : null}

      <button className="btn log-class__save" type="submit" disabled={busy || !courses.length}>
        {busy ? 'Saving…' : 'Save class'}
      </button>
    </form>
  )
}
