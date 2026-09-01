import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    const session = await api.getSession()
    setUser(session.user)
    setProfile(session.profile)
    if (session.profile?.role === 'parent') {
      try {
        setFamily(await api.getFamily())
      } catch (err) {
        setFamily(null)
        setError(err.message)
      }
    } else {
      setFamily(null)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await refresh()
      } catch {
        setUser(null)
        setProfile(null)
        setFamily(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      family,
      loading,
      error,
      setError,
      async login(payload) {
        setError('')
        const data = await api.parentLogin(payload)
        setUser(data.user)
        setProfile(data.profile)
        setFamily(await api.getFamily())
        return data
      },
      async reloadFamily() {
        const data = await api.getFamily()
        setFamily(data)
        return data
      },
      async signOut() {
        await api.signOut()
        setUser(null)
        setProfile(null)
        setFamily(null)
      },
    }),
    [user, profile, family, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
