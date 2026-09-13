import api from './axios'

export const createSession = (data) => api.post('/sessions', data)
export const acceptSession = (id) => api.put(`/sessions/${id}/accept`)
export const rejectSession = (id, reason) => api.put(`/sessions/${id}/reject`, { reason })
export const cancelSession = (id, reason) => api.put(`/sessions/${id}/cancel`, { reason })
export const completeSession = (id) => api.put(`/sessions/${id}/complete`)
export const getMySessions = (params) => api.get('/sessions/my', { params })
export const getSession = (id) => api.get(`/sessions/${id}`)
