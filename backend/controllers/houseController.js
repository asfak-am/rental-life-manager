const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { generateInviteCode } = require('../utils/inviteCode')
const RentPayment = require('../models/RentPayment')
const { getRentStatusForUser, runRentRemindersForMonth, toMonthKey } = require('../services/rentService')

const DEFAULT_CLIENT_URL = 'https://rental-life.vercel.app'

const isLocalhostUrl = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(String(value).trim().replace(/\/+$/, ''))

const resolveClientBaseUrl = () => {
	const raw = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || DEFAULT_CLIENT_URL).trim()
	const normalized = raw.replace(/\/+$/, '')
	return isLocalhostUrl(normalized) ? DEFAULT_CLIENT_URL : normalized
}

const buildInviteLink = (inviteCode, email) => {
	const baseUrl = resolveClientBaseUrl()
	const path = `/invite/${encodeURIComponent(String(inviteCode || '').trim().toUpperCase())}`
	if (!email) return `${baseUrl}${path}`
	return `${baseUrl}${path}?email=${encodeURIComponent(email)}`
}

const getPublicUser = (user) => {
	const plain = typeof user.toObject === 'function' ? user.toObject() : user
	const { password, __v, ...rest } = plain
	return rest
}

const buildHousePayload = async (house) => {
	const members = await User.find({ _id: { $in: house.members.map(member => member.userId) } }).select('-password')
	const orderedMembers = house.members
		.map(member => members.find(user => String(user._id) === String(member.userId)))
		.filter(Boolean)
		.map(member => getPublicUser(member))

	return { house, members: orderedMembers }
}

const runRentRemindersSafely = (args) => {
	void runRentRemindersForMonth(args).catch(error => {
		console.error('Rent reminder check failed:', error)
	})
}

const requireHouse = async (userId) => {
	const user = await User.findById(userId)
	if (!user?.houseId) return null
	return House.findById(user.houseId)
}

const ensureUniqueCode = async () => {
	let code = generateInviteCode()
	while (await House.exists({ inviteCode: code })) {
		code = generateInviteCode()
	}
	return code
}

const createHouse = async (req, res, next) => {
	try {
		const currentUser = await User.findById(req.user._id)
		if (currentUser.houseId) return res.status(400).json({ message: 'You are already in a house' })

		const name = req.body.name?.trim() || 'My House'
		const inviteCode = await ensureUniqueCode()

		const house = await House.create({
			name,
			inviteCode,
			members: [{ userId: req.user._id, role: 'admin' }],
		})

		currentUser.houseId = house._id
		await currentUser.save()

		const payload = await buildHousePayload(house)
		return res.status(201).json(payload)
	} catch (error) {
		next(error)
	}
}

const inviteMember = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const membership = house.members.find(member => String(member.userId) === String(req.user._id))
		if (!membership) {
			return res.status(403).json({ message: 'Only house members can invite members' })
		}

		const email = String(req.body.email || '').trim().toLowerCase()
		if (!email) return res.status(400).json({ message: 'Email is required' })

		const inviteUrl = buildInviteLink(house.inviteCode, email)
		await require('../utils/mailer').sendMail({
			to: email,
			subject: `You're invited to ${house.name} on Rental Life`,
			html: `
				<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
					<h2 style="margin:0 0 12px">You're invited to ${house.name}</h2>
					<p style="margin:0 0 16px">Open the link below to join the house. If you already have an account, sign in and you'll be added automatically. If not, create your account first and continue with the invitation.</p>
					<p style="margin:24px 0">
						<a href="${inviteUrl}" style="display:inline-block;background:#5f52f2;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Join the house</a>
					</p>
					<p style="font-size:12px;color:#6b7280">If the button doesn't work, copy this link: ${inviteUrl}</p>
				</div>
			`,
		})

		return res.json({ message: 'Invitation sent' })
	} catch (error) {
		next(error)
	}
}

const joinHouse = async (req, res, next) => {
	try {
		const inviteCode = (req.body.inviteCode || req.body.code || '').trim().toUpperCase()
		if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' })

		const currentUser = await User.findById(req.user._id)
		if (currentUser.houseId) return res.status(400).json({ message: 'You are already in a house' })

		const house = await House.findOne({ inviteCode })
		if (!house) return res.status(404).json({ message: 'Invalid invite code' })

		const alreadyMember = house.members.some(member => String(member.userId) === String(req.user._id))
		if (!alreadyMember) {
			house.members.push({ userId: req.user._id, role: 'member' })
			await house.save()
		}

		currentUser.houseId = house._id
		await currentUser.save()

		const notifications = house.members
			.filter(member => String(member.userId) !== String(req.user._id))
			.map(member => ({
				userId: member.userId,
				houseId: house._id,
				type: 'member',
				title: 'New housemate joined',
				body: `${req.user.name} joined ${house.name}`,
				link: '/settings',
			}))

		if (notifications.length > 0) await Notification.insertMany(notifications)

		const payload = await buildHousePayload(house)
		return res.json(payload)
	} catch (error) {
		next(error)
	}
}

