const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const House = require('../models/House')
const Notification = require('../models/Notification')
const { sendMail } = require('../utils/mailer')
const { isCloudinaryConfigured, uploadBase64Image, deleteImage } = require('../utils/cloudinary')

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })

const getPublicUser = (user) => {
	if (!user) return null
	const plain = typeof user.toObject === 'function' ? user.toObject() : user
	const { password, __v, ...rest } = plain
	return rest
}

const findHouseByInviteCode = async (inviteCode) => House.findOne({ inviteCode: inviteCode.trim().toUpperCase() })

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const setOtp = (user, fieldPrefix = 'otp') => {
	const otp = generateOtp()
	user[`${fieldPrefix}Code`] = otp
	user[`${fieldPrefix}Expires`] = new Date(Date.now() + 10 * 60 * 1000)
	return otp
}

const sendOtpEmail = async (email, otp, title = 'Verify your account') => {
	await sendMail({
		to: email,
		subject: `${title} - Rental Life`,
		html: `
			<div style="font-family:Arial,sans-serif;line-height:1.5">
				<h2>${title}</h2>
				<p>Your one-time code is:</p>
				<p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
				<p>This code expires in 10 minutes.</p>
			</div>
		`,
	})
}

const register = async (req, res, next) => {
	try {
		const { name, email, password, inviteCode } = req.body
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, email and password are required' })
		}

		const existing = await User.findOne({ email: email.toLowerCase().trim() })
		if (existing) return res.status(400).json({ message: 'Email already exists' })

		let house = null
		if (inviteCode && inviteCode.trim()) {
			house = await findHouseByInviteCode(inviteCode)
			if (!house) return res.status(400).json({ message: 'Invalid invite code' })
		}

		const user = await User.create({
			name,
			email,
			password,
			isVerified: false,
			houseId: house ? house._id : null,
		})

		const otp = setOtp(user)
		await user.save()
		await sendOtpEmail(user.email, otp)

		if (house) {
			house.members.push({ userId: user._id, role: 'member' })
			await house.save()

			const notifications = house.members
				.filter(member => String(member.userId) !== String(user._id))
				.map(member => ({
					userId: member.userId,
					houseId: house._id,
					type: 'member',
					title: 'New housemate joined',
					body: `${name} joined ${house.name}`,
					link: '/settings',
				}))

			if (notifications.length > 0) await Notification.insertMany(notifications)
		}

		return res.status(201).json({
			requiresVerification: true,
			email: user.email,
			message: 'Account created. Enter the OTP sent to your email.',
		})
	} catch (error) {
		next(error)
	}
}

const login = async (req, res, next) => {
	try {
		const { email, password } = req.body
		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' })
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' })
		if (!user.isVerified) {
			return res.status(403).json({
				requiresVerification: true,
				email: user.email,
				message: 'Please verify your email with OTP first',
			})
		}

		const matched = await user.matchPassword(password)
		if (!matched) return res.status(401).json({ message: 'Invalid credentials' })

		const token = signToken(user._id)
		return res.json({ token, user: getPublicUser(user) })
	} catch (error) {
		next(error)
	}
}

const googleLogin = async (req, res, next) => {
	try {
		const token = req.body.token || req.body.idToken || req.body.accessToken
		if (!token) return res.status(400).json({ message: 'Google token is required' })
		let payload = null

		if (googleClient) {
			try {
				const ticket = await googleClient.verifyIdToken({
					idToken: token,
					audience: process.env.GOOGLE_CLIENT_ID,
				})
				payload = ticket.getPayload()
			} catch {
				// If token is an OAuth access token, fallback to Google userinfo endpoint.
			}
		}

		if (!payload?.email) {
			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
				headers: { Authorization: `Bearer ${token}` },
			})

			if (userInfoResponse.ok) {
				payload = await userInfoResponse.json()
			}
		}

		if (!payload?.email) return res.status(400).json({ message: 'Invalid Google token' })

		let user = await User.findOne({ email: payload.email.toLowerCase() })
		if (!user) {
			user = await User.create({
				name: payload.name || payload.given_name || payload.email.split('@')[0],
				email: payload.email.toLowerCase(),
				googleId: payload.sub,
				avatar: payload.picture,
				isVerified: true,
			})
		} else if (!user.googleId) {
			user.googleId = payload.sub
			user.avatar = user.avatar || payload.picture
			user.isVerified = true
			if (!user.name && payload.name) user.name = payload.name
			await user.save()
		}

		const jwtToken = signToken(user._id)
		return res.json({ token: jwtToken, user: getPublicUser(user) })
	} catch (error) {
		next(error)
	}
}

const getMe = async (req, res, next) => {
	try {
		return res.json({ user: getPublicUser(req.user) })
	} catch (error) {
		next(error)
	}
}

const logout = async (req, res, next) => {
	try {
		return res.json({ message: 'Logged out' })
	} catch (error) {
		next(error)
	}
}

