import api from './axios'

export const generateQuestions = (data) => api.post('/verification/generate-questions', data)
export const submitAnswers = (data) => api.post('/verification/submit-answers', data)
export const getSkillVerification = (skillId) => api.get(`/verification/skill/${skillId}`)
export const getUserVerifications = (userId) => api.get(`/verification/user/${userId}`)