const getHouse = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		runRentRemindersSafely({ now: new Date(), houseIds: [house._id] })

		const payload = await buildHousePayload(house)
		return res.json(payload)
	} catch (error) {
		next(error)
	}
}

const updateMonthlyRent = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const membership = house.members.find(member => String(member.userId) === String(req.user._id))
		if (membership?.role !== 'admin') {
			return res.status(403).json({ message: 'Only house admins can set monthly rent' })
		}

		const monthlyRentAmount = Number(req.body.monthlyRentAmount)
		if (!Number.isFinite(monthlyRentAmount) || monthlyRentAmount < 0) {
			return res.status(400).json({ message: 'monthlyRentAmount must be a valid non-negative number' })
		}

		house.monthlyRentAmount = monthlyRentAmount
		await house.save()

		return res.json({ monthlyRentAmount: house.monthlyRentAmount, house })
	} catch (error) {
		next(error)
	}
}

const getRentStatus = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const month = req.query.month ? String(req.query.month) : toMonthKey()
		const now = new Date()

		runRentRemindersSafely({ month, now, houseIds: [house._id] })
		const status = await getRentStatusForUser({ house, userId: req.user._id, month, now })

		return res.json(status)
	} catch (error) {
		next(error)
	}
}

const payMonthlyRent = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const month = req.body.month ? String(req.body.month) : toMonthKey()
		const status = await getRentStatusForUser({ house, userId: req.user._id, month, now: new Date() })

		const rentRecord = await RentPayment.findOne({ houseId: house._id, userId: req.user._id, month })
		if (!rentRecord) return res.status(404).json({ message: 'Rent record not found' })
		if (rentRecord.status === 'paid') {
			return res.json({ message: 'Rent already paid', rentStatus: status })
		}

		rentRecord.status = 'paid'
		rentRecord.paidAt = new Date()
		await rentRecord.save()
	// Also mark corresponding rent expenses as settled for this user
	const Expense = require('../models/Expense')
	const rentExpenses = await Expense.find({ houseId: house._id, category: 'Rent', billMonth: month })
	
	for (const expense of rentExpenses) {
		const participant = expense.participants.find(p => String(p.userId) === String(req.user._id))
		if (participant && !participant.settled) {
			participant.settled = true
			participant.settledAt = new Date()
			expense.auditTrail.push({ action: 'Marked settled via rent payment', by: req.user._id })
			await expense.save()
		}
	}
		const notifications = house.members
			.filter(member => String(member.userId) !== String(req.user._id))
			.map(member => ({
				userId: member.userId,
				houseId: house._id,
				type: 'payment',
				title: 'Rent payment received',
				body: `${req.user.name} paid rent for ${month}`,
				amount: rentRecord.amountDue,
				link: '/',
			}))

		if (notifications.length > 0) await Notification.insertMany(notifications)

		const nextStatus = await getRentStatusForUser({ house, userId: req.user._id, month, now: new Date() })
		return res.json({ message: 'Rent paid successfully', rentStatus: nextStatus })
	} catch (error) {
		next(error)
	}
}

