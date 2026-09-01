import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { coursebookSubjectFromPath } from '../lib/coursebookRoutes'
import { homePath, canAccessCoursebookGrade, canAccessPrivateLessons } from '../lib/permissions'

export function RequireAuth({ role, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const allowed = roles || (role ? [role] : null)
  if (allowed && !allowed.includes(profile.role)) {
    return <Navigate to={homePath(profile.role)} replace />
  }

  return <Outlet />
}

export function RequirePrivateLessons() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!canAccessPrivateLessons(profile)) {
    return <Navigate to="/teacher" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RequireCoursebookAccess() {
  const { profile, loading } = useAuth()
  const location = useLocation()
  const { gradeKey } = useParams()
  const subjectKey = coursebookSubjectFromPath(location.pathname)

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!canAccessCoursebookGrade(profile, subjectKey, gradeKey)) {
    return <Navigate to="/teacher" replace state={{ from: location }} />
  }

  return <Outlet />
}

/** @deprecated use RequireCoursebookAccess */
export function RequireMathAccess() {
  return <RequireCoursebookAccess />
}

export function RequireMathGrade9() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!canAccessMathGrade(profile, 'grade9')) {
    return <Navigate to="/teacher" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const home = homePath(profile?.role)
  const [notifications, setNotifications] = useState([])
  const [openNotes, setOpenNotes] = useState(false)

  const loadNotifications = async () => {
    if (!profile || profile.role !== 'teacher') {
      setNotifications([])
      return
    }
    try {
      setNotifications(await api.listNotifications(profile))
    } catch {
      setNotifications([])
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [profile])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markOne = async (id) => {
    try {
      await api.markNotificationRead(profile, id)
      await loadNotifications()
    } catch {
      /* ignore */
    }
  }

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead(profile)
      await loadNotifications()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div>
          <Link className="brand" to={home}>
            Lesson Sheets
          </Link>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {profile?.full_name} · <span className="badge">{profile?.role}</span>
          </div>
        </div>
        <div className="actions">
          {profile?.role === 'manager' ? (
            <>
              <Link className="btn secondary" to="/manager/students">
                Students
              </Link>
              <Link className="btn secondary" to="/manager/parents">
                Families
              </Link>
              <Link className="btn secondary" to="/manager/sessions">
                Sessions
              </Link>
            </>
          ) : null}

          {profile?.role === 'teacher' ? (
            <>
              <Link className="btn secondary" to="/teacher/students">
                Students
              </Link>
              <Link className="btn secondary" to="/teacher/parents">
                Families
              </Link>
              <Link className="btn secondary" to="/teacher/sessions">
                My sessions
              </Link>
              <div className="notify-wrap">
                <button
                  type="button"
                  className="btn secondary notify-btn"
                  onClick={() => setOpenNotes((v) => !v)}
                >
                  Notifications
                  {unreadCount > 0 ? <span className="notify-count">{unreadCount}</span> : null}
                </button>
                {openNotes ? (
                  <div className="notify-panel">
                    <div className="notify-panel__head">
                      <strong>Notifications</strong>
                      {unreadCount > 0 ? (
                        <button type="button" className="btn ghost" onClick={markAll}>
                          Mark all read
                        </button>
                      ) : null}
                    </div>
                    {!notifications.length ? (
                      <p className="muted">No notifications yet.</p>
                    ) : (
                      <ul className="notify-list">
                        {notifications.map((n) => (
                          <li key={n.id} className={n.read ? '' : 'is-unread'}>
                            <div className="notify-item__title">{n.title}</div>
                            <p>{n.message}</p>
                            <div className="notify-item__meta">
                              <span className="muted">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                              {!n.read ? (
                                <button
                                  type="button"
                                  className="btn ghost"
                                  onClick={() => markOne(n.id)}
                                >
                                  Mark read
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      className="btn secondary block"
                      to="/teacher/sessions"
                      onClick={() => setOpenNotes(false)}
                    >
                      Open sessions
                    </Link>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <button type="button" className="btn ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
