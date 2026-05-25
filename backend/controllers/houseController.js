const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')
const Expense = require('../models/Expense')
const Task = require('../models/Task')
const { generateInviteCode } = require('../utils/inviteCode')
const RentPayment = require('../models/RentPayment')
const { ensureMonthlyRentRecords, getRentStatusForUser, runRentRemindersForMonth, toMonthKey, getActiveMembersForMonth } = require('../services/rentService')
const redis = require('../utils/redisClient')

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

// helper: delete keys by pattern using SCAN
async function clearKeysByPattern(pattern) {
	if (!redis) return
	try {
		const stream = redis.scanStream({ match: pattern, count: 100 })
		const keys = []
		for await (const resultKeys of stream) {
			if (resultKeys.length) keys.push(...resultKeys)
		}
		if (keys.length) await redis.del(...keys)
	} catch (err) {
		console.warn('Redis clearKeysByPattern failed for', pattern, err && err.message)
	}
}

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

			// Invalidate rent-related caches for this house since membership changed
			if (redis) {
				try {
					await clearKeysByPattern(`rent-status:${house._id}:*`)
					await clearKeysByPattern(`rent-history:${house._id}`)
				} catch (err) {
					console.warn('Redis cache invalidation failed after joinHouse', err && err.message)
				}
			}
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

		if (req.body.monthlyRentAmount !== undefined) {
			const monthlyRentAmount = Number(req.body.monthlyRentAmount)
			if (!Number.isFinite(monthlyRentAmount) || monthlyRentAmount < 0) {
				return res.status(400).json({ message: 'monthlyRentAmount must be a valid non-negative number' })
			}

			house.monthlyRentAmount = monthlyRentAmount
		}

		if (req.body.rentReminderWindowDays !== undefined) {
			const reminderWindowDays = Number(req.body.rentReminderWindowDays)
			if (!Number.isInteger(reminderWindowDays) || reminderWindowDays < 1 || reminderWindowDays > 31) {
				return res.status(400).json({ message: 'rentReminderWindowDays must be an integer between 1 and 31' })
			}

			house.rentReminderWindowDays = reminderWindowDays
		}

		await house.save()

		return res.json({
			monthlyRentAmount: house.monthlyRentAmount,
			rentReminderWindowDays: house.rentReminderWindowDays,
			house,
		})
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

		// Try cache first
		const cacheKey = `rent-status:${house._id}:${req.user._id}:${month}`
		if (redis) {
			try {
				const cached = await redis.get(cacheKey)
				if (cached) {
					return res.json(JSON.parse(cached))
				}
			} catch (err) {
				console.warn('Redis get failed for', cacheKey, err)
			}
		}

		const status = await getRentStatusForUser({ house, userId: req.user._id, month, now })

		// Cache result for a short time (default 60s)
		if (redis) {
			try {
				const ttl = parseInt(process.env.RENT_STATUS_CACHE_TTL || '60', 10)
				await redis.set(cacheKey, JSON.stringify(status), 'EX', ttl)
			} catch (err) {
				console.warn('Redis set failed for', cacheKey, err)
			}
		}

		return res.json(status)
	} catch (error) {
		next(error)
	}
}

