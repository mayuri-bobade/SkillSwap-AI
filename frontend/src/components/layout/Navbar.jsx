import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { FiBell, FiMenu, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi'

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const { notifications } = useSocket()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">Skill-Swap</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7c3aed&color=fff`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name?.split(' ')[0]}
              </span>
              <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-up">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FiUser className="w-4 h-4" /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FiSettings className="w-4 h-4" /> Settings
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); logout() }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                >
                  <FiLogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
