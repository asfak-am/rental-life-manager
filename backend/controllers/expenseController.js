const Expense = require('../models/Expense')
const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')

const getHouseForUser = async (userId) => {
	const user = await User.findById(userId)
	if (!user?.houseId) return null
	return House.findById(user.houseId)
}

const toNum = (value) => {
	const amount = Number(value)
	return Number.isFinite(amount) ? amount : 0
}

const normalizeParticipantId = (participant) => String(participant.userId || participant._id || participant)

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const BILL_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const calculateEqualSplit = (amount, participants) => {
	const share = roundMoney(amount / participants.length)
	return participants.map(userId => ({ userId, amountOwed: share }))
}

const extractParticipantIds = (participantsInput) => {
	const ids = participantsInput
		.map(participant => String(participant.userId || participant._id || '').trim())
		.filter(Boolean)
	return [...new Set(ids)]
}

const aggregateByCategory = (expenses) => expenses.reduce((accumulator, expense) => {
	accumulator[expense.category] = (accumulator[expense.category] || 0) + expense.amount
	return accumulator
}, {})

const aggregateMonthlyTrends = (expenses) => {
	const monthLookup = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const months = []
	const now = new Date()

	for (let offset = 5; offset >= 0; offset -= 1) {
		const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
		months.push({ key: `${date.getFullYear()}-${date.getMonth()}`, month: monthLookup[date.getMonth()], amount: 0 })
	}

	expenses.forEach(expense => {
		const date = new Date(expense.date)
		const key = `${date.getFullYear()}-${date.getMonth()}`
		const bucket = months.find(item => item.key === key)
		if (bucket) bucket.amount += expense.amount
	})

	return months.map(({ key, ...rest }) => rest)
}

const getRangeStart = (range) => {
	const months = { '3M': 3, '6M': 6, '12M': 12 }
	const totalMonths = months[range]
	if (!totalMonths) return null

	const now = new Date()
	return new Date(now.getFullYear(), now.getMonth() - totalMonths + 1, 1)
}

const computeSummary = (expenses, userId) => {
	const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
	const categoryBreakdown = aggregateByCategory(expenses)
	const monthlyTrends = aggregateMonthlyTrends(expenses)

	const contributions = {}
	let myShare = 0
	let settledAmount = 0

	expenses.forEach(expense => {
		const payerKey = String(expense.paidBy)
		contributions[payerKey] = (contributions[payerKey] || 0) + expense.amount

		;(expense.participants || []).forEach(participant => {
			const participantId = normalizeParticipantId(participant)
			const owed = toNum(participant.amountOwed)
			if (participantId === String(userId) && !participant.settled) myShare += owed
			if (participant.settled) settledAmount += owed
		})
	})

	return {
		totalExpenses: roundMoney(totalExpenses),
		myShare: roundMoney(myShare),
		settled: myShare <= 0.01,
		categoryBreakdown: Object.fromEntries(Object.entries(categoryBreakdown).map(([key, value]) => [key, roundMoney(value)])),
		monthlyTrends: monthlyTrends.map(item => ({ ...item, amount: roundMoney(item.amount) })),
		contributions,
		savings: roundMoney(settledAmount),
	}
}

const createNotificationsForHouse = async (houseId, actorId, payloadFactory) => {
	const house = await House.findById(houseId)
	if (!house) return

	const notifications = house.members
		.filter(member => String(member.userId) !== String(actorId))
		.map(member => payloadFactory(member.userId))
		.filter(Boolean)

	if (notifications.length > 0) await Notification.insertMany(notifications)
}

