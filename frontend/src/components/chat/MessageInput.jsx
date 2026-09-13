import { useState } from 'react'
import { FiSend, FiMic, FiImage } from 'react-icons/fi'

export default function MessageInput({ onSend, onTyping }) {
  const [message, setMessage] = useState('')
  const [typingTimeout, setTypingTimeout] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    onSend(message.trim())
    setMessage('')
  }

  const handleChange = (e) => {
    setMessage(e.target.value)
    if (onTyping) {
      onTyping()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <FiImage className="w-5 h-5" />
        </button>
        <input
          type="text"
          className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm dark:text-white"
          placeholder="Type a message..."
          value={message}
          onChange={handleChange}
        />
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <FiMic className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
