import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Avatar from '../common/Avatar'
import { FiArrowRight } from 'react-icons/fi'

export default function RecentSessions({ sessions = [] }) {
  if (!sessions.length) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sessions yet. Find a match to get started!</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Sessions</h3>
        <Link to="/sessions" className="text-sm text-primary-500 hover:underline flex items-center gap-1">
          View all <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {sessions.slice(0, 5).map((session) => (
          <Link
            key={session._id}
            to={`/sessions/${session._id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Avatar
              src={session.teacher?.avatar || session.learner?.avatar}
              name={session.teacher?.name || session.learner?.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.skill?.name || session.skillName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {session.teacher?.name || session.learner?.name} · {format(new Date(session.scheduledAt || session.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              session.status === 'completed' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' :
              session.status === 'upcoming' ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' :
              session.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {session.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
