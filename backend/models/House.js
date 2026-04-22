const mongoose = require('mongoose')

const houseSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  inviteCode: { type: String, required: true, unique: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:   { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

module.exports = mongoose.model('House', houseSchema)