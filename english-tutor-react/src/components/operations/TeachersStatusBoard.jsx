import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../../lib/api'
import { formatNoteTags } from '../../lib/lessonNotePresets'
import { clipText } from '../../lib/studentDisplay'

const POLL_MS = 25000

function formatClock(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function lastNotesLine(last) {
  if (!last) return ''
  const tags = formatNoteTags(last.note_tags)
  if (tags) return tags
  return clipText(last.notes, 100)
}

export default function TeachersStatusBoard({ sessionsPath = '/operations/sessions' }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const data = await api.teachersStatus()
      setRows(data?.teachers || [])
      setUpdatedAt(new Date())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const inLessonCount = rows.filter((r) => r.status === 'in_lesson').length

  return (
    <section className="panel teachers-status">
      <div className="teachers-status__head">
        <div>
          <h2>Teachers status</h2>
          <p className="muted">
            {inLessonCount
              ? `${inLessonCount} in lesson now`
              : 'No one in a lesson right now'}
            {updatedAt ? ` · updated ${formatClock(updatedAt.toISOString())}` : ''}
          </p>
        </div>
        <button type="button" className="btn secondary compact" onClick={load} disabled={busy}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {!rows.length && !error ? <p className="muted">No teachers yet.</p> : null}

      {rows.length ? (
        <ul className="teachers-status__list">
          {rows.map((row) => {
            const inLesson = row.status === 'in_lesson'
            const active = row.active_session
            const last = row.last_session
            const notes = lastNotesLine(last)
            return (
              <li key={row.teacher_id} className="teachers-status__row">
                <div className="teachers-status__main">
                  <strong>{row.teacher?.full_name || 'Teacher'}</strong>
                  <span className={`lesson-presence__badge${inLesson ? ' is-on' : ''}`}>
                    {inLesson ? 'In lesson' : 'Free'}
                  </span>
                </div>
                {inLesson && active ? (
                  <p className="teachers-status__detail">
                    With {active.student_name} · since {formatClock(active.started_at)}
                  </p>
                ) : null}
                {notes ? (
                  <p className="teachers-status__notes muted">
                    Last notes
                    {last?.student_name ? ` (${last.student_name})` : ''}: {notes}
                    {last?.session_id ? (
                      <>
                        {' · '}
                        <Link to={`${sessionsPath}?session=${last.session_id}`}>View</Link>
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="teachers-status__notes muted">No completed lesson notes yet.</p>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
