import api from './api'

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const taskService = {
  getAll:  ()           => api.get('/task'),
  add:     (data)       => api.post('/task/add', data),
  update:  (id, data)   => api.put(`/task/${id}`, data),
  remove:  (id)         => api.delete(`/task/${id}`),
}