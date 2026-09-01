import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ENGLISH_FILE_COURSES } from '../data/englishFile'
import { MATH_GRADE9_COURSES } from '../data/mathGrade9'
import { MATH_GRADE12_COURSES } from '../data/mathGrade12'
import { PHYSICS_GRADE12_COURSES } from '../data/physicsGrade12'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const emptyForm = { email: '', password: '', full_name: '' }

const TABS = [
  { id: 'access', label: 'Access' },
  { id: 'staff', label: 'Staff' },
  { id: 'library', label: 'Library' },
]

function AccessChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`access-chip ${active ? 'is-on' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export default function ManagerHome() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('access')
  const [courses, setCourses] = useState([])
  const [profiles, setProfiles] = useState([])
  const [assignments, setAssignments] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [opsForm, setOpsForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editingTeacherId, setEditingTeacherId] = useState(null)
  const [editingOpsId, setEditingOpsId] = useState(null)
  const [opsEditForm, setOpsEditForm] = useState(emptyForm)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [c, p, a] = await Promise.all([
        api.listCourses(profile),
        api.listProfiles(),
        api.listAssignments(),
      ])
      setCourses(c)
      setProfiles(p)
      setAssignments(a)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [profile])

  const isAssigned = (teacherId, courseId) =>
    assignments.some((a) => a.teacher_id === teacherId && a.course_id === courseId)

  const runAction = async (fn, successMessage) => {
    setMessage('')
    setError('')
    try {
      await fn()
      await load()
      if (successMessage) setMessage(successMessage)
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleAssign = (teacherId, courseId, assigned) =>
    runAction(
      () => api.setAssignment(teacherId, courseId, assigned),
      'Assignment updated.',
    )

  const createTeacher = async (e) => {
    e.preventDefault()
    await runAction(async () => {
      await api.createTeacher(form)
      setForm(emptyForm)
      setTab('access')
    }, 'Teacher created. Assign curriculum below.')
  }

  const startEdit = (teacher) => {
    setEditingTeacherId(teacher.id)
    setEditForm({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      password: '',
    })
    setMessage('')
    setError('')
    setTab('staff')
  }

  const cancelEdit = () => {
    setEditingTeacherId(null)
    setEditForm(emptyForm)
  }

  const saveTeacher = async (e) => {
    e.preventDefault()
    if (!editingTeacherId) return
    await runAction(async () => {
      await api.updateTeacher(editingTeacherId, editForm)
      setEditingTeacherId(null)
      setEditForm(emptyForm)
    }, 'Teacher account updated.')
  }

  const deleteTeacher = async (teacher) => {
    const ok = window.confirm(
      `Delete ${teacher.full_name}? Their sessions and student links stay unless you remove those separately.`,
    )
    if (!ok) return
    await runAction(async () => {
      await api.deleteTeacher(teacher.id)
      if (editingTeacherId === teacher.id) cancelEdit()
    }, 'Teacher removed.')
  }

  const createOperations = async (e) => {
    e.preventDefault()
    await runAction(async () => {
      await api.createOperations(opsForm)
      setOpsForm(emptyForm)
    }, 'Operations account created.')
  }

  const startEditOps = (ops) => {
    setEditingOpsId(ops.id)
    setOpsEditForm({
      full_name: ops.full_name || '',
      email: ops.email || '',
      password: '',
    })
    setMessage('')
    setError('')
    setTab('staff')
  }

  const cancelEditOps = () => {
    setEditingOpsId(null)
    setOpsEditForm(emptyForm)
  }

  const saveOperations = async (e) => {
    e.preventDefault()
    if (!editingOpsId) return
    await runAction(async () => {
      await api.updateOperations(editingOpsId, opsEditForm)
      setEditingOpsId(null)
      setOpsEditForm(emptyForm)
    }, 'Operations account updated.')
  }

  const deleteOperations = async (ops) => {
    const ok = window.confirm(`Delete operations account ${ops.full_name}?`)
    if (!ok) return
    await runAction(async () => {
      await api.deleteOperations(ops.id)
      if (editingOpsId === ops.id) cancelEditOps()
    }, 'Operations account removed.')
  }

  const togglePrivateLessons = (teacherId, enabled) =>
    runAction(
      () => api.setPrivateLessonsAccess(teacherId, enabled),
      enabled ? 'English File access enabled.' : 'English File access removed.',
    )

  const toggleMathGrade9 = (teacherId, enabled) =>
    runAction(
      () => api.setMathGrade9Access(teacherId, enabled),
      enabled ? 'Math Grade 9 access enabled.' : 'Math Grade 9 access removed.',
    )

  const toggleMathGrade12 = (teacherId, enabled) =>
    runAction(
      () => api.setMathGrade12Access(teacherId, enabled),
      enabled ? 'Math Grade 12 access enabled.' : 'Math Grade 12 access removed.',
    )

  const togglePhysicsGrade12 = (teacherId, enabled) =>
    runAction(
      () => api.setPhysicsGrade12Access(teacherId, enabled),
      enabled ? 'Physics Grade 12 access enabled.' : 'Physics Grade 12 access removed.',
    )

  const teachers = profiles.filter((p) => p.role === 'teacher')
  const operations = profiles.filter((p) => p.role === 'operations')
  const editingTeacher = teachers.find((t) => t.id === editingTeacherId) || null
  const editingOps = operations.find((p) => p.id === editingOpsId) || null

  const countAccess = (t) => {
    const packs = courses.filter((c) => isAssigned(t.id, c.id)).length
    const extras =
      (t.can_access_private_lessons ? 1 : 0) +
      (t.can_access_math_grade9 ? 1 : 0) +
      (t.can_access_math_grade12 ? 1 : 0) +
      (t.can_access_physics_grade12 ? 1 : 0)
    return packs + extras
  }

  return (
    <div className="manager-dash">
      <header className="manager-dash__hero">
        <div>
          <h1>Manager</h1>
          <p className="muted">Turn access on for each teacher. Add staff in the Staff tab.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <nav className="manager-tabs" role="tablist" aria-label="Manager sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`manager-tabs__btn ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === 'staff' && teachers.length + operations.length ? (
              <span className="manager-tabs__count">{teachers.length + operations.length}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === 'access' ? (
        <section className="manager-section" role="tabpanel">
          <div className="manager-section__intro">
            <h2>Curriculum access</h2>
            <p className="muted">Tap a subject to turn it on or off for that teacher.</p>
          </div>

          {!teachers.length ? (
            <div className="panel">
              <p className="muted" style={{ margin: 0 }}>
                No teachers yet.{' '}
                <button type="button" className="btn ghost" onClick={() => setTab('staff')}>
                  Add a teacher
                </button>
              </p>
            </div>
          ) : (
            <div className="access-card-list">
              {teachers.map((t) => (
                <article key={t.id} className="access-card">
                  <header className="access-card__head">
                    <div>
                      <h3>{t.full_name}</h3>
                      <p className="muted">{t.email || '—'}</p>
                    </div>
                    <span className="badge">{countAccess(t)} on</span>
                  </header>

                  <div className="access-chip-row">
                    {courses.map((c) => {
                      const on = isAssigned(t.id, c.id)
                      return (
                        <AccessChip
                          key={c.id}
                          active={on}
                          onClick={() => toggleAssign(t.id, c.id, !on)}
                        >
                          {c.title}
                        </AccessChip>
                      )
                    })}
                    <AccessChip
                      active={Boolean(t.can_access_private_lessons)}
                      onClick={() => togglePrivateLessons(t.id, !t.can_access_private_lessons)}
                    >
                      English File
                    </AccessChip>
                    <AccessChip
                      active={Boolean(t.can_access_math_grade9)}
                      onClick={() => toggleMathGrade9(t.id, !t.can_access_math_grade9)}
                    >
                      Math 9
                    </AccessChip>
                    <AccessChip
                      active={Boolean(t.can_access_math_grade12)}
                      onClick={() => toggleMathGrade12(t.id, !t.can_access_math_grade12)}
                    >
                      Math 12
                    </AccessChip>
                    <AccessChip
                      active={Boolean(t.can_access_physics_grade12)}
                      onClick={() => togglePhysicsGrade12(t.id, !t.can_access_physics_grade12)}
                    >
                      Physics 12
                    </AccessChip>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'staff' ? (
        <section className="manager-section" role="tabpanel">
          <div className="manager-section__intro">
            <h2>Staff</h2>
            <p className="muted">Teacher logins and operations accounts.</p>
          </div>

          <h3 className="staff-subhead">Teachers</h3>
          <p className="muted staff-subhead__hint">Logins for people who teach classes.</p>

          <div className="grid-2">
            <section className="panel">
              <h3>Create teacher</h3>
              {!api.isSupabaseConfigured ? (
                <form onSubmit={createTeacher}>
                  <div className="field">
                    <label>Full name</label>
                    <input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <button className="btn" type="submit">
                    Add teacher
                  </button>
                </form>
              ) : (
                <p className="muted">
                  Teacher accounts are created in your authentication provider. After they sign in,
                  assign their curriculum in the Access tab.
                </p>
              )}
            </section>

            <section className="panel">
              <h3>Accounts ({teachers.length})</h3>
              {!teachers.length ? (
                <p className="muted">No teachers yet.</p>
              ) : (
                <ul className="teacher-account-list">
                  {teachers.map((t) => (
                    <li key={t.id}>
                      <div>
                        <strong>{t.full_name}</strong>
                        <div className="muted">{t.email || '—'}</div>
                      </div>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => deleteTeacher(t)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {editingTeacher ? (
            <form className="panel teacher-edit-form" onSubmit={saveTeacher}>
              <h3>Edit {editingTeacher.full_name}</h3>
              <div className="grid-2">
                <div className="field">
                  <label>Full name</label>
                  <input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required={!api.isSupabaseConfigured}
                    disabled={api.isSupabaseConfigured}
                  />
                </div>
              </div>
              <div className="field">
                <label>New password (optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  minLength={6}
                  placeholder={
                    api.isSupabaseConfigured
                      ? 'Contact your administrator to change login credentials'
                      : 'Leave blank to keep current password'
                  }
                  disabled={api.isSupabaseConfigured}
                />
              </div>
              <div className="actions">
                <button className="btn" type="submit">
                  Save changes
                </button>
                <button className="btn secondary" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <h3 className="staff-subhead">Operations</h3>
          <p className="muted staff-subhead__hint">Hours and sessions only — no curriculum or families.</p>

          <div className="grid-2">
            <section className="panel">
              <h3>Create operations account</h3>
              {!api.isSupabaseConfigured ? (
                <form onSubmit={createOperations}>
                  <div className="field">
                    <label>Full name</label>
                    <input
                      value={opsForm.full_name}
                      onChange={(e) => setOpsForm({ ...opsForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={opsForm.email}
                      onChange={(e) => setOpsForm({ ...opsForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={opsForm.password}
                      onChange={(e) => setOpsForm({ ...opsForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <button className="btn" type="submit">
                    Add operations account
                  </button>
                </form>
              ) : (
                <p className="muted">Operations accounts require the FastAPI backend.</p>
              )}
            </section>

            <section className="panel">
              <h3>Accounts ({operations.length})</h3>
              {!operations.length ? (
                <p className="muted">No operations accounts yet.</p>
              ) : (
                <ul className="teacher-account-list">
                  {operations.map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{p.full_name}</strong>
                        <div className="muted">{p.email || '—'}</div>
                      </div>
                      <div className="actions">
                        <button type="button" className="btn secondary" onClick={() => startEditOps(p)}>
                          Edit
                        </button>
                        <button type="button" className="btn ghost" onClick={() => deleteOperations(p)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {editingOps ? (
            <form className="panel teacher-edit-form" onSubmit={saveOperations}>
              <h3>Edit {editingOps.full_name}</h3>
              <div className="grid-2">
                <div className="field">
                  <label>Full name</label>
                  <input
                    value={opsEditForm.full_name}
                    onChange={(e) => setOpsEditForm({ ...opsEditForm, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={opsEditForm.email}
                    onChange={(e) => setOpsEditForm({ ...opsEditForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>New password (optional)</label>
                <input
                  type="password"
                  value={opsEditForm.password}
                  onChange={(e) => setOpsEditForm({ ...opsEditForm, password: e.target.value })}
                  minLength={6}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="actions">
                <button className="btn" type="submit">
                  Save changes
                </button>
                <button className="btn secondary" type="button" onClick={cancelEditOps}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {tab === 'library' ? (
        <section className="manager-section" role="tabpanel">
          <div className="manager-section__intro">
            <h2>Content library</h2>
            <p className="muted">Open a pack to preview or print.</p>
          </div>

          <div className="library-block">
            <h3 className="library-block__title">English lesson packs</h3>
            <div className="library-grid">
              {courses.map((c) => (
                <Link key={c.id} className="library-card" to={`/manager/courses/${c.id}`}>
                  <span className="library-card__tag">Sheets</span>
                  <strong>{c.title}</strong>
                  <span className="muted">{c.grade || 'English'} · view & print sheets</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="library-block">
            <h3 className="library-block__title">English File · private lessons</h3>
            <div className="library-grid">
              {ENGLISH_FILE_COURSES.map((c) => (
                <Link
                  key={c.id}
                  className="library-card"
                  to={`/teacher/private-lessons/${c.id}`}
                  style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                >
                  <span className="library-card__tag">PDF sessions</span>
                  <strong>
                    {c.title} {c.subtitle}
                  </strong>
                  <span className="muted">
                    {c.files.length} Files · {c.level}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="library-block">
            <h3 className="library-block__title">Math · الصف التاسع</h3>
            <div className="library-grid">
              {MATH_GRADE9_COURSES.map((c) => (
                <Link
                  key={c.id}
                  className="library-card"
                  to={`/teacher/math/grade9/${c.id}`}
                  style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                  dir="rtl"
                >
                  <span className="library-card__tag">PDF sessions</span>
                  <strong>{c.subtitle}</strong>
                  <span className="muted">
                    {c.files.length} وحدات · {c.pageCount} صفحة
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="library-block">
            <h3 className="library-block__title">Math · البكالوريا</h3>
            <div className="library-grid">
              {MATH_GRADE12_COURSES.map((c) => (
                <Link
                  key={c.id}
                  className="library-card"
                  to={`/teacher/math/grade12/${c.id}`}
                  style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                  dir="rtl"
                >
                  <span className="library-card__tag">PDF sessions</span>
                  <strong>{c.subtitle}</strong>
                  <span className="muted">
                    {c.files.length} وحدات · {c.pageCount} صفحة
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="library-block">
            <h3 className="library-block__title">Physics · البكالوريا</h3>
            <div className="library-grid">
              {PHYSICS_GRADE12_COURSES.map((c) => (
                <Link
                  key={c.id}
                  className="library-card"
                  to={`/teacher/physics/grade12/${c.id}`}
                  style={{ '--course-accent': c.color, '--course-soft': c.softColor }}
                  dir="rtl"
                >
                  <span className="library-card__tag">PDF sessions</span>
                  <strong>{c.subtitle}</strong>
                  <span className="muted">
                    {c.files.length} وحدات · {c.pageCount} صفحة
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </section>
      ) : null}
    </div>
  )
}
