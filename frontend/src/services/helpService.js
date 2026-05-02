import api from './api'

export const helpService = {
  submitContact: (payload) => api.post('/help/contact', payload),
}