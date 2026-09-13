import { createContext, useContext, useState, useEffect } from 'react'
import { getConversations } from '../api/chat'
import { useSocket } from './SocketContext'

const ChatContext = createContext(null)

export function useChat() {
  return useContext(ChatContext)
}

export function ChatProvider({ children }) {
  const [totalUnread, setTotalUnread] = useState(0)
  const { socket } = useSocket()

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getConversations()
        const convs = res.data || []
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        setTotalUnread(total)
      } catch (err) {
        // silent
      }
    }
    fetchUnread()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handleMessage = (data) => {
      setTotalUnread((prev) => prev + 1)
    }
    socket.on('new_message', handleMessage)
    return () => socket.off('new_message', handleMessage)
  }, [socket])

  return (
    <ChatContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </ChatContext.Provider>
  )
}
