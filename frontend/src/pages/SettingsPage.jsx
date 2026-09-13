import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, updatePassword, deleteAccount } from '../api/auth'
import toast from 'react-hot-toast'
import { FiSettings, FiUser, FiShield, FiTrash2, FiSun, FiMoon } from 'react-icons/fi'

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
  })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await updateProfile(form)
      setUser(res.data.user || { ...user, ...form })
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Failed to update profile')
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    try {
      await updatePassword({ currentPassword: passwords.current, newPassword: passwords.new })
      setPasswords({ current: '', new: '', confirm: '' })
      toast.success('Password updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password')
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    try {
      await deleteAccount()
      toast.success('Account deleted successfully')
      logout()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'theme', label: 'Theme', icon: darkMode ? FiMoon : FiSun },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'account', label: 'Account', icon: FiSettings },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FiSettings className="w-6 h-6 text-primary-500" /> Settings
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input min-h-[80px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          )}

          {activeTab === 'theme' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {darkMode ? <FiMoon className="w-5 h-5 text-primary-500" /> : <FiSun className="w-5 h-5 text-yellow-500" />}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-500">Toggle between light and dark theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => setDarkMode(false)}
                  className={`p-4 rounded-xl border-2 transition-colors ${!darkMode ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                >
                  <FiSun className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white text-center">Light</p>
                </button>
                <button
                  onClick={() => setDarkMode(true)}
                  className={`p-4 rounded-xl border-2 transition-colors ${darkMode ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                >
                  <FiMoon className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white text-center">Dark</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} required />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h2>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <FiTrash2 className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button onClick={handleDeleteAccount} className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
