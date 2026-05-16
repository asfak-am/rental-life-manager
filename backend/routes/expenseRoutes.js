const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const {
	addExpense,
	getAllExpenses,
	getExpenseById,
	updateExpense,
	deleteExpense,
	settleExpenseShare,
	getSummary,
	getUtilityTrend,
} = require('../controllers/expenseController')

const router = express.Router()

router.use(protect)
router.get('/all', getAllExpenses)
router.get('/summary', getSummary)
router.get('/utility-trend', getUtilityTrend)
router.post('/add', addExpense)
router.post('/:id/settle', settleExpenseShare)
router.get('/:id', getExpenseById)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

module.exports = router
