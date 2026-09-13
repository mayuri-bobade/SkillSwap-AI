import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function RegisterForm() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return
    }
    setLoading(true)
    await register(form.name, form.email, form.password)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input input-dark pl-10"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
      </div>
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
            minLength={6}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPassword ? <FiEyeOff className="w-5 h-5 text-gray-400" /> : <FiEye className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </div>
      <div>
        <label className="label">Confirm Password</label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            className="input input-dark pl-10"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-primary-500 hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
