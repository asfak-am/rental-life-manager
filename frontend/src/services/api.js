import axios from 'axios'

const normalizeApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_URL || '').trim()
  if (!raw) return 'http://localhost:5000/api'

  const withoutTrailingSlash = raw.replace(/\/+$/, '')
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('rl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — token expired
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const token = localStorage.getItem('rl_token')
    const requestUrl = err.config?.url || ''
    const isLoginRequest = /\/auth\/login\/?$/i.test(requestUrl)

    // Keep login-page credential errors local so UI can show the backend message.
    if (status === 401 && token && !isLoginRequest) {
      localStorage.removeItem('rl_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api