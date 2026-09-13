import api from './axios'

export const addSkill = (data) => api.post('/skills', data)
export const removeSkill = (id) => api.delete(`/skills/${id}`)
export const getMySkills = () => api.get('/skills/my')
export const getSkillCategories = () => api.get('/skills/categories')
