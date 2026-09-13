import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications'
import { formatDistanceToNow } from 'date-fns'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'
import { FiBell, FiCheck, FiMessageCircle, FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { setNotifications: setSocketNotifications } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data.notifications || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications((prev) => {
        const updated = prev.map((n) => n._id === id ? { ...n, read: true } : n)
        setSocketNotifications(updated)
        return updated
      })
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read: true }))
        setSocketNotifications(updated)
        return updated
      })
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <FiMessageCircle className="w-5 h-5 text-secondary-500" />
      case 'session': return <FiCalendar className="w-5 h-5 text-primary-500" />
      case 'payment': return <FiDollarSign className="w-5 h-5 text-accent-500" />
      case 'match': return <FiUser className="w-5 h-5 text-yellow-500" />
      default: return <FiBell className="w-5 h-5 text-gray-500" />
    }
  }

  const handleClick = (n) => {
    if (!n.read) handleMarkRead(n._id)
    if (n.link) navigate(n.link)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiBell className="w-6 h-6 text-primary-500" /> Notifications
        </h1>
        {notifications.some((n) => !n.read) && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-sm flex items-center gap-1">
            <FiCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full card flex items-start gap-4 text-left hover:shadow-md transition-shadow ${
                !n.read ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30' : ''
              }`}
            >
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}>{n.title || n.message}</p>
                {n.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{n.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
