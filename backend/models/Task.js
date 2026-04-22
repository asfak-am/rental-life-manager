const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  houseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  title:      { type: String, required: true, trim: true },
  description:{ type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:     { type: String, enum: ['pending', 'completed'], default: 'pending' },
  priority:   { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  dueDate:    { type: Date },
  completedAt:{ type: Date },
  repeat:     { type: Boolean, default: false },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('Task', taskSchema)