const addExpense = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(400).json({ message: 'Join a house first' })

		const amount = toNum(req.body.amount)
		if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' })

		const participantsInput = Array.isArray(req.body.participants) ? req.body.participants : []
		const selectedPaidBy = req.body.paidBy || req.user._id
		const memberIds = house.members.map(member => String(member.userId))

		if (!memberIds.includes(String(selectedPaidBy))) {
			return res.status(400).json({ message: 'Paid by must be a house member' })
		}

		const billMonth = req.body.billMonth ? String(req.body.billMonth).trim() : ''
		if (billMonth && !BILL_MONTH_REGEX.test(billMonth)) {
			return res.status(400).json({ message: 'billMonth must be in YYYY-MM format' })
		}

		let participants
		if (req.body.splitType === 'custom') {
			const participantIds = extractParticipantIds(participantsInput)
			if (participantIds.length === 0) {
				return res.status(400).json({ message: 'Select at least one participant for custom split' })
			}
			if (participantIds.some(id => !memberIds.includes(id))) {
				return res.status(400).json({ message: 'Participants must be house members' })
			}
			const amountMap = new Map(participantsInput.map(participant => [
				String(participant.userId || participant._id),
				roundMoney(participant.amountOwed),
			]))
			participants = participantIds.map(userId => ({
				userId,
				amountOwed: amountMap.get(userId) || 0,
				settled: false,
				settledAt: null,
			}))

			if (participants.some(participant => !Number.isFinite(participant.amountOwed) || participant.amountOwed < 0)) {
				return res.status(400).json({ message: 'Custom split amounts must be valid non-negative numbers' })
			}
		} else if (participantsInput.length > 0) {
			const participantIds = extractParticipantIds(participantsInput)
			if (participantIds.length === 0) {
				return res.status(400).json({ message: 'Select at least one participant' })
			}
			if (participantIds.some(id => !memberIds.includes(id))) {
				return res.status(400).json({ message: 'Participants must be house members' })
			}
			participants = calculateEqualSplit(amount, participantIds)
		} else {
			participants = calculateEqualSplit(amount, memberIds)
		}

		const participantTotal = roundMoney(participants.reduce((sum, participant) => sum + toNum(participant.amountOwed), 0))
		if (Math.abs(participantTotal - amount) > 0.05) {
			return res.status(400).json({ message: 'Split amounts must equal the expense amount' })
		}

		const expense = await Expense.create({
			houseId: house._id,
			title: req.body.title,
			amount,
			paidBy: selectedPaidBy,
			splitType: req.body.splitType || 'equal',
			participants,
			category: req.body.category || 'Other',
			billMonth: billMonth || undefined,
			date: req.body.date || Date.now(),
			recurring: Boolean(req.body.recurring),
			recurrenceRule: req.body.recurrenceRule,
			auditTrail: [{ action: 'Expense created', by: req.user._id }],
		})

		await createNotificationsForHouse(house._id, req.user._id, (recipientId) => ({
			userId: recipientId,
			houseId: house._id,
			type: 'expense',
			title: 'New expense added',
			body: `${req.user.name} added ${expense.title}`,
			amount: expense.amount,
			link: `/expenses/${expense._id}`,
		}))

		return res.status(201).json({ expense })
	} catch (error) {
		next(error)
	}
}

const getAllExpenses = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.json({ expenses: [] })

		const { category, search, billMonth, limit } = req.query
		const query = { houseId: house._id }

		if (category) query.category = category
		if (search) query.title = { $regex: search, $options: 'i' }
		if (billMonth && BILL_MONTH_REGEX.test(String(billMonth))) query.billMonth = String(billMonth)

		const expenses = await Expense.find(query)
			.select('title amount paidBy splitType participants category billMonth date recurring recurrenceRule createdAt updatedAt')
			.sort({ date: -1, createdAt: -1 })
			.limit(limit ? Number(limit) : 0)
			.lean()

		return res.json({ expenses })
	} catch (error) {
		next(error)
	}
}

