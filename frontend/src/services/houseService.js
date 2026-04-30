import api from './api'


// ─── House ───────────────────────────────────────────────────────────────────
export const houseService = {
  get:           ()     => api.get('/house'),
  create:        (data) => api.post('/house/create', data),
  join:          (code) => api.post('/house/join', { inviteCode: code }),
  inviteMember:  (data) => api.post('/house/invite-member', data),
  getInviteCode: ()     => api.get('/house/invite-code'),
  getRentStatus: (month) => api.get('/house/rent-status', { params: { month } }),
  getRentHistory: () => api.get('/house/rent-history'),
  updateRentConfig: (monthlyRentAmount) => api.put('/house/rent-config', { monthlyRentAmount }),
  payRent: (month) => api.post('/house/pay-rent', { month }),
  payRentForMember: (userId, month) => api.post('/house/pay-rent/member', { userId, month }),
  leave:         ()     => api.delete('/house/leave'),
  refreshCode:   ()     => api.post('/house/refresh-code'),
}
