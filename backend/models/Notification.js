const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House' },
  type:    { type: String, enum: ['expense', 'payment', 'task', 'member'], default: 'expense' },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  amount:  { type: Number },
  read:    { type: Boolean, default: false },
  link:    { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)