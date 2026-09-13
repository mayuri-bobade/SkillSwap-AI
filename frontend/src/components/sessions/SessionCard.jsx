import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Avatar from '../common/Avatar'
import { FiCheck, FiX, FiVideo, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function SessionCard({ session, onAccept, onReject, onCancel, onComplete, variant = 'default', currentUserId }) {
  const isTeacher = String(session.teacher?._id) === String(currentUserId)
  const otherUser = isTeacher ? session.student : session.teacher
  const isCompact = variant === 'compact'

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    accepted: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    completed: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  }

  return (
    <div className={`card hover:shadow-md transition-shadow ${isCompact ? 'p-4' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar src={otherUser?.avatar} name={otherUser?.name} size={isCompact ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-medium text-gray-900 dark:text-white ${isCompact ? 'text-sm' : ''}`}>
                {otherUser?.name}
              </p>
              <p className="text-sm text-primary-500 font-medium">{session.skill?.name || session.skillName}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
              {session.status}
            </span>
          </div>

          {!isCompact && (
            <>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FiClock className="w-4 h-4" />
                  {session.scheduledAt ? format(new Date(session.scheduledAt), 'MMM d, h:mm a') : 'Not scheduled'}
                </span>
                <span>{session.duration || 60} min</span>
                <span className="text-primary-500 font-medium">{session.tokens || 1} token(s)</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {session.status === 'pending' && isTeacher && (
                  <>
                    <button onClick={onAccept} className="btn-accent text-sm py-1.5 px-3 flex items-center gap-1">
                      <FiCheck className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={onReject} className="btn-ghost text-sm py-1.5 px-3 text-red-500 hover:text-red-600 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {session.status === 'accepted' && (
                  <button
                    onClick={() => {
                      const link = session.meetingLink || `https://meet.jit.si/skillswap-${session._id}`
                      window.open(link, '_blank')
                    }}
                    className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                  >
                    <FiVideo className="w-4 h-4" /> Join Video
                  </button>
                )}
                {session.status === 'accepted' && !isTeacher && (
                  <button onClick={onComplete} className="btn-accent text-sm py-1.5 px-3">
                    Complete
                  </button>
                )}
                {(session.status === 'pending' || session.status === 'accepted') && (
                  <button onClick={onCancel} className="btn-ghost text-sm py-1.5 px-3 text-gray-500">
                    Cancel
                  </button>
                )}
                <Link to={`/sessions/${session._id}`} className="btn-ghost text-sm py-1.5 px-3 ml-auto">
                  Details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
