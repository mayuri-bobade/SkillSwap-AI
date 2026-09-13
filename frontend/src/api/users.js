import api from './axios'

export const getProfile = (id) => api.get(`/users/${id}`)
export const updateProfile = (data) => api.put('/users/profile', data)
export const searchUsers = (params) => api.get('/users/search', { params })
export const uploadAvatar = (formData) => api.post('/users/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
