import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('rl_token'))
  const [loading, setLoading] = useState(true)

  // On mount, verify token and fetch user
  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('rl_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('rl_token', t)
    setToken(t)
    setUser(u)
    return u
  }

  const loginWithGoogle = async (googleToken) => {
    const res = await api.post('/auth/google', {
      token: googleToken,
      idToken: googleToken,
      accessToken: googleToken,
    })
    const { token: t, user: u } = res.data
    localStorage.setItem('rl_token', t)
    setToken(t)
    setUser(u)
    return u
  }

  const register = async (name, email, password, inviteCode) => {
    const res = await api.post('/auth/register', { name, email, password, inviteCode })
    const { token: t, user: u } = res.data

    if (t && u) {
      localStorage.setItem('rl_token', t)
      setToken(t)
      setUser(u)
    }

    return res.data
  }

  const logout = () => {
    localStorage.removeItem('rl_token')
    setToken(null)
    setUser(null)
  }

  const establishSession = (authToken, authUser) => {
    if (authToken) {
      localStorage.setItem('rl_token', authToken)
      setToken(authToken)
    }
    if (authUser) setUser(authUser)
  }

  const updateUser = (updates) => setUser(prev => ({ ...(prev || {}), ...updates }))

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, updateUser, establishSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}