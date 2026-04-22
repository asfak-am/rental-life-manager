const simplifyDebts = (balances = {}) => {
	const creditors = []
	const debtors = []

	Object.entries(balances).forEach(([userId, amount]) => {
		if (amount > 0.01) creditors.push({ userId, amount })
		if (amount < -0.01) debtors.push({ userId, amount: Math.abs(amount) })
	})

	const transactions = []
	let i = 0
	let j = 0

	while (i < creditors.length && j < debtors.length) {
		const settlement = Math.min(creditors[i].amount, debtors[j].amount)
		transactions.push({
			from: debtors[j].userId,
			to: creditors[i].userId,
			amount: Math.round(settlement * 100) / 100,
		})

		creditors[i].amount -= settlement
		debtors[j].amount -= settlement

		if (creditors[i].amount < 0.01) i += 1
		if (debtors[j].amount < 0.01) j += 1
	}

	return transactions
}

module.exports = { simplifyDebts }