const getUtilityTrend = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.json({ trend: [] })

		const range = String(req.query.range || '6M').toUpperCase()
		const rangeStart = getRangeStart(range)
		const match = {
			houseId: house._id,
			category: { $in: ['Water Bill', 'Electricity Bill'] },
		}

		if (rangeStart) {
			match.date = { $gte: rangeStart }
		}

		const trend = await Expense.aggregate([
			{ $match: match },
			{
				$addFields: {
					periodKey: {
						$cond: [
							{ $and: [{ $ne: ['$billMonth', null] }, { $ne: ['$billMonth', ''] }] },
							'$billMonth',
							{ $dateToString: { format: '%Y-%m', date: '$date' } },
						],
					},
				},
			},
			{
				$group: {
					_id: '$periodKey',
					water: { $sum: { $cond: [{ $eq: ['$category', 'Water Bill'] }, '$amount', 0] } },
					electricity: { $sum: { $cond: [{ $eq: ['$category', 'Electricity Bill'] }, '$amount', 0] } },
				},
			},
			{ $sort: { _id: 1 } },
			{
				$project: {
					_id: 0,
					month: '$_id',
					water: { $round: ['$water', 2] },
					electricity: { $round: ['$electricity', 2] },
				},
			},
		])

		return res.json({ trend })
	} catch (error) {
		next(error)
	}
}

const getExpenseById = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const expense = await Expense.findOne({ _id: req.params.id, houseId: house._id })
		if (!expense) return res.status(404).json({ message: 'Expense not found' })

		return res.json({ expense, auditTrail: expense.auditTrail })
	} catch (error) {
		next(error)
	}
}

const updateExpense = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const expense = await Expense.findOne({ _id: req.params.id, houseId: house._id })
		if (!expense) return res.status(404).json({ message: 'Expense not found' })

		if (req.body.billMonth !== undefined) {
			const nextBillMonth = String(req.body.billMonth || '').trim()
			if (nextBillMonth && !BILL_MONTH_REGEX.test(nextBillMonth)) {
				return res.status(400).json({ message: 'billMonth must be in YYYY-MM format' })
			}
			expense.billMonth = nextBillMonth || undefined
		}

		;['title', 'amount', 'paidBy', 'splitType', 'participants', 'category', 'date', 'recurring', 'recurrenceRule'].forEach(key => {
			if (req.body[key] !== undefined) expense[key] = req.body[key]
		})

		if (Array.isArray(expense.participants)) {
			expense.participants = expense.participants.map(participant => ({
				userId: participant.userId,
				amountOwed: roundMoney(participant.amountOwed),
				settled: Boolean(participant.settled),
				settledAt: participant.settledAt || null,
			}))
		}

		expense.auditTrail.push({ action: 'Expense updated', by: req.user._id })
		await expense.save()

		return res.json({ expense })
	} catch (error) {
		next(error)
	}
}

const deleteExpense = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const expense = await Expense.findOneAndDelete({ _id: req.params.id, houseId: house._id })
		if (!expense) return res.status(404).json({ message: 'Expense not found' })

		return res.json({ message: 'Expense deleted' })
	} catch (error) {
		next(error)
	}
}

const getSummary = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) {
			return res.json({
				totalExpenses: 0,
				myShare: 0,
				settled: true,
				categoryBreakdown: {},
				monthlyTrends: [],
				contributions: [],
				savings: 0,
			})
		}

		// Fetch all expenses for the house to show in analytics
		const expenses = await Expense.find({ houseId: house._id })
			.select('amount paidBy participants category date billMonth')
			.sort({ date: -1 })
			.lean()

		const summary = computeSummary(expenses, req.user._id)
		const users = await User.find({ _id: { $in: house.members.map(member => member.userId) } }).select('name')
		const userMap = Object.fromEntries(users.map(user => [String(user._id), user.name]))
		const contributions = house.members.map(member => ({
			userId: member.userId,
			name: userMap[String(member.userId)] || String(member.userId),
			amount: roundMoney(summary.contributions[String(member.userId)] || 0),
		}))

		return res.json({ ...summary, contributions })
	} catch (error) {
		next(error)
	}
}

module.exports = {
	addExpense,
	getAllExpenses,
	getExpenseById,
	updateExpense,
	deleteExpense,
	getSummary,
	getUtilityTrend,
}
