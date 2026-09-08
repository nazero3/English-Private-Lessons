import { useState } from 'react'
import ChildSwitcher from '../components/ChildSwitcher.jsx'
import ScoreChips from '../components/ScoreChips.jsx'
import { useAuth } from '../lib/auth.jsx'
import { fmtDate, fmtScore } from '../lib/format'
import { useSelectedChild } from '../lib/useSelectedChild'

export default function ChildPage() {
  const { family } = useAuth()
  const { childrenList, child, selectChild } = useSelectedChild(family?.children)
  const [open, setOpen] = useState(null)
  const last = child?.sessions?.[0]

  if (!child) {
    return <p className="muted">لم يُربط ابن بعد. اطلب من المركز ربط رقمك بسجل الطالب.</p>
  }

  return (
    <div>
      <ChildSwitcher childrenList={childrenList} currentId={child.student?.id} onChange={selectChild} />
      <h1 style={{ marginTop: '0.8rem' }}>{child.student?.full_name}</h1>
      <p className="muted">المعلّم: {child.student?.teacher?.full_name || '—'}</p>
      {last?.homework_assigned && last.homework_score == null ? (
        <section className="panel need-card">
          <p className="welcome-kicker">يحتاج متابعتك</p>
          <p>واجب من آخر حصة: {last.homework_assigned}</p>
        </section>
      ) : null}
      <ScoreChips summary={child.summary} />

      <section className="panel">
        <h2>الحصص</h2>
        {!(child.sessions || []).length ? (
          <p className="muted">لا حصص بعد.</p>
        ) : (
          (child.sessions || []).map((s) => (
            <article key={s.id} className="session-card">
              <strong>{s.lesson?.theme || 'حصة'}</strong>
              <div className="muted">
                {fmtDate(s.session_date)} {s.course?.title ? `· ${s.course.title}` : ''}
              </div>
              {s.notes ? <p>{s.notes}</p> : null}
              {s.homework_assigned ? (
                <p>
                  <span className="muted">واجب: </span>
                  {s.homework_assigned}
                </p>
              ) : null}
              <p className="muted">
                ورقة {fmtScore(s.worksheet_score, s.worksheet_total)} · مسابقة{' '}
                {fmtScore(s.quiz_score, s.quiz_total)} · واجب {fmtScore(s.homework_score, s.homework_total)}
              </p>
              {s.homework?.length ? (
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {open === s.id ? 'إخفاء التمارين' : `${s.homework.length} تمارين`}
                </button>
              ) : null}
              {open === s.id ? (
                <ol>
                  {s.homework.map((item, idx) => (
                    <li key={item.id || idx}>
                      {item.prompt}
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
            </article>
          ))
        )}
      </section>

      <section className="panel">
        <h2>الاختبارات</h2>
        {!(child.scores || []).length ? (
          <p className="muted">لا اختبارات مسجّلة.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>الاختبار</th>
                <th>التاريخ</th>
                <th>العلامة</th>
              </tr>
            </thead>
            <tbody>
              {(child.scores || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{fmtDate(row.test_date)}</td>
                  <td>
                    {fmtScore(row.score, row.total)}
                    {row.percent != null ? ` (${row.percent}٪)` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
