import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getNotifications } from '../api/notifications'

const SocketContext = createContext(null)

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  const { token, user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState({})
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token || !user) return

    getNotifications()
      .then((res) => {
        const data = res.data?.notifications || res.data || []
        setNotifications(data)
      })
      .catch(() => {})

    const newSocket = io(import.meta.env.VITE_API_URL || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      if (user?._id) {
        newSocket.emit('register', user._id)
      }
    })

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users)
    })

    newSocket.on('user_online', (userId) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])])
    })

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId))
    })

    newSocket.on('user_typing', ({ userId, conversationId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter((id) => id !== userId), userId],
      }))
    })

    newSocket.on('user_stop_typing', ({ userId, conversationId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((id) => id !== userId),
      }))
    })

    newSocket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
    })

    newSocket.on('new_message', () => {})

    setSocket(newSocket)
    socketRef.current = newSocket

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [token, user])

  const sendMessage = useCallback((conversationId, content) => {
    if (socket && user) {
      socket.emit('send_message', { conversationId, content, _userId: user._id })
    }
  }, [socket, user])

  const joinRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('join_room', roomId)
    }
  }, [socket])

  const startTyping = useCallback((conversationId) => {
    if (socket && user) {
      socket.emit('typing', { conversationId, _userId: user._id })
    }
  }, [socket, user])

  const stopTyping = useCallback((conversationId) => {
    if (socket && user) {
      socket.emit('stop_typing', { conversationId, _userId: user._id })
    }
  }, [socket, user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, notifications, setNotifications, sendMessage, joinRoom, startTyping, stopTyping }}>
      {children}
    </SocketContext.Provider>
  )
}
