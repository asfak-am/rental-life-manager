const mongoose = require('mongoose')

const rentPaymentSchema = new mongoose.Schema({
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true, index: true }, // YYYY-MM
  amountDue: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidAt: { type: Date },
  lastReminderAt: { type: Date },
}, { timestamps: true })

rentPaymentSchema.index({ houseId: 1, userId: 1, month: 1 }, { unique: true })

module.exports = mongoose.model('RentPayment', rentPaymentSchema)
