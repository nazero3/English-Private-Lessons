import { useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import {
  FOCUS_NOTE_PRESETS,
  PERFORMANCE_NOTE_PRESETS,
  hoursFromDurationMs,
} from '../../lib/lessonNotePresets'
import {
  buildLogCourses,
  unitsForLogCourse,
} from '../../lib/logClassCatalog'

const HOUR_CHIPS = ['0.5', '1', '1.5', '2']

function packUnits(lessons) {
  return (lessons || []).map((l) => ({
    id: l.id,
    label: `${l.unit_number}. ${l.theme}`,
    unit_number: l.unit_number,
    theme: l.theme,
  }))
}

function hoursInput(value) {
  if (value == null || value === '') return '1'
  const n = Number(value)
  if (!Number.isFinite(n)) return '1'
  return Number.isInteger(n) ? String(n) : String(n)
}

function formatClock(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function elapsedLabel(startedAt) {
  if (!startedAt) return ''
  const ms = Date.now() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ''
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min`
  return `${h}h ${m}m`
}

function NoteChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="field">
      <span className="log-class__label">{label}</span>
      <div className="note-chips">
        {options.map((tag) => {
          const on = selected.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              className={`note-chip${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onToggle(tag)}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function LessonPresencePanel({ profile, onSaved }) {
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')
  const [active, setActive] = useState(null)
  const [wrapping, setWrapping] = useState(false)
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [tick, setTick] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const courseRequest = useRef(0)
  const [form, setForm] = useState({
    course_key: '',
    lesson_id: '',
    hours: '1',
    note_tags: [],
    notes: '',
    homework_assigned: '',
  })

  const load = async () => {
    const [packRows, studentRows, activeRow] = await Promise.all([
      api.listCourses(profile),
      api.listStudents(profile),
      api.getActiveSession(),
    ])
    const catalog = buildLogCourses(packRows, profile)
    setCourses(catalog)
    setStudents(studentRows)
    setActive(activeRow || null)
    setStudentId((prev) => {
      if (prev && studentRows.some((s) => s.id === prev)) return prev
      return studentRows[0]?.id || ''
    })
    if (!activeRow) setWrapping(false)
  }

  useEffect(() => {
    ;(async () => {
      try {
        await load()
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [profile?.id])

  useEffect(() => {
    if (!active?.started_at || wrapping) return undefined
    const id = window.setInterval(() => setTick((n) => n + 1), 30000)
    return () => window.clearInterval(id)
  }, [active?.started_at, wrapping])

  const applyCourse = async (courseKey, catalog) => {
    const course = catalog.find((c) => c.key === courseKey)
    if (!course) {
      setLessons([])
      setForm((prev) => ({ ...prev, course_key: '', lesson_id: '' }))
      return
    }
    const requestId = courseRequest.current + 1
    courseRequest.current = requestId
    setLessons([])
    setForm((prev) => ({ ...prev, course_key: courseKey, lesson_id: '' }))
    try {
      const units =
        course.kind === 'pack' ? packUnits(await api.listLessons(course.id)) : unitsForLogCourse(course)
      if (requestId !== courseRequest.current) return
      setLessons(units)
      setForm((prev) => ({
        ...prev,
        course_key: courseKey,
        lesson_id: units[0]?.id || '',
      }))
    } catch (err) {
      if (requestId !== courseRequest.current) return
      setLessons([])
      setForm((prev) => ({ ...prev, course_key: courseKey, lesson_id: '' }))
      setError(err.message || 'Could not load lessons for this course')
    }
  }

  const beginWrapUp = async () => {
    setError('')
    setMessage('')
    const suggested = hoursInput(
      hoursFromDurationMs(Date.now() - new Date(active.started_at || active.created_at).getTime()),
    )
    setForm({
      course_key: '',
      lesson_id: '',
      hours: suggested,
      note_tags: [],
      notes: '',
      homework_assigned: '',
    })
    setWrapping(true)
    if (courses[0]) {
      await applyCourse(courses[0].key, courses)
      setForm((prev) => ({ ...prev, hours: suggested }))
    }
  }

  const toggleTag = (tag) => {
    setForm((prev) => {
      const on = prev.note_tags.includes(tag)
      return {
        ...prev,
        note_tags: on ? prev.note_tags.filter((t) => t !== tag) : [...prev.note_tags, tag],
      }
    })
  }

  const startLesson = async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (!studentId) throw new Error('Pick a student from the roster')
      const row = await api.startSession({ student_id: studentId })
      setActive(row)
      setMessage(`Lesson started with ${row.student_name}.`)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const cancelLesson = async () => {
    if (!active) return
    const ok = window.confirm(
      `Cancel the lesson with ${active.student_name}? No hours will be logged.`,
    )
    if (!ok) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await api.deleteSession(active.id)
      setActive(null)
      setWrapping(false)
      setMessage('Lesson cancelled.')
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const saveWrapUp = async (e) => {
    e.preventDefault()
    if (!active) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const course = courses.find((c) => c.key === form.course_key)
      if (!course) throw new Error('Choose a course')
      const unit = lessons.find((l) => String(l.id) === String(form.lesson_id))
      if (!unit) throw new Error('Choose a lesson unit')
      const hours = Number(form.hours)
      if (!Number.isFinite(hours) || hours < 0.5) throw new Error('Hours must be at least 0.5')

      const payload = {
        note_tags: form.note_tags,
        notes: form.notes.trim(),
        homework_assigned: form.homework_assigned.trim(),
        hours,
      }
      if (course.kind === 'pack') {
        payload.lesson_id = form.lesson_id
      } else {
        payload.curriculum = course.curriculum
        payload.course_title = course.title
        payload.unit_label = unit.theme || unit.label
        payload.unit_number = unit.unit_number
      }

      const row = await api.endSession(active.id, payload)
      setActive(null)
      setWrapping(false)
      setMessage(`Logged ${hours} hour${hours === 1 ? '' : 's'} for ${row.student_name}.`)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  void tick

  if (wrapping && active) {
    return (
      <form className="log-class lesson-presence" onSubmit={saveWrapUp}>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        <p className="lesson-presence__banner">
          Ending lesson with <strong>{active.student_name}</strong>
          <span className="muted"> · started {formatClock(active.started_at)}</span>
        </p>

        <NoteChipGroup
          label="How did they do?"
          options={PERFORMANCE_NOTE_PRESETS}
          selected={form.note_tags}
          onToggle={toggleTag}
        />
        <NoteChipGroup
          label="What did you teach?"
          options={FOCUS_NOTE_PRESETS}
          selected={form.note_tags}
          onToggle={toggleTag}
        />

        <div className="field">
          <label htmlFor="presence-notes">Add your own note</label>
          <textarea
            id="presence-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="field">
          <label htmlFor="presence-hw">Homework</label>
          <textarea
            id="presence-hw"
            value={form.homework_assigned}
            onChange={(e) => setForm({ ...form, homework_assigned: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="log-class__row">
          <div className="field">
            <label htmlFor="presence-course">Course</label>
            <select
              id="presence-course"
              value={form.course_key}
              onChange={(e) => {
                setError('')
                applyCourse(e.target.value, courses)
              }}
              required
            >
              {!courses.length ? <option value="">No courses enabled</option> : null}
              {courses.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="presence-unit">Unit</label>
            <select
              id="presence-unit"
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

        <div className="field">
          <span className="log-class__label">Hours (from lesson time)</span>
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
              step="0.25"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              aria-label="Custom hours"
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn log-class__save" type="submit" disabled={busy || !courses.length}>
            {busy ? 'Saving…' : 'Save lesson'}
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => setWrapping(false)}
          >
            Back
          </button>
        </div>
      </form>
    )
  }

  if (active) {
    return (
      <div className="lesson-presence">
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        <div className="lesson-presence__live">
          <span className="lesson-presence__badge is-on">In lesson</span>
          <div>
            <p className="lesson-presence__who">{active.student_name}</p>
            <p className="muted">
              Started {formatClock(active.started_at)}
              {elapsedLabel(active.started_at) ? ` · ${elapsedLabel(active.started_at)}` : ''}
            </p>
          </div>
        </div>
        <div className="actions">
          <button className="btn" type="button" disabled={busy} onClick={beginWrapUp}>
            End lesson
          </button>
          <button className="btn text-danger" type="button" disabled={busy} onClick={cancelLesson}>
            Cancel lesson
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lesson-presence">
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="field">
        <label htmlFor="presence-student">Student</label>
        <select
          id="presence-student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={!students.length}
        >
          {!students.length ? <option value="">No students yet</option> : null}
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        {!students.length ? (
          <p className="muted log-class__hint">
            Operations adds students to your roster. You can start a lesson after one is assigned.
          </p>
        ) : null}
      </div>

      <div className="actions">
        <button
          className="btn log-class__save"
          type="button"
          disabled={busy || !students.length || !studentId}
          onClick={startLesson}
        >
          {busy ? 'Starting…' : 'Start lesson'}
        </button>
      </div>
    </div>
  )
}
