const Notification = require('../models/Notification')

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 })
    return res.json({ notifications })
  } catch (error) {
    next(error)
  }
}

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } })
    return res.json({ message: 'Notifications marked as read' })
  } catch (error) {
    next(error)
  }
}

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { returnDocument: 'after' },
    )

    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    return res.json({ notification })
  } catch (error) {
    next(error)
  }
}

module.exports = { getNotifications, markAllRead, markRead }