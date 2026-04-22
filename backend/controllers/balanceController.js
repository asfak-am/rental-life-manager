const Expense = require('../models/Expense')
const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { simplifyDebts } = require('../utils/debtSimplifier')

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const normalizeParticipantId = (participant) => String(participant.userId || participant._id || participant)

const getHouseForUser = async (userId) => {
	const user = await User.findById(userId)
	if (!user?.houseId) return null
	return House.findById(user.houseId)
}

const getBalances = async (houseId) => {
	const house = await House.findById(houseId)
	if (!house) return { balances: [], debts: [], totalHouseExpenses: 0, balanceMap: {} }

	const expenses = await Expense.find({ houseId }).sort({ date: -1, createdAt: -1 })
	const balances = {}
	const rawDebts = new Map()
	const members = house.members.map(member => String(member.userId))

	members.forEach(userId => {
		balances[userId] = 0
	})

	let totalHouseExpenses = 0

	expenses.forEach(expense => {
		const paidBy = String(expense.paidBy)
		totalHouseExpenses += expense.amount
		if (balances[paidBy] === undefined) balances[paidBy] = 0
		balances[paidBy] += expense.amount

		expense.participants.forEach(participant => {
			const participantId = normalizeParticipantId(participant)
			const amount = roundMoney(participant.amountOwed)
			if (balances[participantId] === undefined) balances[participantId] = 0

			balances[participantId] -= amount

			if (participant.settled) {
				balances[participantId] += amount
				balances[paidBy] -= amount
				return
			}

			const key = `${participantId}:${paidBy}`
			rawDebts.set(key, (rawDebts.get(key) || 0) + amount)
		})
	})

	const debts = Array.from(rawDebts.entries()).map(([key, amount]) => {
		const [from, to] = key.split(':')
		return {
			from,
			to,
			amount: roundMoney(amount),
		}
	})

	return {
		balances: Object.entries(balances).map(([userId, net]) => ({ userId, net: roundMoney(net) })),
		debts,
		totalHouseExpenses: roundMoney(totalHouseExpenses),
		balanceMap: balances,
	}
}

const getRawBalances = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) {
			return res.json({ balances: [], debts: [], totalHouseExpenses: 0 })
		}

		const payload = await getBalances(house._id)
		return res.json(payload)
	} catch (error) {
		next(error)
	}
}

const getSimplifiedBalances = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) {
			return res.json({ transactions: [], savedAmount: 0 })
		}

		const payload = await getBalances(house._id)
		const transactions = simplifyDebts(payload.balanceMap)

		const rawDebtTotal = roundMoney(payload.debts.reduce((sum, debt) => sum + debt.amount, 0))
		const simplifiedTotal = roundMoney(transactions.reduce((sum, transaction) => sum + transaction.amount, 0))

		return res.json({
			transactions,
			savedAmount: roundMoney(rawDebtTotal - simplifiedTotal),
		})
	} catch (error) {
		next(error)
	}
}

const settleDebt = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const { from, to, amount } = req.body
		if (!from || !to || !amount) {
			return res.status(400).json({ message: 'from, to and amount are required' })
		}

		const participantId = String(from)
		const payerId = String(to)
		const settlementAmount = roundMoney(amount)

		if (![participantId, payerId].includes(String(req.user._id))) {
			return res.status(403).json({ message: 'You can only settle your own debts' })
		}

		let remaining = settlementAmount
		const expenses = await Expense.find({
			houseId: house._id,
			paidBy: payerId,
			'participants.userId': participantId,
		}).sort({ date: 1, createdAt: 1 })

		for (const expense of expenses) {
			for (const participant of expense.participants) {
				if (String(participant.userId) !== participantId || participant.settled) continue
				if (remaining <= 0) break

				participant.settled = true
				participant.settledAt = new Date()
				remaining = roundMoney(remaining - roundMoney(participant.amountOwed))
			}

			expense.auditTrail.push({ action: 'Debt settled', by: req.user._id })
			await expense.save()

			if (remaining <= 0) break
		}

		await Notification.create({
			userId: payerId,
			houseId: house._id,
			type: 'payment',
			title: 'Debt settled',
			body: `${req.user.name} settled ₹${settlementAmount.toLocaleString()} with you`,
			amount: settlementAmount,
			link: '/balances',
		})

		return res.json({ message: 'Debt settled' })
	} catch (error) {
		next(error)
	}
}

module.exports = {
	getRawBalances,
	getSimplifiedBalances,
	settleDebt,
}
