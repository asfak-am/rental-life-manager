import api from './api'


// ─── Balances ─────────────────────────────────────────────────────────────────
export const balanceService = {
  getRaw:        ()     => api.get('/balance'),
  getSimplified: ()     => api.get('/balance/simplified'),
  settle:        (data) => api.post('/balance/settle', data),
}
