// ─── models/User.js ───────────────────────────────────────────────────────────
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String },          // null for Google OAuth users
  avatar:       { type: String },
  avatarPublicId: { type: String },
  bio:          { type: String },
  displayName:  { type: String },
  googleId:     { type: String },
  isVerified:   { type: Boolean, default: false },
  otpCode:      { type: String },
  otpExpires:   { type: Date },
  resetCode:    { type: String },
  resetExpires: { type: Date },
  houseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'House', default: null },
  notifications: {
    expense: { type: Boolean, default: true },
    task:    { type: Boolean, default: true },
    payment: { type: Boolean, default: true },
  },
  currency: { type: String, enum: ['LKR', 'INR', 'USD', 'EUR', 'GBP'], default: 'LKR' },
}, { timestamps: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

userSchema.methods.toPublic = function () {
  const { password, __v, ...rest } = this.toObject()
  return rest
}

module.exports = mongoose.model('User', userSchema)