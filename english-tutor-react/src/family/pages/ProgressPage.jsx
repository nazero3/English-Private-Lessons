import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../kinz/lib/auth.jsx'
import { KINZ_LOGO, fmtDate, fmtPct, fmtScore } from '../../kinz/lib/format'
import { useSelectedChild } from '../../kinz/lib/useSelectedChild'
import { courseKey, courseTitle, firstName, isPerformanceTag, lessonTitle, tagLabel } from '../labels'
import { coursesFor, learnedFor } from '../readProgress'

const SCORE_FIELDS = [
  ['worksheet_score', 'worksheet_total', 'ورقة عمل'],
  ['quiz_score', 'quiz_total', 'مسابقة'],
  ['homework_score', 'homework_total', 'واجب'],
]

function scoreBits(session) {
  return SCORE_FIELDS.flatMap(([score, total, label]) => {
    if (session[score] == null) return []
    return [{ label, value: fmtScore(session[score], session[total]) }]
  })
}

function summaryBits(summary) {
  if (!summary) return []
  return [
    ['tests_avg', 'الاختبارات'],
    ['quiz_avg', 'المسابقات'],
    ['homework_avg', 'الواجبات'],
    ['worksheet_avg', 'أوراق العمل'],
  ].flatMap(([key, label]) => (summary[key] == null ? [] : [{ label, value: summary[key] }]))
}

