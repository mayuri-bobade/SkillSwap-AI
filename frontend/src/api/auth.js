import api from './axios'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const googleLogin = (data) => api.post('/auth/google', data)
export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)
export const updatePassword = (data) => api.put('/auth/password', data)
export const deleteAccount = () => api.delete('/auth/account')
