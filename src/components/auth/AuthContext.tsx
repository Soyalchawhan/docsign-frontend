import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

interface User {
  _id: string
  name: string
  email: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const setAuth = (data: { user: User; accessToken: string; refreshToken: string }) => {
    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('accessToken', data.accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
  }

  const logout = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessToken')
    delete api.defaults.headers.common['Authorization']
  }, [])

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        try {
          const res = await api.get('/api/auth/me')
          setUser(res.data.user)
          setAccessToken(storedToken)
        } catch {
          if (refreshToken) {
            try {
              const refreshRes = await api.post('/api/auth/refresh', { refreshToken })
              const newToken = refreshRes.data.accessToken
              localStorage.setItem('accessToken', newToken)
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
              const meRes = await api.get('/api/auth/me')
              setUser(meRes.data.user)
              setAccessToken(newToken)
            } catch {
              logout()
            }
          } else {
            logout()
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [logout])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    setAuth(res.data)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/api/auth/register', { name, email, password })
    setAuth(res.data)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}