export default function ProgressPage() {
  const { family, error, signOut } = useAuth()
  const { childrenList, child, selectChild } = useSelectedChild(family?.children)
  const childId = child?.student?.id || ''
  const [filter, setFilter] = useState({ childId: '', courseId: 'all' })
  const courseId = filter.childId === childId ? filter.courseId : 'all'

  useEffect(() => {
    document.title = 'Kinz Platform'
  }, [])

  const courses = coursesFor(child)
  const sessions = useMemo(() => {
    const rows = child?.sessions || []
    if (courseId === 'all') return rows
    return rows.filter((session) => courseKey(session.course) === courseId)
  }, [child, courseId])

  const parentName = firstName(family?.parent?.full_name) || 'ولي الأمر'
  const summary = child?.summary
  const metrics = summaryBits(summary)
  const tests = child?.scores || []

  return (
    <div className="family-app">
      <header className="family-bar">
        <Link to="/family" className="family-bar__brand">
          <img src={KINZ_LOGO} alt="" />
          <span>Kinz Platform</span>
        </Link>
        <button type="button" className="family-textbtn" onClick={() => signOut()}>
          خروج
        </button>
      </header>

      <main className="family-main">
        <p className="family-kicker">مرحباً {parentName}</p>
        {error ? (
          <p className="family-error" role="alert">
            {error}
          </p>
        ) : null}
        {!child ? (
          <section className="family-card">
            <h1>لا يوجد طالب مرتبط</h1>
            <p className="family-muted">اطلب من المركز ربط هذا الحساب بسجل ابنك. بعد الربط تظهر المواد والحصص هنا.</p>
          </section>
        ) : (
          <>
            <header className="family-hero">
              <h1>{child.student?.full_name}</h1>
              <p className="family-muted">المدرس: {child.student?.teacher?.full_name || '—'}</p>
            </header>

            {childrenList.length > 1 ? (
              <div className="family-pills" role="tablist" aria-label="الأبناء">
                {childrenList.map((row) => {
                  const id = row.student?.id
                  const active = id === child.student?.id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={active ? 'is-active' : ''}
                      onClick={() => selectChild(id)}
                    >
                      {firstName(row.student?.full_name) || 'طالب'}
                    </button>
                  )
                })}
              </div>
            ) : null}

            <section className="family-card" aria-labelledby="family-performance">
              <h2 id="family-performance">الأداء</h2>
              {summary?.overall_avg == null ? (
                <p className="family-muted">لا علامات بعد. تظهر هنا عند تسجيل درجة حصة أو اختبار.</p>
              ) : (
                <div className="family-score">
                  <p className="family-score__main">
                    <strong>{fmtPct(summary.overall_avg)}</strong>
                    <span>المعدل</span>
                  </p>
                  {metrics.length ? (
                    <ul className="family-score__list">
                      {metrics.map((item) => (
                        <li key={item.label}>
                          <span>{item.label}</span>
                          <strong>{fmtPct(item.value)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
              <p className="family-count">{summary?.lessons_count || 0} حصة مكتملة</p>
            </section>

            <section aria-labelledby="family-courses">
              <h2 id="family-courses">المواد</h2>
              {!courses.length ? (
                <p className="family-muted">لم تُسجَّل مواد بعد.</p>
              ) : (
                <div className="family-courses">
                  <button
                    type="button"
                    className={`family-course ${courseId === 'all' ? 'is-active' : ''}`}
                    aria-pressed={courseId === 'all'}
                    onClick={() => setFilter({ childId, courseId: 'all' })}
                  >
                    <strong>كل المواد</strong>
                    <span>{child.sessions?.length || 0} حصة</span>
                  </button>
                  {courses.map((course) => {
                    const key = courseKey(course)
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`family-course ${courseId === key ? 'is-active' : ''}`}
                        aria-pressed={courseId === key}
                        onClick={() => setFilter({ childId, courseId: key })}
                      >
                        <strong>{courseTitle(course)}</strong>
                        <span className="family-course__meta">
                          {course.grade ? <span>الصف {course.grade}</span> : null}
                          <span>{course.lessons_count} حصة</span>
                          {course.overall_avg != null ? <span>{fmtPct(course.overall_avg)}</span> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            <section aria-labelledby="family-lessons">
              <h2 id="family-lessons">الحصص</h2>
              {!sessions.length ? (
                <p className="family-muted">لا حصص في هذا الاختيار. تظهر الحصة بعد أن يحفظها المدرس.</p>
              ) : (
                <div className="family-lessons">
                  {sessions.map((session) => {
                    const learned = learnedFor(session)
                    const tags = session.note_tags || []
                    const scores = scoreBits(session)
                    return (
                      <article key={session.id} className="family-lesson">
                        <p className="family-lesson__meta">
                          {fmtDate(session.session_date || session.created_at)}
                          {session.course?.title ? ` · ${session.course.title}` : ''}
                        </p>
                        <h3>{lessonTitle(session)}</h3>
                        {learned.length ? (
                          <div className="family-lesson__block">
                            <span>ما تعلّمه</span>
                            <ul>
                              {learned.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {tags.length || session.notes ? (
                          <div className="family-note">
                            <span>ملاحظة المدرس</span>
                            {tags.length ? (
                              <ul className="family-tags">
                                {tags.map((tag) => (
                                  <li key={tag} className={isPerformanceTag(tag) ? 'is-performance' : ''}>
                                    {tagLabel(tag)}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {session.notes ? <p>{session.notes}</p> : null}
                          </div>
                        ) : null}
                        {session.homework_assigned ? (
                          <div className="family-lesson__block">
                            <span>الواجب</span>
                            <p>{session.homework_assigned}</p>
                          </div>
                        ) : null}
                        {scores.length ? (
                          <ul className="family-bits">
                            {scores.map((bit) => (
                              <li key={bit.label}>
                                {bit.label}: {bit.value}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            {tests.length ? (
              <section className="family-card" aria-labelledby="family-tests">
                <h2 id="family-tests">الاختبارات</h2>
                <ul className="family-tests">
                  {tests.map((row) => (
                    <li key={row.id}>
                      <div>
                        <strong>{row.title}</strong>
                        <span>{fmtDate(row.test_date)}</span>
                      </div>
                      <b>
                        {fmtScore(row.score, row.total)}
                        {row.percent != null ? ` · ${fmtPct(row.percent)}` : ''}
                      </b>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
