const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const {
	addExpense,
	getAllExpenses,
	getExpenseById,
	updateExpense,
	deleteExpense,
	getSummary,
} = require('../controllers/expenseController')

const router = express.Router()

router.use(protect)
router.get('/all', getAllExpenses)
router.get('/summary', getSummary)
router.post('/add', addExpense)
router.get('/:id', getExpenseById)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

module.exports = router
