import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { KINZ_LOGO, kinzPath } from '../lib/format'

const ITEMS = [
  { to: kinzPath('/app'), label: 'الرئيسية', icon: '⌂', end: true },
  { to: kinzPath('/app/child'), label: 'الابن', icon: '◉' },
  { to: kinzPath('/app/card'), label: 'البطاقة', icon: '◇' },
  { to: kinzPath('/app/wallet'), label: 'المحفظة', icon: '▣' },
  { to: kinzPath('/app/prizes'), label: 'الجوائز', icon: '★' },
]

export default function AppShell({ children }) {
  const { family, signOut } = useAuth()
  const name = family?.parent?.full_name || 'عائلة كينز'

  return (
    <div className="app-shell">
      <header className="app-head">
        <Link to={kinzPath('/app')}>
          <img src={KINZ_LOGO} alt="كينز" />
        </Link>
        <div style={{ textAlign: 'left' }}>
          <strong>{name}</strong>
          <div className="muted" style={{ fontSize: '0.82rem' }}>
            <button type="button" className="btn btn-ghost" style={{ padding: '0.2rem 0.6rem' }} onClick={() => signOut()}>
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="pad">{children}</main>
      <nav className="bottom-nav" aria-label="التنقل">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
