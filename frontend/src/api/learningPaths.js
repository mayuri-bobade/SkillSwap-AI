import api from './axios'

export const generateLearningPath = (data) => api.post('/learning-paths/generate', data)
export const recommendTeachers = (data) => api.post('/learning-paths/recommend-teachers', data)
