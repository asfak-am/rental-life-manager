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
} = require('../controllers/houseController')

const router = express.Router()

router.use(protect)
router.get('/', getHouse)
router.post('/create', createHouse)
router.post('/invite-member', inviteMember)
router.post('/join', joinHouse)
router.get('/invite-code', getInviteCode)
router.post('/refresh-code', refreshInviteCode)
router.delete('/leave', leaveHouse)

module.exports = router
