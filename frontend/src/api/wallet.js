import api from './axios'

export const getWallet = () => api.get('/wallet')
export const getTransactions = (params) => api.get('/wallet/transactions', { params })
export const getBalance = () => api.get('/wallet/balance')
