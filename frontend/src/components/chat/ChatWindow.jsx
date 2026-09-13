import { useState, useEffect } from 'react'
import MessageList from '../chat/MessageList'
import MessageInput from '../chat/MessageInput'
import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi'

export default function ChatWindow({ conversation, messages, onSend, onTyping, onBack, onDelete }) {
  const { user } = useAuth()
  const { onlineUsers, typingUsers } = useSocket()
  const [typing, setTyping] = useState(false)

  const otherUser = conversation?.participants?.find((p) => p._id !== user?._id && p.id !== user?.id) || conversation?.otherUser
  const isOnline = onlineUsers.includes(otherUser?._id)
  const convTypingUsers = typingUsers[conversation?._id] || []

  useEffect(() => {
    setTyping(convTypingUsers.length > 0)
  }, [convTypingUsers])

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <p className="font-medium">Select a conversation</p>
          <p className="text-sm">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Avatar src={otherUser?.avatar} name={otherUser?.name} online={isOnline} />
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">{otherUser?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {typing ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDelete?.(conversation._id)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <MessageList messages={messages} currentUser={user} typingUsers={convTypingUsers} />
      <MessageInput onSend={onSend} onTyping={onTyping} />
    </div>
  )
}
