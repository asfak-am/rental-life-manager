const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const {
	register,
	login,
	googleLogin,
	getMe,
	logout,
	updateProfile,
	verifyOtp,
	resendOtp,
	forgotPassword,
	resetPassword,
} = require('../controllers/authController')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleLogin)
router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)
router.put('/profile', protect, updateProfile)

module.exports = router
