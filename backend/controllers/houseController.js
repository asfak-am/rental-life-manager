const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { generateInviteCode } = require('../utils/inviteCode')

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
		if (membership?.role !== 'admin') {
			return res.status(403).json({ message: 'Only house admins can invite members' })
		}

		const email = String(req.body.email || '').trim().toLowerCase()
		if (!email) return res.status(400).json({ message: 'Email is required' })

		const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${house.inviteCode}?email=${encodeURIComponent(email)}`
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

		const payload = await buildHousePayload(house)
		return res.json(payload)
	} catch (error) {
		next(error)
	}
}

const getInviteCode = async (req, res, next) => {
	try {
		const house = await requireHouse(req.user._id)
		if (!house) return res.status(404).json({ message: 'No house found' })
		return res.json({ inviteCode: house.inviteCode })
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

		return res.json({ inviteCode: house.inviteCode, house })
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
}
