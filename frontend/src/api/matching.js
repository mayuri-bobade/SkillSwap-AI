import api from './axios'

export const findMatches = (params) => api.get('/matching', { params })
