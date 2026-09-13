import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function LoginForm() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(form.email, form.password)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <div className="relative">
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            className="input input-dark pl-10"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="input input-dark pl-10 pr-10"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPassword ? <FiEyeOff className="w-5 h-5 text-gray-400" /> : <FiEye className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Don't have an account? <Link to="/register" className="text-primary-500 hover:underline">Sign up</Link>
      </p>
    </form>
  )
}
