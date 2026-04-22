const Task = require('../models/Task')
const House = require('../models/House')
const User = require('../models/User')
const Notification = require('../models/Notification')

const getHouseForUser = async (userId) => {
	const user = await User.findById(userId)
	if (!user?.houseId) return null
	return House.findById(user.houseId)
}

const getTaskHouseMembers = async (houseId) => {
	const house = await House.findById(houseId)
	if (!house) return []
	return house.members.map(member => String(member.userId))
}

const addTask = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(400).json({ message: 'Join a house first' })

		const task = await Task.create({
			houseId: house._id,
			title: req.body.title,
			description: req.body.description,
			assignedTo: req.body.assignedTo || null,
			status: req.body.status || 'pending',
			priority: req.body.priority || 'low',
			dueDate: req.body.dueDate || null,
			repeat: Boolean(req.body.repeat),
			createdBy: req.user._id,
		})

		const notifications = []
		if (task.assignedTo) {
			notifications.push({
				userId: task.assignedTo,
				houseId: house._id,
				type: 'task',
				title: 'New chore assigned',
				body: `${req.user.name} assigned you a task: ${task.title}`,
				link: '/tasks',
			})
		}

		const memberIds = await getTaskHouseMembers(house._id)
		memberIds
			.filter(memberId => String(memberId) !== String(req.user._id) && String(memberId) !== String(task.assignedTo || ''))
			.forEach(memberId => {
				notifications.push({
					userId: memberId,
					houseId: house._id,
					type: 'task',
					title: 'New task added',
					body: `${req.user.name} added ${task.title}`,
					link: '/tasks',
				})
			})

		if (notifications.length > 0) await Notification.insertMany(notifications)

		return res.status(201).json({ task })
	} catch (error) {
		next(error)
	}
}

const getTasks = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.json({ tasks: [] })

		const tasks = await Task.find({ houseId: house._id }).sort({ createdAt: -1 })
		return res.json({ tasks })
	} catch (error) {
		next(error)
	}
}

const updateTask = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const task = await Task.findOne({ _id: req.params.id, houseId: house._id })
		if (!task) return res.status(404).json({ message: 'Task not found' })

		;['title', 'description', 'assignedTo', 'priority', 'dueDate', 'repeat'].forEach(key => {
			if (req.body[key] !== undefined) task[key] = req.body[key]
		})

		if (req.body.status !== undefined) {
			task.status = req.body.status
			task.completedAt = req.body.status === 'completed' ? new Date() : null
		}

		await task.save()

		if (req.body.assignedTo) {
			await Notification.create({
				userId: req.body.assignedTo,
				houseId: house._id,
				type: 'task',
				title: 'Task updated',
				body: `${req.user.name} updated a task: ${task.title}`,
				link: '/tasks',
			})
		}

		return res.json({ task })
	} catch (error) {
		next(error)
	}
}

const deleteTask = async (req, res, next) => {
	try {
		const house = await getHouseForUser(req.user._id)
		if (!house) return res.status(404).json({ message: 'House not found' })

		const task = await Task.findOneAndDelete({ _id: req.params.id, houseId: house._id })
		if (!task) return res.status(404).json({ message: 'Task not found' })

		return res.json({ message: 'Task deleted' })
	} catch (error) {
		next(error)
	}
}

module.exports = { addTask, getTasks, updateTask, deleteTask }
