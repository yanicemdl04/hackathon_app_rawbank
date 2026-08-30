import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'rawbank_user'

function loadUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = useCallback(async ({ phoneNumber, email, name }) => {
    setLoading(true)
    try {
      return await api.post('/auth/login-or-register', { phoneNumber, email, name })
    } finally { setLoading(false) }
  }, [])

  const verifyOtp = useCallback(async ({ userId, code }) => {
    setLoading(true)
    try {
      const profile = await api.post('/auth/verify-otp', { userId, code })
      setUser(profile)
      return profile
    } finally { setLoading(false) }
  }, [])

  const logout = useCallback(() => { setUser(null) }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    verifyOtp,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
