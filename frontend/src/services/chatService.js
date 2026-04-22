import api from './api'

export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: ({ type = 'group', userId }) =>
    api.get('/chat/messages', { params: { type, userId } }),
  sendMessage: (payload) => api.post('/chat/messages', payload),
}
