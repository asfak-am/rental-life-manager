const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const {
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
} = require('../controllers/houseController')

const router = express.Router()

router.use(protect)
router.get('/', getHouse)
router.post('/create', createHouse)
router.post('/invite-member', inviteMember)
router.post('/join', joinHouse)
router.get('/invite-code', getInviteCode)
router.post('/refresh-code', refreshInviteCode)
router.put('/rent-config', updateMonthlyRent)
router.get('/rent-status', getRentStatus)
router.post('/pay-rent', payMonthlyRent)
router.delete('/leave', leaveHouse)

module.exports = router
