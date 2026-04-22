const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  type: {
    type: String,
    enum: ['group', 'direct'],
    default: 'group',
    index: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1200,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true })

chatMessageSchema.index({ houseId: 1, type: 1, createdAt: -1 })
chatMessageSchema.index({ houseId: 1, senderId: 1, recipientId: 1, createdAt: -1 })

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
