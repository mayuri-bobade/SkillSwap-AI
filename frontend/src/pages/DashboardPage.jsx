import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatsCard from '../components/dashboard/StatsCard'
import ActivityChart from '../components/dashboard/ActivityChart'
import RecentSessions from '../components/dashboard/RecentSessions'
import { getMySessions } from '../api/sessions'
import { getWallet } from '../api/wallet'
import { FiDollarSign, FiBookOpen, FiUsers, FiCheckCircle, FiSearch, FiMessageCircle, FiBook } from 'react-icons/fi'

export default function DashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, totalSpent: 0 })
  const [stats, setStats] = useState({ taught: 0, learned: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, walletRes] = await Promise.all([
          getMySessions({ limit: 5 }).catch(() => ({ data: { sessions: [] } })),
          getWallet().catch(() => ({ data: { balance: 0, totalEarned: 0, totalSpent: 0 } })),
        ])
        setSessions(sessionsRes.data.sessions || sessionsRes.data || [])
        setWallet(walletRes.data || { balance: 0, totalEarned: 0, totalSpent: 0 })

        const allSessions = sessionsRes.data.sessions || sessionsRes.data || []
        const completedSessions = allSessions.filter((s) => s.status === 'completed')
        const taughtCount = user?.skillsTaught || 0
        const learnedCount = user?.skillsLearned || 0
        setStats({
          taught: taughtCount,
          learned: learnedCount,
          completed: completedSessions.length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your skill exchange.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FiDollarSign} title="Time Tokens" value={wallet.balance || 0} color="primary" delay={0} />
        <StatsCard icon={FiBookOpen} title="Skills Taught" value={stats.taught} color="accent" delay={0.1} />
        <StatsCard icon={FiUsers} title="Skills Learned" value={stats.learned} color="secondary" delay={0.2} />
        <StatsCard icon={FiCheckCircle} title="Sessions Done" value={stats.completed} color="yellow" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <RecentSessions sessions={sessions} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/match" className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 group-hover:bg-primary-500 transition-colors">
            <FiSearch className="w-6 h-6 text-primary-500 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Find a Match</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Discover skill partners</p>
          </div>
        </Link>
        <Link to="/chat" className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group">
          <div className="p-3 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 group-hover:bg-secondary-500 transition-colors">
            <FiMessageCircle className="w-6 h-6 text-secondary-500 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Start Chat</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Message your partners</p>
          </div>
        </Link>
        <Link to="/search" className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group">
          <div className="p-3 rounded-xl bg-accent-100 dark:bg-accent-900/30 group-hover:bg-accent-500 transition-colors">
            <FiBook className="w-6 h-6 text-accent-500 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Browse Skills</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Explore all skills</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
