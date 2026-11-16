import { AuthProvider } from '../kinz/lib/auth.jsx'
import '../kinz/index.css'
import FamilyApp from './FamilyApp.jsx'
import './family.css'

/** Public parent site: the homepage, then login, then the child record. */
export default function FamilyMount() {
  return (
    <AuthProvider>
      <FamilyApp />
    </AuthProvider>
  )
}
