import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMySessions, acceptSession, rejectSession, cancelSession, completeSession } from '../api/sessions'
import SessionList from '../components/sessions/SessionList'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { FiCalendar } from 'react-icons/fi'

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Past' },
    { id: 'all', label: 'All' },
  ]

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = activeTab === 'all' ? { type: 'teaching' } : { status: activeTab }
      const res = await getMySessions(params)
      setSessions(res.data.sessions || res.data || [])
    } catch (err) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [activeTab])

  const handleAccept = async (id) => {
    try { await acceptSession(id); toast.success('Session accepted'); fetchSessions() }
    catch { toast.error('Failed to accept session') }
  }

  const handleReject = async (id) => {
    try { await rejectSession(id); toast.success('Session rejected'); fetchSessions() }
    catch { toast.error('Failed to reject session') }
  }

  const handleCancel = async (id) => {
    try { await cancelSession(id); toast.success('Session cancelled'); fetchSessions() }
    catch { toast.error('Failed to cancel session') }
  }

  const handleComplete = async (id) => {
    try { await completeSession(id); toast.success('Session completed!'); fetchSessions() }
    catch { toast.error('Failed to complete session') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiCalendar className="w-6 h-6 text-primary-500" /> Sessions
        </h1>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <SessionList
          sessions={sessions}
          currentUserId={user?._id}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
