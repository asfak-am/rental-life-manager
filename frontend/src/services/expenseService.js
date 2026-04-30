import api from './api'

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenseService = {
  getAll:    (params) => api.get('/expense/all', { params }),
  getById:   (id)     => api.get(`/expense/${id}`),
  add:       (data)   => api.post('/expense/add', data),
  update:    (id, data) => api.put(`/expense/${id}`, data),
  remove:    (id)     => api.delete(`/expense/${id}`),
  summary:   ()       => api.get('/expense/summary'),
  utilityTrend: (range) => api.get('/expense/utility-trend', { params: { range } }),
}
