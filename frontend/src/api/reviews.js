import api from './axios'

export const createReview = (data) => api.post('/reviews', data)
export const deleteReview = (id) => api.delete(`/reviews/${id}`)
export const getReviewsForUser = (userId, params) => api.get(`/reviews/user/${userId}`, { params })
export const getMyReviews = (params) => api.get('/reviews/my', { params })
