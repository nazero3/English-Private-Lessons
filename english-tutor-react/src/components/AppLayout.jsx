import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { coursebookSubjectFromPath } from '../lib/coursebookRoutes'
import { homePath, canAccessCoursebookGrade, canAccessPrivateLessons } from '../lib/permissions'

function navClass({ isActive }) {
  return `btn secondary${isActive ? ' is-nav-on' : ''}`
}

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

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4.2 4 10.4V20h5.5v-5.5h5V20H20v-9.6L12 4.2Zm0-2.2 10 7.7V22h-8.5v-5.5h-3V22H2V11.7L12 2Z"
      />
    </svg>
  )
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11Zm0-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9 6Zm7.5 5a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1ZM9 12.5c-3.2 0-6 1.7-6 4.2V19h12v-2.3c0-2.5-2.8-4.2-6-4.2Zm-4 4.2c.2-1.3 2-2.2 4-2.2s3.8.9 4 2.2Zm12.5-4.2c-.7 0-1.5.1-2.2.3.8.7 1.4 1.6 1.6 2.6h4.1v-1.2c0-1.1-1.5-1.7-3.5-1.7Z"
      />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 6H6v12h12V8Zm-9 3h2v2H9v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm.8-13h-1.6v6.2l5.1 3 0.8-1.3-4.3-2.5Z"
      />
    </svg>
  )
}

function primaryNav(role) {
  if (role === 'manager') {
    return [
      { to: '/manager', label: 'Home', end: true, icon: <IconHome /> },
      { to: '/manager/students', label: 'Students', icon: <IconPeople /> },
      { to: '/manager/sessions', label: 'Sessions', icon: <IconCalendar /> },
      { to: '/manager/hours', label: 'Hours', icon: <IconClock /> },
    ]
  }
  if (role === 'operations') {
    return [
      { to: '/operations', label: 'Hours', end: true, icon: <IconClock /> },
      { to: '/operations/sessions', label: 'Sessions', icon: <IconCalendar /> },
      { to: '/operations/families', label: 'Families', icon: <IconPeople /> },
    ]
  }
  if (role === 'teacher') {
    return [
      { to: '/teacher', label: 'Home', end: true, icon: <IconHome /> },
      { to: '/teacher/students', label: 'Students', icon: <IconPeople /> },
      { to: '/teacher/sessions', label: 'Classes', icon: <IconCalendar /> },
    ]
  }
  return []
}

function secondaryLinks(role) {
  if (role === 'manager') return [{ to: '/manager/parents', label: 'Families' }]
  if (role === 'teacher') return [{ to: '/teacher/parents', label: 'Families' }]
  return []
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const home = homePath(profile?.role)
  const [notifications, setNotifications] = useState([])
  const [openNotes, setOpenNotes] = useState(false)
  const [openMore, setOpenMore] = useState(false)

  const loadNotifications = async () => {
    if (!profile || (profile.role !== 'teacher' && profile.role !== 'manager')) {
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
  }, [profile, openNotes])

  const unreadCount = notifications.filter((n) => !n.read).length
  const tabs = primaryNav(profile?.role)
  const extra = secondaryLinks(profile?.role)

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
    <div className={`app-shell${tabs.length ? ' has-bottom-nav' : ''}`}>
      <header className="topbar no-print">
        <div>
          <Link className="brand" to={home}>
            Lesson Sheets
          </Link>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {profile?.full_name}
          </div>
        </div>
        <div className="actions">
          <div className="topbar-nav">
            {profile?.role === 'manager' ? (
              <>
                <NavLink className={navClass} to="/manager/students">
                  Students
                </NavLink>
                <NavLink className={navClass} to="/manager/parents">
                  Families
                </NavLink>
                <NavLink className={navClass} to="/manager/sessions">
                  Sessions
                </NavLink>
                <NavLink className={navClass} to="/manager/hours">
                  Hours
                </NavLink>
              </>
            ) : null}

            {profile?.role === 'operations' ? (
              <>
                <NavLink className={navClass} to="/operations/families">
                  Families
                </NavLink>
                <NavLink className={navClass} to="/operations" end>
                  Hours
                </NavLink>
                <NavLink className={navClass} to="/operations/sessions">
                  Sessions
                </NavLink>
              </>
            ) : null}

            {profile?.role === 'teacher' ? (
              <>
                <NavLink className={navClass} to="/teacher/students">
                  Students
                </NavLink>
                <NavLink className={navClass} to="/teacher/parents">
                  Families
                </NavLink>
                <NavLink className={navClass} to="/teacher/sessions">
                  Classes
                </NavLink>
              </>
            ) : null}
          </div>

          {profile?.role === 'teacher' || profile?.role === 'manager' ? (
            <div className="notify-wrap">
              <button
                type="button"
                className="btn secondary notify-btn"
                aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
                onClick={() => {
                  setOpenMore(false)
                  setOpenNotes((v) => !v)
                }}
              >
                <svg className="notify-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm8-5.5h-1.2V10a6.8 6.8 0 0 0-5.2-6.6V2.8a1.6 1.6 0 1 0-3.2 0v.6A6.8 6.8 0 0 0 5.2 10v6.5H4V18h16Z"
                  />
                </svg>
                <span className="notify-btn__label">Notifications</span>
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
                    to={profile?.role === 'manager' ? '/manager/students' : '/teacher/sessions'}
                    onClick={() => setOpenNotes(false)}
                  >
                    {profile?.role === 'manager' ? 'Open students' : 'Open classes'}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <button type="button" className="btn ghost topbar-signout" onClick={() => signOut()}>
            Sign out
          </button>

          <div className="more-wrap topbar-more">
            <button
              type="button"
              className="btn secondary"
              aria-expanded={openMore}
              aria-haspopup="menu"
              onClick={() => {
                setOpenNotes(false)
                setOpenMore((v) => !v)
              }}
            >
              More
            </button>
            {openMore ? (
              <div className="more-panel" role="menu">
                {extra.map((item) => (
                  <Link
                    key={item.to}
                    className="more-panel__link"
                    to={item.to}
                    role="menuitem"
                    onClick={() => setOpenMore(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button type="button" className="more-panel__link" role="menuitem" onClick={() => signOut()}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <Outlet />
      {tabs.length ? (
        <nav className="bottom-nav no-print" aria-label="Main">
          {tabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={Boolean(item.end)}
              className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
