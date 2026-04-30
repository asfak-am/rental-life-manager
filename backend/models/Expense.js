const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  houseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  title:     { type: String, required: true, trim: true },
  amount:    { type: Number, required: true, min: 0.01 },
  paidBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
  participants: [{
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amountOwed: { type: Number, required: true },
    settled:    { type: Boolean, default: false },
    settledAt:  { type: Date },
  }],
  category:  { type: String, enum: ['Food', 'Rent', 'Utilities', 'Water Bill', 'Electricity Bill', 'Transport', 'Entertainment', 'Other'], default: 'Other' },
  billMonth: { type: String }, // YYYY-MM for recurring bills like water/electricity
  date:      { type: Date, default: Date.now },
  recurring: { type: Boolean, default: false },
  recurrenceRule: { type: String },       // e.g. 'monthly'
  auditTrail: [{
    action:    String,
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

expenseSchema.index({ houseId: 1, date: -1, createdAt: -1 })
expenseSchema.index({ houseId: 1, category: 1, date: -1 })
expenseSchema.index({ houseId: 1, billMonth: 1, date: -1 })

module.exports = mongoose.model('Expense', expenseSchema)