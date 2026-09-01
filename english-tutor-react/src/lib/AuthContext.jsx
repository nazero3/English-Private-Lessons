import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { canAccessMathGrade9, canAccessMathGrade12, canAccessPhysicsGrade12, canAccessPrivateLessons } from './permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const session = await api.getSession()
      setUser(session.user)
      setProfile(session.profile)
    } catch {
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const { data } = api.onAuthStateChange(() => refresh())
    return () => data?.subscription?.unsubscribe?.()
  }, [refresh])

  const signIn = async (email, password) => {
    const session = await api.signIn(email, password)
    setUser(session.user)
    setProfile(session.profile)
    return session
  }

  const signOut = async () => {
    await api.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signOut,
      refresh,
      isManager: profile?.role === 'manager',
      isTeacher: profile?.role === 'teacher',
      isStudent: profile?.role === 'student',
      canAccessPrivateLessons: canAccessPrivateLessons(profile),
      canAccessMathGrade9: canAccessMathGrade9(profile),
      canAccessMathGrade12: canAccessMathGrade12(profile),
      canAccessPhysicsGrade12: canAccessPhysicsGrade12(profile),
    }),
    [user, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
