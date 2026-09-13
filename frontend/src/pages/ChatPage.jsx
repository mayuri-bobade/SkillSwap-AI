import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useChat } from '../context/ChatContext'
import { getConversations, getMessages, createConversation, deleteConversation } from '../api/chat'
import { searchUsers } from '../api/users'
import ConversationList from '../components/chat/ConversationList'
import ChatWindow from '../components/chat/ChatWindow'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import { FiMessageCircle, FiPlus, FiSearch } from 'react-icons/fi'

export default function ChatPage() {
  const { user } = useAuth()
  const { socket, onlineUsers, sendMessage: socketSend, startTyping, stopTyping } = useSocket()
  const { setTotalUnread } = useChat()
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await getConversations()
        const convs = res.data || []
        setConversations(convs)

        const targetUserId = searchParams.get('userId')
        if (targetUserId && user) {
          const existingConv = convs.find((c) => {
            const participants = c.participants || []
            return participants.some((p) => {
              const pId = typeof p === 'object' ? (p._id || p.id) : p
              return String(pId) === String(targetUserId)
            })
          })

          if (existingConv) {
            setSelectedConv(existingConv._id)
          } else {
            try {
              const convRes = await createConversation({ participantId: targetUserId })
              const newConv = convRes.data
              setConversations((prev) => [newConv, ...prev])
              setSelectedConv(newConv._id)
            } catch (err) {
              toast.error('Failed to start conversation')
            }
          }
          setSearchParams({})
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [user])

  useEffect(() => {
    if (!socket) return

    const handleMessage = (data) => {
      // Update messages if chat is open
      if (selectedConv && String(data.conversationId) === String(selectedConv)) {
        setMessages((prev) => {
          const incoming = data.message
          const exists = prev.some((m) => {
            if (m._id && incoming._id && m._id === incoming._id) return true
            if (m.id && incoming.id && m.id === incoming.id) return true
            return (
              m.content === incoming.content &&
              String(m.sender?._id || m.sender?.id) === String(incoming.sender?._id || incoming.sender?.id) &&
              Math.abs(new Date(m.createdAt) - new Date(incoming.createdAt)) < 5000
            )
          })
          if (exists) return prev
          return [...prev, incoming]
        })
      }
      // Always update conversation list with last message
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (String(c._id) === String(data.conversationId)) {
            const isOpen = selectedConv && String(data.conversationId) === String(selectedConv)
            return { ...c, lastMessage: data.message, lastMessageAt: data.message.createdAt, unreadCount: isOpen ? 0 : (c.unreadCount || 0) + 1 }
          }
          return c
        })
        return updated.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''))
      })
    }

    socket.on('new_message', handleMessage)
    return () => socket.off('new_message', handleMessage)
  }, [socket, selectedConv])

  useEffect(() => {
    if (selectedConv && socket) {
      socket.emit('join_room', String(selectedConv))
      setConversations((prev) => {
        const conv = prev.find((c) => String(c._id) === String(selectedConv))
        if (conv && conv.unreadCount > 0) {
          setTotalUnread((u) => Math.max(0, u - conv.unreadCount))
        }
        return prev.map((c) =>
          String(c._id) === String(selectedConv) ? { ...c, unreadCount: 0 } : c
        )
      })
      const fetchMessages = async () => {
        try {
          const res = await getMessages(selectedConv)
          const msgs = res.data.messages || res.data || []
          setMessages(msgs)
        } catch (err) {
          console.error('Error fetching messages:', err)
        }
      }
      fetchMessages()
    }
  }, [selectedConv, socket])

  useEffect(() => {
    if (!showNewChat) {
      setSearchQuery('')
      setSearchResults([])
    }
  }, [showNewChat])

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await searchUsers({ skill: searchQuery, limit: 20 })
      setSearchResults(res.data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery.length >= 1) handleSearchUsers() }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleStartChat = async (userId) => {
    try {
      const res = await createConversation({ participantId: userId })
      const conv = res.data
      setShowNewChat(false)
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id)
        if (exists) return prev
        return [conv, ...prev]
      })
      setSelectedConv(conv._id)
      toast.success('Chat started!')
    } catch (err) {
      toast.error('Failed to start chat')
    }
  }

  const handleSend = async (content) => {
    if (!selectedConv || !content) return
    // Optimistically add message to UI
    const tempMsg = {
      id: Date.now(),
      _id: Date.now(),
      conversationId: selectedConv,
      sender: { id: user._id, _id: user._id, name: user.name, avatar: user.avatar || '' },
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    setConversations((prev) => prev.map((c) => {
      if (String(c._id) === String(selectedConv)) {
        return { ...c, lastMessage: tempMsg, lastMessageAt: tempMsg.createdAt }
      }
      return c
    }))
    socketSend(selectedConv, content)
  }

  const handleTyping = () => {
    if (selectedConv && socket) startTyping(selectedConv)
  }

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c._id !== convId))
      if (selectedConv === convId) {
        setSelectedConv(null)
        setMessages([])
      }
      toast.success('Chat deleted')
    } catch (err) {
      toast.error('Failed to delete chat')
    }
  }

  const selectedConversation = conversations.find((c) => c._id === selectedConv)

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className={`${selectedConv ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5" /> Messages
          </h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-500"
            title="New Chat"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConv}
            onSelect={setSelectedConv}
            onDelete={handleDeleteConversation}
            onlineUsers={onlineUsers}
            currentUserId={user?._id}
          />
        </div>
      </div>
      <div className={`${selectedConv ? 'flex' : 'hidden lg:flex'} flex-1`}>
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          onSend={handleSend}
          onTyping={handleTyping}
          onBack={() => setSelectedConv(null)}
          onDelete={handleDeleteConversation}
        />
      </div>

      <Modal isOpen={showNewChat} onClose={() => setShowNewChat(false)} title="Start New Chat">
        <div className="space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search users by skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searching && <LoadingSpinner />}
            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users found</p>
            )}
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartChat(u._id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Avatar src={u.avatar} name={u.name} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </button>
            ))}
            {!searchQuery && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">Type to search for users</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
