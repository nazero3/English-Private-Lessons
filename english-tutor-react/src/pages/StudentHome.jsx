import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { fmtDate, fmtPct, fmtScore } from '../lib/studentDisplay'

function SummaryCard({ label, value }) {
  return (
    <div className="score-card">
      <span className="muted">{label}</span>
      <strong>{fmtPct(value)}</strong>
    </div>
  )
}

export default function StudentHome() {
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [openLesson, setOpenLesson] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        setData(await api.getMyStudentPortal())
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [profile])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p className="muted">Loading your work…</p>

  const { student, sessions, scores, summary } = data

  return (
    <div className="student-dash">
      <header className="teacher-dash__hero">
        <div>
          <h1>Hello, {student.full_name}</h1>
          <p className="muted">
            Homework, notes, and scores from{' '}
            {student.teacher?.full_name || 'your teacher'}.
          </p>
        </div>
      </header>

      <section className="score-summary">
        <SummaryCard label="Overall" value={summary.overall_avg} />
        <SummaryCard label="Tests" value={summary.tests_avg} />
        <SummaryCard label="Quizzes" value={summary.quiz_avg} />
        <SummaryCard label="Homework" value={summary.homework_avg} />
      </section>

      <section className="panel">
        <h2>Lessons</h2>
        {!sessions.length ? (
          <p className="muted">No lessons yet. Your teacher will add homework and notes here.</p>
        ) : (
          <div className="session-list">
            {sessions.map((s) => {
              const open = openLesson === s.id
              return (
                <article key={s.id} className="session-card">
                  <div className="session-card__head">
                    <div>
                      <strong>{s.lesson?.theme || 'Lesson'}</strong>
                      <div className="muted" style={{ fontSize: '0.88rem' }}>
                        {fmtDate(s.session_date || s.created_at)}
                        {s.course?.title ? ` · ${s.course.title}` : ''}
                      </div>
                    </div>
                    <div className="badge">U{s.lesson?.unit_number ?? '—'}</div>
                  </div>

                  {s.notes ? (
                    <div className="session-card__block">
                      <span className="muted">Teacher notes</span>
                      <p>{s.notes}</p>
                    </div>
                  ) : (
                    <p className="muted">No notes for this lesson.</p>
                  )}

                  {s.homework_assigned ? (
                    <div className="session-card__block">
                      <span className="muted">Homework</span>
                      <p>{s.homework_assigned}</p>
                    </div>
                  ) : null}

                  {(s.worksheet_score != null || s.quiz_score != null || s.homework_score != null) && (
                    <p className="muted" style={{ fontSize: '0.88rem' }}>
                      Scores:
                      {s.worksheet_score != null
                        ? ` WS ${fmtScore(s.worksheet_score, s.worksheet_total)}`
                        : ''}
                      {s.quiz_score != null ? ` · Quiz ${fmtScore(s.quiz_score, s.quiz_total)}` : ''}
                      {s.homework_score != null
                        ? ` · HW ${fmtScore(s.homework_score, s.homework_total)}`
                        : ''}
                    </p>
                  )}

                  {s.homework?.length ? (
                    <>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setOpenLesson(open ? null : s.id)}
                      >
                        {open ? 'Hide exercises' : `Show ${s.homework.length} exercises`}
                      </button>
                      {open ? (
                        <ol className="homework-list">
                          {s.homework.map((item, idx) => (
                            <li key={item.id || idx}>
                              <span>{item.prompt}</span>
                              {item.type === 'mcq' && item.options?.length ? (
                                <ul>
                                  {item.options.map((opt) => (
                                    <li key={opt}>{opt}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Test scores</h2>
        {!scores.length ? (
          <p className="muted">No tests recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Score</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{fmtDate(row.test_date)}</td>
                  <td>
                    {fmtScore(row.score, row.total)}
                    {row.percent != null ? ` (${row.percent}%)` : ''}
                  </td>
                  <td>{row.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
