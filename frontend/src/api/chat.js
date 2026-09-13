import api from './axios'

export const getConversations = () => api.get('/chat/conversations')
export const getMessages = (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params })
export const createConversation = (data) => api.post('/chat/conversations', data)
export const deleteConversation = (conversationId) => api.delete(`/chat/conversations/${conversationId}`)
