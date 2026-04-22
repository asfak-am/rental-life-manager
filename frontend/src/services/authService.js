import api from './api'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  googleLogin:   (token) => api.post('/auth/google', { token }),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}