const updateProfile = async (req, res, next) => {
	try {
		const currentUser = await User.findById(req.user._id)
		if (!currentUser) return res.status(404).json({ message: 'User not found' })

		const updates = {}
		const updatableFields = ['displayName', 'bio', 'name']
		updatableFields.forEach(key => {
			if (req.body[key] !== undefined) updates[key] = req.body[key]
		})

		if (req.body.avatar !== undefined) {
			const incomingAvatar = String(req.body.avatar || '').trim()

			if (incomingAvatar.startsWith('data:image/')) {
				if (!isCloudinaryConfigured()) {
					return res.status(400).json({ message: 'Image upload is not configured on the server' })
				}

				const uploaded = await uploadBase64Image(incomingAvatar)

				updates.avatar = uploaded.secure_url
				updates.avatarPublicId = uploaded.public_id

				if (currentUser.avatarPublicId && currentUser.avatarPublicId !== uploaded.public_id) {
					await deleteImage(currentUser.avatarPublicId)
				}
			} else if (!incomingAvatar) {
				updates.avatar = ''
				updates.avatarPublicId = ''

				if (currentUser.avatarPublicId) {
					await deleteImage(currentUser.avatarPublicId)
				}
			} else {
				updates.avatar = incomingAvatar
				if (req.body.avatarPublicId !== undefined) {
					updates.avatarPublicId = req.body.avatarPublicId
				}
			}
		}

		// Keep legacy `name` in sync so existing UI paths that still read name
		// immediately reflect the chosen display name.
		if (req.body.displayName && req.body.name === undefined) {
			updates.name = req.body.displayName
		}

		const notificationUpdates = req.body.notifications || {}
		if (req.body.notifyExpense !== undefined) notificationUpdates.expense = Boolean(req.body.notifyExpense)
		if (req.body.notifyTask !== undefined) notificationUpdates.task = Boolean(req.body.notifyTask)
		if (req.body.notifySettle !== undefined) notificationUpdates.payment = Boolean(req.body.notifySettle)

		if (Object.keys(notificationUpdates).length > 0) {
			updates.notifications = {
				...req.user.notifications,
				...notificationUpdates,
			}
		}

		const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
		return res.json({ user: getPublicUser(user) })
	} catch (error) {
		next(error)
	}
}

const verifyOtp = async (req, res, next) => {
	try {
		const { email, otp } = req.body
		if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.status(404).json({ message: 'Account not found' })
		if (user.isVerified) return res.json({ message: 'Email already verified' })

		if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
			return res.status(400).json({ message: 'OTP expired, request a new one' })
		}

		if (String(user.otpCode) !== String(otp).trim()) {
			return res.status(400).json({ message: 'Invalid OTP' })
		}

		user.isVerified = true
		user.otpCode = undefined
		user.otpExpires = undefined
		await user.save()

		const token = signToken(user._id)
		return res.json({ token, user: getPublicUser(user) })
	} catch (error) {
		next(error)
	}
}

const resendOtp = async (req, res, next) => {
	try {
		const { email } = req.body
		if (!email) return res.status(400).json({ message: 'Email is required' })

		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.status(404).json({ message: 'Account not found' })
		if (user.isVerified) return res.status(400).json({ message: 'Email already verified' })

		const otp = setOtp(user)
		await user.save()
		await sendOtpEmail(user.email, otp)

		return res.json({ message: 'OTP sent successfully' })
	} catch (error) {
		next(error)
	}
}

const forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body
		if (!email) return res.status(400).json({ message: 'Email is required' })

		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.json({ message: 'If the account exists, reset code has been sent' })

		const resetOtp = setOtp(user, 'reset')
		await user.save()
		await sendOtpEmail(user.email, resetOtp, 'Reset your password')

		return res.json({ message: 'If the account exists, reset code has been sent' })
	} catch (error) {
		next(error)
	}
}

const resetPassword = async (req, res, next) => {
	try {
		const { email, otp, newPassword } = req.body
		if (!email || !otp || !newPassword) {
			return res.status(400).json({ message: 'Email, OTP and newPassword are required' })
		}

		if (String(newPassword).length < 6) {
			return res.status(400).json({ message: 'Password must be at least 6 characters' })
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.status(404).json({ message: 'Account not found' })

		if (!user.resetCode || !user.resetExpires || user.resetExpires < new Date()) {
			return res.status(400).json({ message: 'Reset code expired, request a new one' })
		}

		if (String(user.resetCode) !== String(otp).trim()) {
			return res.status(400).json({ message: 'Invalid reset code' })
		}

		user.password = newPassword
		user.resetCode = undefined
		user.resetExpires = undefined
		await user.save()

		return res.json({ message: 'Password reset successful' })
	} catch (error) {
		next(error)
	}
}

module.exports = {
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
}
