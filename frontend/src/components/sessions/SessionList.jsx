import SessionCard from './SessionCard'
import EmptyState from '../common/EmptyState'
import { FiCalendar } from 'react-icons/fi'

export default function SessionList({ sessions = [], onAccept, onReject, onCancel, onComplete, variant, currentUserId }) {
  if (!sessions.length) {
    return (
      <EmptyState
        icon={FiCalendar}
        title="No sessions found"
        description="You don't have any sessions matching this filter."
      />
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard
          key={session._id}
          session={session}
          variant={variant}
          currentUserId={currentUserId}
          onAccept={() => onAccept?.(session._id)}
          onReject={() => onReject?.(session._id)}
          onCancel={() => onCancel?.(session._id)}
          onComplete={() => onComplete?.(session._id)}
        />
      ))}
    </div>
  )
}
