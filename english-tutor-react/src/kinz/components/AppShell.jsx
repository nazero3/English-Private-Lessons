import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { KINZ_LOGO, kinzPath } from '../lib/format'

function IconHome() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 4.4 4 11.1V20h5.2v-5.2h5.6V20H20v-8.9L12 4.4z" />
    </svg>
  )
}

function IconChild() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a3.6 3.6 0 1 0-3.6-3.6A3.6 3.6 0 0 0 12 12zm0 1.8c-3.3 0-7.2 1.7-7.2 4.2V20h14.4v-2c0-2.5-3.9-4.2-7.2-4.2z"
      />
    </svg>
  )
}

function IconCard() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.6 6.4h16.8A1.6 1.6 0 0 1 22 8v10.4a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 18.4V8a1.6 1.6 0 0 1 1.6-1.6zm0 3.2v2.4h16.8V9.6z" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 6.2h16V8H4zm0 3.2h16A1.6 1.6 0 0 1 21.6 11v7.2A1.6 1.6 0 0 1 20 19.8H4A1.6 1.6 0 0 1 2.4 18.2V11A1.6 1.6 0 0 1 4 9.4zm12.4 4.2a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2z" />
    </svg>
  )
}

const ITEMS = [
  { to: kinzPath('/app'), label: 'الرئيسية', icon: <IconHome />, end: true },
  { to: kinzPath('/app/child'), label: 'الابن', icon: <IconChild /> },
  { to: kinzPath('/app/card'), label: 'البطاقة', icon: <IconCard /> },
  { to: kinzPath('/app/wallet'), label: 'المحفظة', icon: <IconWallet /> },
]

export default function AppShell({ children }) {
  const { family, signOut } = useAuth()
  const name = family?.parent?.full_name || 'عائلة كينز'

  useEffect(() => {
    document.title = 'Kinz Platform'
  }, [])

  return (
    <div className="app-shell">
      <header className="app-head">
        <Link to={kinzPath('/app')} className="app-head__brand">
          <img src={KINZ_LOGO} alt="" />
          <strong>Kinz Platform</strong>
        </Link>
        <div className="app-head__user">
          <strong>{name}</strong>
          <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
            خروج
          </button>
        </div>
      </header>
      <main className="pad">{children}</main>
      <nav className="bottom-nav" aria-label="التنقل">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
