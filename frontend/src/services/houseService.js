import api from './api'


// ─── House ───────────────────────────────────────────────────────────────────
export const houseService = {
  get:           ()     => api.get('/house'),
  create:        (data) => api.post('/house/create', data),
  join:          (code) => api.post('/house/join', { inviteCode: code }),
  inviteMember:  (data) => api.post('/house/invite-member', data),
  getInviteCode: ()     => api.get('/house/invite-code'),
  leave:         ()     => api.delete('/house/leave'),
  refreshCode:   ()     => api.post('/house/refresh-code'),
}