const payMonthlyRentForMember = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		// only admins can mark other members as paid
		const membership = house.members.find(member => String(member.userId) === String(req.user._id))
		if (!membership || membership.role !== 'admin') {
			return res.status(403).json({ message: 'Only admins can mark other members rent as paid' })
		}

		const memberId = String(req.body.userId || '')
		if (!memberId) return res.status(400).json({ message: 'userId is required' })

		const month = req.body.month ? String(req.body.month) : toMonthKey()

		const mongoose = require('mongoose')
		let rentRecord = await RentPayment.findOne({ houseId: house._id, userId: memberId, month })
		// try casting to ObjectId if initial lookup fails
		if (!rentRecord) {
			try {
				const objId = mongoose.Types.ObjectId(memberId)
				rentRecord = await RentPayment.findOne({ houseId: house._id, userId: objId, month })
			} catch (err) {
				// ignore cast error
			}
		}
		if (!rentRecord) return res.status(404).json({ message: 'Rent record not found for member' })
		console.debug(`payMonthlyRentForMember: found rentRecord ${rentRecord._id} for user ${memberId} month ${month} status=${rentRecord.status}`)
		if (rentRecord.status === 'paid') return res.json({ message: 'Rent already paid', rentStatus: await getRentStatusForUser({ house, userId: memberId, month, now: new Date() }) })

		rentRecord.status = 'paid'
		rentRecord.paidAt = new Date()
		await rentRecord.save()
		console.debug(`payMonthlyRentForMember: saved rentRecord ${rentRecord._id} status=${rentRecord.status}`)
	// Also mark corresponding rent expenses as settled for this member
	const Expense = require('../models/Expense')
	const rentExpenses = await Expense.find({ houseId: house._id, category: 'Rent', billMonth: month })
	console.debug(`payMonthlyRentForMember: found ${rentExpenses.length} rent expenses for month ${month}`)
	
	for (const expense of rentExpenses) {
		const participant = expense.participants.find(p => String(p.userId) === memberId)
		if (participant && !participant.settled) {
			participant.settled = true
			participant.settledAt = new Date()
			expense.auditTrail.push({ action: 'Marked settled via rent payment', by: req.user._id })
			await expense.save()
			console.debug(`payMonthlyRentForMember: marked expense ${expense._id} participant settled`)
		}
	}
		const notifications = house.members.map(member => ({
			userId: member.userId,
			houseId: house._id,
			type: 'payment',
			title: 'Rent payment recorded',
			body: `Rent for ${month} marked as paid for a member`,
			amount: rentRecord.amountDue,
			link: '/balances',
		}))

		if (notifications.length > 0) await Notification.insertMany(notifications)

		const nextStatus = await getRentStatusForUser({ house, userId: memberId, month, now: new Date() })
		return res.json({ message: 'Member rent marked as paid', rentStatus: nextStatus })
	} catch (error) {
		next(error)
	}
}

const getRentHistory = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const payments = await RentPayment.find({ houseId: house._id, status: 'paid' })
			.sort({ paidAt: -1, createdAt: -1 })
			.populate('userId', 'name displayName')

		const history = payments.map(payment => ({
			id: payment._id,
			month: payment.month,
			amount: payment.amountDue,
			paidAt: payment.paidAt || payment.updatedAt || payment.createdAt,
			userId: payment.userId?._id || payment.userId,
			name: payment.userId?.displayName || payment.userId?.name || 'Member',
		}))

		return res.json({ history })
	} catch (error) {
		next(error)
	}
}

const getInviteCode = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })
		return res.json({
			inviteCode: house.inviteCode,
			inviteLink: buildInviteLink(house.inviteCode),
		})
	} catch (error) {
		next(error)
	}
}

const refreshInviteCode = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const membership = house.members.find(member => String(member.userId) === String(req.user._id))
		if (membership?.role !== 'admin') {
			return res.status(403).json({ message: 'Only house admins can refresh the invite code' })
		}

		house.inviteCode = await ensureUniqueCode()
		await house.save()

		return res.json({
			inviteCode: house.inviteCode,
			inviteLink: buildInviteLink(house.inviteCode),
			house,
		})
	} catch (error) {
		next(error)
	}
}

const leaveHouse = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id)
		if (!user?.houseId) return res.status(400).json({ message: 'You are not in a house' })

		const house = await House.findById(user.houseId)
		if (!house) {
			user.houseId = null
			await user.save()
			return res.json({ message: 'Left house' })
		}

		const wasAdmin = house.members.some(member => String(member.userId) === String(req.user._id) && member.role === 'admin')
		house.members = house.members.filter(member => String(member.userId) !== String(req.user._id))

		user.houseId = null
		await user.save()

		if (house.members.length === 0) {
			await House.findByIdAndDelete(house._id)
			return res.json({ message: 'Left house', house: null, members: [] })
		}

		if (wasAdmin && !house.members.some(member => member.role === 'admin')) {
			house.members[0].role = 'admin'
		}

		await house.save()
		const payload = await buildHousePayload(house)
		return res.json({ message: 'Left house', ...payload })
	} catch (error) {
		next(error)
	}
}

module.exports = {
	createHouse,
	inviteMember,
	joinHouse,
	getHouse,
	getInviteCode,
	refreshInviteCode,
	leaveHouse,
	updateMonthlyRent,
	getRentStatus,
	payMonthlyRent,
 payMonthlyRentForMember,
	getRentHistory,
}
