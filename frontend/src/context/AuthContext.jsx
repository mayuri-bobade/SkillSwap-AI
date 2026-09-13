import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.getMe()
      setUser(res.data.user || res.data)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token, fetchUser])

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password })
      const { token: newToken, user: userData } = res.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      toast.success('Welcome back!')
      navigate('/dashboard')
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
      return { success: false, error: msg }
    }
  }

  const register = async (name, email, password) => {
    try {
      const res = await authApi.register({ name, email, password })
      const { token: newToken, user: userData } = res.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      toast.success('Account created! Welcome to Skill-Swap!')
      navigate('/dashboard')
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
      return { success: false, error: msg }
    }
  }

  const googleLogin = async (googleToken) => {
    try {
      const res = await authApi.googleLogin({ token: googleToken })
      const { token: newToken, user: userData } = res.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      toast.success('Welcome!')
      navigate('/dashboard')
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Google login failed'
      toast.error(msg)
      return { success: false, error: msg }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/')
    toast.success('Logged out')
  }

  const updateProfile = async (data) => {
    try {
      const res = await authApi.updateProfile(data)
      setUser(res.data.user || res.data)
      toast.success('Profile updated')
      return { success: true }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
      return { success: false }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
