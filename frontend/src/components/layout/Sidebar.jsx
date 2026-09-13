import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { useSocket } from '../../context/SocketContext'
import { getBalance } from '../../api/wallet'
import { getMySessions } from '../../api/sessions'
import { FiHome, FiSearch, FiCalendar, FiMessageCircle, FiDollarSign, FiUser, FiSettings, FiShield, FiChevronLeft, FiChevronRight, FiBook } from 'react-icons/fi'

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const location = useLocation()
  const { totalUnread } = useChat()
  const { notifications } = useSocket()
  const [balance, setBalance] = useState(0)
  const [pendingSessions, setPendingSessions] = useState(0)

  const fetchPendingSessions = useCallback(() => {
    getMySessions({ status: 'pending', limit: 50 })
      .then((res) => {
        const sessions = res.data?.sessions || res.data || []
        setPendingSessions(sessions.length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getBalance()
      .then((res) => setBalance(res.data?.balance || 0))
      .catch(() => {})
    fetchPendingSessions()
  }, [fetchPendingSessions])

  useEffect(() => {
    const sessionNotifs = notifications?.filter(
      (n) => n.type === 'session_request' || n.type === 'session_accepted' || n.type === 'session_rejected' || n.type === 'system'
    )
    if (sessionNotifs?.length > 0) {
      fetchPendingSessions()
    }
  }, [notifications, fetchPendingSessions])

  const navItems = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/search', icon: FiSearch, label: 'Search Skills' },
    { to: '/match', icon: FiUser, label: 'Find Matches' },
    { to: '/sessions', icon: FiCalendar, label: 'Sessions' },
    { to: '/chat', icon: FiMessageCircle, label: 'Chat' },
    { to: '/learning-path', icon: FiBook, label: 'Learning Path' },
    { to: '/wallet', icon: FiDollarSign, label: 'Wallet' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: FiShield, label: 'Admin' }] : []),
  ]

  return (
    <>
      {!open && (
        <div className="hidden lg:block fixed inset-0 z-30" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ${
          open ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-500' : ''}`} />
                  {item.label === 'Sessions' && pendingSessions > 0 && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                  {item.label === 'Chat' && totalUnread > 0 && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                  {open && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>

          {open && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Your Balance</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {balance} Tokens
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
