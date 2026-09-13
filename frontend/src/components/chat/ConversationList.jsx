import Avatar from '../common/Avatar'
import { formatDistanceToNow } from 'date-fns'

export default function ConversationList({ conversations = [], selectedId, onSelect, onlineUsers = [], currentUserId }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {conversations.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No conversations yet</p>
        </div>
      )}
      {conversations.map((conv) => {
        const otherUser = conv.participants?.find((p) => p._id !== currentUserId) || conv.otherUser
        const isOnline = onlineUsers.includes(otherUser?._id)

        return (
          <div
            key={conv._id}
            className={`relative group flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
              selectedId === conv._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
          >
            <button onClick={() => onSelect(conv._id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
              <Avatar src={otherUser?.avatar} name={otherUser?.name} online={isOnline} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{otherUser?.name}</p>
                  {conv.lastMessage?.createdAt && (
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage?.content || 'Start a conversation'}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
