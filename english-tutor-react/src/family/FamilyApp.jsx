import { Navigate, Route, Routes } from 'react-router-dom'
import LuminatePage from '../kinz/pages/LuminatePage.jsx'
import { useAuth } from '../kinz/lib/auth.jsx'
import ProgressPage from './pages/ProgressPage.jsx'

function Guard({ children }) {
  const { loading, profile } = useAuth()
  if (loading) return <p className="family-status">جارٍ التحميل…</p>
  if (!profile || profile.role !== 'parent') return <Navigate to="/family" replace />
  return children
}

function Shell({ tone, children }) {
  const className = tone === 'home' ? 'kinz-root family-home' : 'family-root'
  return (
    <div className={className} dir="rtl" lang="ar">
      {children}
    </div>
  )
}

export default function FamilyApp() {
  return (
    <Routes>
      <Route
        index
        element={
          <Shell tone="home">
            <LuminatePage />
          </Shell>
        }
      />
      <Route path="login" element={<Navigate to="/login?as=parent" replace />} />
      <Route
        path="child"
        element={
          <Shell>
            <Guard>
              <ProgressPage />
            </Guard>
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/family" replace />} />
    </Routes>
  )
}
