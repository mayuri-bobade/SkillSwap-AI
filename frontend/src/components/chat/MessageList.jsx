import { useEffect, useRef } from 'react'
import Avatar from '../common/Avatar'

export default function MessageList({ messages = [], currentUser, typingUsers = [] }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.map((msg, i) => {
        const isMine = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id
        const showAvatar = i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id

        return (
          <div key={msg._id || i} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
            {!isMine && showAvatar && (
              <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="sm" />
            )}
            {!isMine && !showAvatar && <div className="w-8" />}
            <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl ${
                isMine
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1 px-2">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )
      })}

      {typingUsers.length > 0 && (
        <div className="flex gap-2 items-center">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5 rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