const getRentStatuses = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const requestedMonths = String(req.query.months || '')
			.split(',')
			.map(item => item.trim())
			.filter(Boolean)

		const months = [...new Set(requestedMonths)]
			.filter(month => MONTH_KEY_REGEX.test(month))
			.slice(0, 8)

		if (months.length === 0) months.push(toMonthKey())

		const cacheKey = `rent-statuses:${house._id}:${req.user._id}:${months.join('|')}`
		if (redis) {
			try {
				const cached = await redis.get(cacheKey)
				if (cached) return res.json(JSON.parse(cached))
			} catch (err) {
				console.warn('Redis get failed for', cacheKey, err)
			}
		}

		const now = new Date()
		const memberUsers = await User.find({ _id: { $in: house.members.map(member => member.userId) } }).select('name displayName')
		const userMap = new Map(memberUsers.map(member => [String(member._id), member]))

		const statuses = await Promise.all(months.map(async (month) => {
			const records = await ensureMonthlyRentRecords(house, month)
			const activeMembers = await getActiveMembersForMonth(house, month)
			const activeMemberIds = new Set(activeMembers.map(member => String(member.userId)))
			const activeRecords = records.filter(record => activeMemberIds.has(String(record.userId)))
			const recordMap = new Map(activeRecords.map(record => [String(record.userId), record]))
			const myRecord = recordMap.get(String(req.user._id))
			const paidCount = activeRecords.filter(record => record.status === 'paid').length

			const memberStatuses = activeMembers.map(member => {
				const memberId = String(member.userId)
				const memberUser = userMap.get(memberId)
				const memberRecord = recordMap.get(memberId)
				return {
					userId: memberId,
					name: memberUser?.displayName || memberUser?.name || 'Member',
					status: memberRecord?.status || 'unpaid',
					amountDue: Number(memberRecord?.amountDue || 0),
					paidAt: memberRecord?.paidAt || null,
				}
			})

			return {
				month,
				totalRentAmount: Number(house.monthlyRentAmount || 0),
				memberCount: activeMembers.length,
				perPersonRent: Math.round((Number(house.monthlyRentAmount || 0) / Math.max(activeMembers.length, 1)) * 100) / 100,
				myRent: myRecord
					? {
						status: myRecord.status,
						amountDue: Number(myRecord.amountDue || 0),
						paidAt: myRecord.paidAt || null,
					}
					: { status: 'unpaid', amountDue: 0, paidAt: null },
				paidCount,
				unpaidCount: Math.max(activeRecords.length - paidCount, 0),
				memberStatuses,
				payButtonVisible: now.getDate() >= 20,
				earlyPayAllowed: true,
				warningVisible: now.getDate() >= 25 && myRecord?.status !== 'paid',
			}
		}))

		const response = { statuses }
		if (redis) {
			try {
				const ttl = parseInt(process.env.RENT_STATUS_CACHE_TTL || '60', 10)
				await redis.set(cacheKey, JSON.stringify(response), 'EX', ttl)
			} catch (err) {
				console.warn('Redis set failed for', cacheKey, err)
			}
		}

		return res.json(response)
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

		const activeMembers = await getActiveMembersForMonth(house, month)
		const isActiveMember = activeMembers.some(member => String(member.userId) === String(req.user._id))
		if (!isActiveMember) {
			return res.status(400).json({ message: 'You were not a member of this house for that month' })
		}

		let rentRecord = await RentPayment.findOne({ houseId: house._id, userId: req.user._id, month })
		if (!rentRecord) {
			const perPersonRent = Math.round((Number(house.monthlyRentAmount || 0) / Math.max(activeMembers.length, 1)) * 100) / 100
			rentRecord = await RentPayment.create({
				houseId: house._id,
				userId: req.user._id,
				month,
				amountDue: perPersonRent,
				status: 'unpaid',
			})
		}
		if (rentRecord.status === 'paid') {
			return res.json({ message: 'Rent already paid', rentStatus: status })
		}

		rentRecord.status = 'paid'
		rentRecord.paidAt = new Date()
		await rentRecord.save()

		// Invalidate cache for rent status for this house/month (all members)
		if (redis) {
			try {
				await clearKeysByPattern(`rent-status:${house._id}:*:${month}`)
				await clearKeysByPattern(`rent-statuses:${house._id}:*`)
				await clearKeysByPattern(`rent-history:${house._id}`)
				await clearKeysByPattern(`expense-summary:${house._id}:*`)
			} catch (err) {
				console.warn('Redis cache invalidation failed for rent status', err)
			}
		}

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
		const activeMembers = await getActiveMembersForMonth(house, month)
		const isActiveMember = activeMembers.some(member => String(member.userId) === memberId)
		if (!isActiveMember) {
			return res.status(400).json({ message: 'This member was not part of the house for that month' })
		}

		const records = await ensureMonthlyRentRecords(house, month)

		const mongoose = require('mongoose')
		let rentRecord = records.find(record => String(record.userId) === memberId)
		// try casting to ObjectId if initial lookup fails
		if (!rentRecord) {
			try {
				const objId = mongoose.Types.ObjectId(memberId)
				rentRecord = records.find(record => String(record.userId) === String(objId))
			} catch (err) {
				// ignore cast error
			}
		}
		if (!rentRecord) {
			const perPersonRent = Math.round((Number(house.monthlyRentAmount || 0) / Math.max(activeMembers.length, 1)) * 100) / 100
			rentRecord = await RentPayment.create({
				houseId: house._id,
				userId: memberId,
				month,
				amountDue: perPersonRent,
				status: 'unpaid',
			})
		}
		if (rentRecord.status === 'paid') return res.json({ message: 'Rent already paid', rentStatus: await getRentStatusForUser({ house, userId: memberId, month, now: new Date() }) })

		rentRecord.status = 'paid'
		rentRecord.paidAt = new Date()
		await rentRecord.save()

		// Invalidate cache for this member and the house/month
		if (redis) {
			try {
				// delete specific member key
				const memberKey = `rent-status:${house._id}:${memberId}:${month}`
				await redis.del(memberKey)
				// delete any other cached keys for this house/month
				await clearKeysByPattern(`rent-status:${house._id}:*:${month}`)
				await clearKeysByPattern(`rent-statuses:${house._id}:*`)
				await clearKeysByPattern(`rent-history:${house._id}`)
				await clearKeysByPattern(`expense-summary:${house._id}:*`)
			} catch (err) {
				console.warn('Redis cache invalidation failed for rent status (member)', err)
			}
		}

		// Also mark corresponding rent expenses as settled for this member
		await Expense.updateMany(
			{ houseId: house._id, category: 'Rent', billMonth: month, 'participants.userId': rentRecord.userId },
			{
				$set: {
					'participants.$[participant].settled': true,
					'participants.$[participant].settledAt': new Date(),
				},
				$push: {
					auditTrail: {
						action: 'Marked settled via rent payment',
						by: req.user._id,
					},
				},
			},
			{
				arrayFilters: [{ 'participant.userId': rentRecord.userId, 'participant.settled': { $ne: true } }],
			}
		)
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

		const pageNum = Math.max(1, Number(req.query.page) || 1)
		const pageSize = Math.max(1, Math.min(100, Number(req.query.limit) || 10))
		const from = req.query.from ? new Date(req.query.from) : null
		const to = req.query.to ? new Date(req.query.to) : null
		const cacheKey = `rent-history:${house._id}:${JSON.stringify({ page: pageNum, limit: pageSize, from: req.query.from || null, to: req.query.to || null })}`
		if (redis) {
			try {
				const cached = await redis.get(cacheKey)
				if (cached) return res.json(JSON.parse(cached))
			} catch (err) { console.warn('Redis get failed for', cacheKey, err && err.message) }
		}

		const query = { houseId: house._id, status: 'paid' }
		if (from || to) {
			query.paidAt = {}
			if (from && !Number.isNaN(from.getTime())) query.paidAt.$gte = from
			if (to && !Number.isNaN(to.getTime())) query.paidAt.$lte = to
		}

		const total = await RentPayment.countDocuments(query)
		const pages = Math.max(1, Math.ceil(total / pageSize))
		const skip = (pageNum - 1) * pageSize

		const payments = await RentPayment.find(query)
			.sort({ paidAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(pageSize)
			.populate('userId', 'name displayName')

		const history = payments.map(payment => ({
			id: payment._id,
			month: payment.month,
			amount: payment.amountDue,
			paidAt: payment.paidAt || payment.updatedAt || payment.createdAt,
			userId: payment.userId?._id || payment.userId,
			name: payment.userId?.displayName || payment.userId?.name || 'Member',
		}))

		const response = { history, total, page: pageNum, pages, pageSize }

		if (redis) {
			try { await redis.set(cacheKey, JSON.stringify(response), 'EX', parseInt(process.env.RENT_HISTORY_CACHE_TTL || '300', 10)) } catch (err) { console.warn('Redis set failed for', cacheKey, err && err.message) }
		}

		return res.json(response)
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

const removeMember = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })

		const membership = house.members.find(member => String(member.userId) === String(req.user._id))
		if (!membership || membership.role !== 'admin') {
			return res.status(403).json({ message: 'Only house admins can remove members' })
		}

		const targetId = String(req.params.userId || req.body.userId || '')
		if (!targetId) return res.status(400).json({ message: 'userId is required' })

		const targetMember = house.members.find(member => String(member.userId) === String(targetId))
		if (!targetMember) return res.status(404).json({ message: 'Member not found in house' })

		if (String(targetMember.userId) === String(req.user._id)) {
			return res.status(400).json({ message: 'Admins cannot remove themselves via this endpoint' })
		}

		if (targetMember.role === 'admin') {
			return res.status(403).json({ message: 'Cannot remove another admin' })
		}

		// detect outstanding items: expenses, rent, tasks
		const mongoose = require('mongoose')
		const targetObjId = (() => {
			try { return mongoose.Types.ObjectId(targetId) } catch (e) { return null }
		})()

		// Expenses where target owes others
		const owedExpenses = await Expense.find({ houseId: house._id, 'participants.userId': targetId })
		let totalOwedByTarget = 0
		let totalOwedToTarget = 0
		const unsettledExpenses = []
		const warningPeople = new Map()

		const addWarningPerson = (userId, kind) => {
			const key = String(userId)
			if (!key) return
			const current = warningPeople.get(key) || { userId: key, name: 'Member', kinds: new Set() }
			current.kinds.add(kind)
			warningPeople.set(key, current)
		}

		const userDocs = await User.find({ _id: { $in: Array.from(new Set(owedExpenses.flatMap(exp => [exp.paidBy, ...exp.participants.map(p => p.userId)]).filter(Boolean).map(id => String(id)))) } }).select('name displayName')
		const userNameById = new Map(userDocs.map(user => [String(user._id), user.displayName || user.name || 'Member']))
		for (const exp of owedExpenses) {
			// participant owed amounts
			for (const p of exp.participants) {
				if (String(p.userId) === String(targetId) && !p.settled) {
					totalOwedByTarget += Number(p.amountOwed || 0)
					unsettledExpenses.push({ expenseId: exp._id, title: exp.title, amount: p.amountOwed, paidBy: exp.paidBy })
					addWarningPerson(exp.paidBy, 'owedByTarget')
				}
			}
			// if target paid this expense and others owe him
			if (String(exp.paidBy) === String(targetId)) {
				for (const p of exp.participants) {
					if (String(p.userId) !== String(targetId) && !p.settled) {
						totalOwedToTarget += Number(p.amountOwed || 0)
						addWarningPerson(p.userId, 'owedToTarget')
					}
				}
			}
		}

		// Rent records for this user
		const rentRecords = await RentPayment.find({ houseId: house._id, userId: targetId })
		let totalUnpaidRent = 0
		for (const r of rentRecords) {
			if (r.status !== 'paid') totalUnpaidRent += Number(r.amountDue || 0)
		}

		// Tasks assigned to this user
		const taskCountAssigned = await Task.countDocuments({ houseId: house._id, assignedTo: targetId })

		const hasOutstanding = totalOwedByTarget > 0 || totalOwedToTarget > 0 || totalUnpaidRent > 0 || taskCountAssigned > 0

		const confirmed = req.query.confirm === 'true' || req.body?.confirm === true
		if (hasOutstanding && !confirmed) {
			const warnings = Array.from(warningPeople.values()).map(person => ({
				userId: person.userId,
				name: userNameById.get(String(person.userId)) || person.name,
				kinds: Array.from(person.kinds),
			}))
			return res.status(409).json({
				message: 'Member has outstanding balances or assignments',
				totals: { totalOwedByTarget, totalOwedToTarget, totalUnpaidRent, taskCountAssigned },
				unsettledExpenses: unsettledExpenses.slice(0, 10),
				warnings,
			})
		}

		// If confirmed, perform cleanup: settle related expense participant entries, delete rent records, unassign tasks
		if (confirmed) {
			// settle participant entries where target owed
			for (const exp of owedExpenses) {
				let changed = false
				// settle participants who are the target
				for (const p of exp.participants) {
					if (String(p.userId) === String(targetId) && !p.settled) {
						p.settled = true
						p.settledAt = new Date()
						changed = true
					}
				}
				// if target paid the expense, mark others as settled as well
				if (String(exp.paidBy) === String(targetId)) {
					for (const p of exp.participants) {
						if (String(p.userId) !== String(targetId) && !p.settled) {
							p.settled = true
							p.settledAt = new Date()
							changed = true
						}
					}
				}
				if (changed) {
					exp.auditTrail = exp.auditTrail || []
					exp.auditTrail.push({ action: 'Settled due to member removal', by: req.user._id })
					await exp.save()
				}
			}

			// remove rent records for this user
			await RentPayment.deleteMany({ houseId: house._id, userId: targetId })

			// unassign tasks
			await Task.updateMany({ houseId: house._id, assignedTo: targetId }, { $unset: { assignedTo: '' } })

			if (redis) {
				try {
					await clearKeysByPattern(`rent-status:${house._id}:*`)
					await clearKeysByPattern(`rent-statuses:${house._id}:*`)
					await clearKeysByPattern(`rent-history:${house._id}:*`)
					await clearKeysByPattern(`expense-summary:${house._id}:*`)
					await clearKeysByPattern(`expenses:${house._id}:*`)
					await clearKeysByPattern(`tasks:${house._id}:*`)
					await clearKeysByPattern(`tasks-dashboard:${house._id}:*`)
					await clearKeysByPattern(`balance-raw:${house._id}:*`)
					await clearKeysByPattern(`invite-code:${house._id}:*`)
				} catch (err) {
					console.warn('Redis cache invalidation failed after member removal', err && err.message)
				}
			}
		}

		// remove member from house
		house.members = house.members.filter(m => String(m.userId) !== String(targetId))
		await house.save()

		// clear user's houseId
		try {
			const u = await User.findById(targetId)
			if (u) {
				u.houseId = null
				await u.save()
			}
		} catch (err) {
			// ignore
		}

		const notifications = house.members.map(member => ({
			userId: member.userId,
			houseId: house._id,
			type: 'member',
			title: 'House member removed',
			body: `A member was removed from ${house.name}`,
			link: '/settings',
		}))
		if (notifications.length > 0) await Notification.insertMany(notifications)

		const payload = await buildHousePayload(house)
		return res.json({ message: 'Member removed', ...payload })
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
	getRentStatuses,
	payMonthlyRent,
 payMonthlyRentForMember,
	getRentHistory,
	removeMember,
}
