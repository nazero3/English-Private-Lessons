import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import { useAuth } from './lib/auth.jsx'
import { kinzPath } from './lib/format'
import CardPage from './pages/CardPage.jsx'
import ChildPage from './pages/ChildPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LuminatePage from './pages/LuminatePage.jsx'
import PayPage from './pages/PayPage.jsx'
import PrizesPage from './pages/PrizesPage.jsx'
import WalletPage from './pages/WalletPage.jsx'

function Guard({ children }) {
  const { loading, profile, family } = useAuth()
  if (loading) return <p className="muted" style={{ padding: '2rem' }}>جارٍ التحميل…</p>
  if (!profile || profile.role !== 'parent') return <Navigate to={kinzPath('/login')} replace />
  if (family && family.access === false) return <Navigate to={kinzPath('/pay')} replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route index element={<LuminatePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="pay" element={<PayPage />} />
      <Route
        path="app"
        element={
          <Guard>
            <HomePage />
          </Guard>
        }
      />
      <Route
        path="app/child"
        element={
          <Guard>
            <ChildPage />
          </Guard>
        }
      />
      <Route
        path="app/card"
        element={
          <Guard>
            <CardPage />
          </Guard>
        }
      />
      <Route
        path="app/wallet"
        element={
          <Guard>
            <WalletPage />
          </Guard>
        }
      />
      <Route
        path="app/prizes"
        element={
          <Guard>
            <PrizesPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to={kinzPath()} replace />} />
    </Routes>
  )
}
