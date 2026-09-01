import { useEffect, useState } from 'react'

import { api } from '../../lib/api'
import {
  buildLogCourses,
  courseKeyFromSession,
  unitIdFromSession,
  unitsForLogCourse,
} from '../../lib/logClassCatalog'

function todayInputValue() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDateInput(value) {
  if (!value) return todayInputValue()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function hoursInput(value) {
  if (value == null || value === '') return '1'
  const n = Number(value)
  if (!Number.isFinite(n)) return '1'
  return Number.isInteger(n) ? String(n) : String(n)
}

const HOUR_CHIPS = ['0.5', '1', '1.5', '2']
const NEW_STUDENT = '__new__'

function packUnits(lessons) {
  return (lessons || []).map((l) => ({
    id: l.id,
    label: `${l.unit_number}. ${l.theme}`,
    unit_number: l.unit_number,
    theme: l.theme,
  }))
}

export default function LogClassForm({ profile, onSaved, editingSession = null, onCancel }) {
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    student_name: '',
    course_key: '',
    lesson_id: '',
    session_date: todayInputValue(),
    hours: '1',
    notes: '',
    homework_assigned: '',
  })

  const applyCourse = async (courseKey, catalog, session = null) => {
    const course = catalog.find((c) => c.key === courseKey)
    if (!course) {
      setLessons([])
      setForm((prev) => ({ ...prev, course_key: '', lesson_id: '' }))
      return
    }
    try {
      const units =
        course.kind === 'pack' ? packUnits(await api.listLessons(course.id)) : unitsForLogCourse(course)
      setLessons(units)
      setForm((prev) => ({
        ...prev,
        course_key: courseKey,
        lesson_id: session ? unitIdFromSession(session, units) : units[0]?.id || '',
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  const loadRoster = async () => {
    const [packRows, studentRows] = await Promise.all([
      api.listCourses(profile),
      api.listStudents(profile),
    ])
    const catalog = buildLogCourses(packRows, profile)
    setCourses(catalog)
    setStudents(studentRows)
    if (editingSession) {
      const key = courseKeyFromSession(editingSession, catalog)
      setForm((prev) => ({
        ...prev,
        student_id:
          editingSession.student_id && studentRows.some((s) => s.id === editingSession.student_id)
            ? editingSession.student_id
            : studentRows[0]?.id || NEW_STUDENT,
        student_name: editingSession.student_name || '',
        hours: hoursInput(editingSession.hours),
        session_date: toDateInput(editingSession.session_date || editingSession.created_at),
        notes: editingSession.notes || '',
        homework_assigned: editingSession.homework_assigned || '',
      }))
      if (key) await applyCourse(key, catalog, editingSession)
      setShowMore(Boolean(editingSession.notes || editingSession.homework_assigned))
      return
    }
    setForm((prev) => {
      const stillThere = prev.student_id && studentRows.some((s) => s.id === prev.student_id)
      return {
        ...prev,
        student_id: stillThere ? prev.student_id : studentRows[0]?.id || NEW_STUDENT,
        student_name: stillThere ? prev.student_name : '',
      }
    })
    if (catalog[0]) {
      await applyCourse(catalog[0].key, catalog)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadRoster()
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [profile, editingSession?.id])

  const onCourseChange = (courseKey) => {
    setError('')
    applyCourse(courseKey, courses)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const course = courses.find((c) => c.key === form.course_key)
      if (!course) throw new Error('Choose a course')
      const unit = lessons.find((l) => String(l.id) === String(form.lesson_id))
      if (!unit) throw new Error('Choose a lesson unit')

      let studentId = form.student_id
      let name = form.student_name.trim()
      if (studentId && studentId !== NEW_STUDENT) {
        const row = students.find((s) => s.id === studentId)
        name = row?.full_name || name
        if (!name) throw new Error('Choose a student')
      } else {
        if (!name) throw new Error('Choose a student')
        if (profile?.role === 'manager') {
          throw new Error('Pick a student from the list')
        }
        const created = await api.createStudent(profile, name)
        studentId = created?.id
      }

      const hours = Number(form.hours)
      if (!Number.isFinite(hours) || hours < 0.5) throw new Error('Hours must be at least 0.5')

      const payload = {
        teacher_id: profile.id,
        student_id: studentId && studentId !== NEW_STUDENT ? studentId : undefined,
        student_name: name,
        notes: form.notes.trim(),
        homework_assigned: form.homework_assigned.trim(),
        hours,
        session_date: new Date(`${form.session_date}T12:00:00`).toISOString(),
      }
      if (course.kind === 'pack') {
        payload.lesson_id = form.lesson_id
      } else {
        payload.curriculum = course.curriculum
        payload.course_title = course.title
        payload.unit_label = unit.theme || unit.label
        payload.unit_number = unit.unit_number
        if (editingSession) payload.lesson_id = null
      }

      if (editingSession) {
        await api.updateSession(editingSession.id, payload)
        setMessage(`Updated ${hours} hour${hours === 1 ? '' : 's'} for ${name}.`)
      } else {
        await api.createSession(payload)
        setForm((prev) => ({
          ...prev,
          student_name: prev.student_id === NEW_STUDENT ? '' : prev.student_name,
          notes: '',
          homework_assigned: '',
          hours: '1',
          session_date: todayInputValue(),
        }))
        setMessage(`Saved ${hours} hour${hours === 1 ? '' : 's'} for ${name}.`)
      }
      const studentRows = await api.listStudents(profile)
      setStudents(studentRows)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const addingNewStudent = form.student_id === NEW_STUDENT || !students.length

  return (
    <form className="log-class" onSubmit={submit}>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="log-class__row">
        <div className="field">
          <label htmlFor="log-student">Student</label>
          {students.length ? (
            <select
              id="log-student"
              value={form.student_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  student_id: e.target.value,
                  student_name: e.target.value === NEW_STUDENT ? '' : form.student_name,
                })
              }
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
              <option value={NEW_STUDENT}>Someone new…</option>
            </select>
          ) : (
            <input
              id="log-student"
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_id: NEW_STUDENT, student_name: e.target.value })}
              placeholder="Type a name"
              required
              autoComplete="off"
            />
          )}
          {addingNewStudent && students.length ? (
            <input
              className="log-class__new-student"
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
              placeholder="New student name"
              required
              autoComplete="off"
            />
          ) : null}
          {!students.length ? (
            <p className="muted log-class__hint">
              This list is your roster. Add students under Students, or type a name here.
            </p>
          ) : null}
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
            value={form.course_key}
            onChange={(e) => onCourseChange(e.target.value)}
            required
          >
            {!courses.length ? <option value="">No courses enabled</option> : null}
            {courses.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
              </option>
            ))}
          </select>
          {!courses.length ? (
            <p className="muted log-class__hint">
              Ask your manager to assign an English pack or turn on English File, Math, or Physics.
            </p>
          ) : null}
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
                {l.label}
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

      <div className="actions">
        <button className="btn log-class__save" type="submit" disabled={busy || !courses.length}>
          {busy ? 'Saving…' : editingSession ? 'Save changes' : 'Save class'}
        </button>
        {editingSession && onCancel ? (
          <button className="btn secondary" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
