import { useState, useEffect } from 'react'
import { getAllUsers, toggleUserStatus, getStats, getSessions } from '../api/admin'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { FiShield, FiUsers, FiCalendar, FiDollarSign, FiAlertTriangle } from 'react-icons/fi'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AdminPage() {
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, sessionsRes] = await Promise.all([
          getStats().catch(() => ({ data: {} })),
          getAllUsers({ limit: 20 }).catch(() => ({ data: { users: [] } })),
          getSessions({ limit: 20 }).catch(() => ({ data: { sessions: [] } })),
        ])
        setStats(statsRes.data || {})
        setUsers(usersRes.data.users || usersRes.data || [])
        setSessions(sessionsRes.data.sessions || sessionsRes.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId)
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u))
      toast.success('User status updated')
    } catch (err) {
      toast.error('Failed to update user status')
    }
  }

  if (loading) return <LoadingSpinner />

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [45, 62, 78, 54, 89, 120],
      backgroundColor: 'rgba(124, 58, 237, 0.8)',
      borderRadius: 6,
    }],
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'sessions', label: 'Sessions' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FiShield className="w-6 h-6 text-primary-500" /> Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiUsers, label: 'Total Users', value: stats.totalUsers || users.length || 0, color: 'primary' },
          { icon: FiCalendar, label: 'Total Sessions', value: stats.totalSessions || sessions.length || 0, color: 'secondary' },
          { icon: FiDollarSign, label: 'Tokens Circulated', value: stats.totalTokens || 0, color: 'accent' },
          { icon: FiAlertTriangle, label: 'Active Reports', value: stats.activeReports || 0, color: 'yellow' },
        ].map((s) => {
          const colorMap = {
            primary: { bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-500 dark:text-primary-400' },
            secondary: { bg: 'bg-secondary-50 dark:bg-secondary-900/30', text: 'text-secondary-500 dark:text-secondary-400' },
            accent: { bg: 'bg-accent-50 dark:bg-accent-900/30', text: 'text-accent-500 dark:text-accent-400' },
            yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-500 dark:text-yellow-400' },
          }
          const colors = colorMap[s.color] || colorMap.primary
          return (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <s.icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Platform Growth</h3>
          <div className="h-72">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="py-3 flex items-center gap-2">
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=7c3aed&color=fff`} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="py-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700">{u.role}</span></td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${u.isActive !== false ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => handleToggleStatus(u._id)} className="text-sm text-primary-500 hover:underline">
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions */}
      {activeTab === 'sessions' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Student</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Skill</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td className="py-3 text-gray-900 dark:text-white">{s.teacher?.name}</td>
                  <td className="py-3 text-gray-900 dark:text-white">{s.learner?.name}</td>
                  <td className="py-3 text-primary-500">{s.skill?.name || s.skillName}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === 'completed' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' :
                      s.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{s.createdAt ? format(new Date(s.createdAt), 'MMM d, yyyy') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
