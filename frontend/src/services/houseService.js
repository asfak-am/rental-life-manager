import api from './api'


// ─── House ───────────────────────────────────────────────────────────────────
export const houseService = {
  get:           ()     => api.get('/house'),
  create:        (data) => api.post('/house/create', data),
  join:          (code) => api.post('/house/join', { inviteCode: code }),
  inviteMember:  (data) => api.post('/house/invite-member', data),
  getInviteCode: ()     => api.get('/house/invite-code'),
  getRentStatus: (month) => api.get('/house/rent-status', { params: { month } }),
  getRentStatuses: (months = []) => api.get('/house/rent-statuses', { params: { months: Array.isArray(months) ? months.join(',') : '' } }),
  getRentHistory: (params = {}) => api.get('/house/rent-history', { params }),
  updateRentConfig: (monthlyRentAmount) => api.put('/house/rent-config', { monthlyRentAmount }),
  payRent: (month) => api.post('/house/pay-rent', { month }),
  payRentForMember: (userId, month) => api.post('/house/pay-rent/member', { userId, month }),
  leave:         ()     => api.delete('/house/leave'),
  removeMember:  (userId, opts = {}) => api.delete(`/house/members/${userId}`, { params: { confirm: opts.confirm ? true : undefined } }),
  refreshCode:   ()     => api.post('/house/refresh-code'),
}
