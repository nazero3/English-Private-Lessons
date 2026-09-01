import { Link, NavLink } from 'react-router-dom'
import KinzApp from './App.jsx'
import { AuthProvider as KinzAuthProvider } from './lib/auth.jsx'
import { KINZ_BASE } from './lib/format'
import './index.css'

export default function KinzMount() {
  return (
    <div className="kinz-preview">
      <div className="kinz-preview__bar no-print">
        <nav className="kinz-preview__nav" aria-label="Operations">
          <NavLink to="/operations" end>
            Hours
          </NavLink>
          <NavLink to="/operations/sessions">Sessions</NavLink>
          <NavLink to={KINZ_BASE}>Families</NavLink>
        </nav>
        <p className="kinz-preview__hint">
          Parent app preview · demo phone <strong>0993000001</strong> · PIN <strong>123456</strong>
        </p>
        <Link className="kinz-preview__exit" to="/operations">
          Exit preview
        </Link>
      </div>
      <div className="kinz-root" dir="rtl" lang="ar">
        <KinzAuthProvider>
          <KinzApp />
        </KinzAuthProvider>
      </div>
    </div>
  )
}
