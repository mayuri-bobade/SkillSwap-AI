import api from './axios'

export const getAllUsers = (params) => api.get('/admin/users', { params })
export const toggleUserStatus = (userId) => api.put(`/admin/users/${userId}/toggle-status`)
export const getReports = (params) => api.get('/admin/reports', { params })
export const resolveReport = (reportId, data) => api.put(`/admin/reports/${reportId}/resolve`, data)
export const getStats = () => api.get('/admin/stats')
export const getSessions = (params) => api.get('/admin/sessions', { params })
