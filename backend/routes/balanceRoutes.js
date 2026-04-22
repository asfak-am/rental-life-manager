const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const {
	getRawBalances,
	getSimplifiedBalances,
	settleDebt,
} = require('../controllers/balanceController')

const router = express.Router()

router.use(protect)
router.get('/', getRawBalances)
router.get('/simplified', getSimplifiedBalances)
router.post('/settle', settleDebt)

module.exports = router
