const ChatMessage = require('../models/ChatMessage')
const House = require('../models/House')
const User = require('../models/User')

const getUserAndHouse = async (userId) => {
  const user = await User.findById(userId)
  if (!user?.houseId) return { user: null, house: null }
  const house = await House.findById(user.houseId)
  return { user, house }
}

const isHouseMember = (house, userId) => (
  house.members.some(member => String(member.userId) === String(userId))
)

const getHouseMembers = async (house) => {
  const ids = house.members.map(member => member.userId)
  return User.find({ _id: { $in: ids } }).select('name displayName avatar')
}

const toMessagePayload = (messageDoc) => ({
  _id: messageDoc._id,
  type: messageDoc.type,
  text: messageDoc.text,
  senderId: messageDoc.senderId?._id || messageDoc.senderId,
  recipientId: messageDoc.recipientId,
  readBy: messageDoc.readBy || [],
  createdAt: messageDoc.createdAt,
  sender: messageDoc.senderId
    ? {
        _id: messageDoc.senderId._id,
        name: messageDoc.senderId.name,
        displayName: messageDoc.senderId.displayName,
        avatar: messageDoc.senderId.avatar,
      }
    : null,
})

const getConversations = async (req, res, next) => {
  try {
    const { house } = await getUserAndHouse(req.user._id)
    if (!house) return res.json({ conversations: [] })

    const members = await getHouseMembers(house)
    const meId = String(req.user._id)

    const groupLast = await ChatMessage.findOne({
      houseId: house._id,
      type: 'group',
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name displayName avatar')

    const groupUnread = await ChatMessage.countDocuments({
      houseId: house._id,
      type: 'group',
      senderId: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    })

    const directConversations = await Promise.all(
      members
        .filter(member => String(member._id) !== meId)
        .map(async member => {
          const lastMessage = await ChatMessage.findOne({
            houseId: house._id,
            type: 'direct',
            $or: [
              { senderId: req.user._id, recipientId: member._id },
              { senderId: member._id, recipientId: req.user._id },
            ],
          })
            .sort({ createdAt: -1 })
            .populate('senderId', 'name displayName avatar')

          const unreadCount = await ChatMessage.countDocuments({
            houseId: house._id,
            type: 'direct',
            senderId: member._id,
            recipientId: req.user._id,
            readBy: { $ne: req.user._id },
          })

          return {
            id: String(member._id),
            type: 'direct',
            name: member.displayName || member.name,
            avatar: member.avatar || null,
            participant: {
              _id: member._id,
              name: member.name,
              displayName: member.displayName,
              avatar: member.avatar,
            },
            unreadCount,
            lastAt: lastMessage?.createdAt || null,
            lastMessage: lastMessage ? toMessagePayload(lastMessage) : null,
          }
        }),
    )

    directConversations.sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return a.name.localeCompare(b.name)
      if (!a.lastAt) return 1
      if (!b.lastAt) return -1
      return new Date(b.lastAt) - new Date(a.lastAt)
    })

    const groupConversation = {
      id: 'group',
      type: 'group',
      name: `${house.name} Group`,
      unreadCount: groupUnread,
      lastAt: groupLast?.createdAt || null,
      lastMessage: groupLast ? toMessagePayload(groupLast) : null,
    }

    return res.json({ conversations: [groupConversation, ...directConversations] })
  } catch (error) {
    next(error)
  }
}

const getMessages = async (req, res, next) => {
  try {
    const { house } = await getUserAndHouse(req.user._id)
    if (!house) return res.json({ messages: [] })

    const type = req.query.type === 'direct' ? 'direct' : 'group'
    const baseQuery = { houseId: house._id, type }

    if (type === 'direct') {
      const otherUserId = req.query.userId
      if (!otherUserId) return res.status(400).json({ message: 'userId is required for direct chat' })
      if (!isHouseMember(house, otherUserId)) return res.status(403).json({ message: 'User is not in your house' })
      if (String(otherUserId) === String(req.user._id)) return res.status(400).json({ message: 'Cannot open direct chat with yourself' })

      baseQuery.$or = [
        { senderId: req.user._id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user._id },
      ]
    }

    const messages = await ChatMessage.find(baseQuery)
      .sort({ createdAt: 1 })
      .limit(150)
      .populate('senderId', 'name displayName avatar')

    await ChatMessage.updateMany(
      {
        _id: { $in: messages.map(message => message._id) },
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } },
    )

    return res.json({ messages: messages.map(toMessagePayload) })
  } catch (error) {
    next(error)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    const { house } = await getUserAndHouse(req.user._id)
    if (!house) return res.status(400).json({ message: 'Join a house first' })

    const type = req.body.type === 'direct' ? 'direct' : 'group'
    const text = String(req.body.text || '').trim()
    if (!text) return res.status(400).json({ message: 'Message cannot be empty' })

    const payload = {
      houseId: house._id,
      senderId: req.user._id,
      type,
      text,
      readBy: [req.user._id],
    }

    if (type === 'direct') {
      const recipientId = req.body.userId
      if (!recipientId) return res.status(400).json({ message: 'userId is required for direct messages' })
      if (!isHouseMember(house, recipientId)) return res.status(403).json({ message: 'User is not in your house' })
      if (String(recipientId) === String(req.user._id)) return res.status(400).json({ message: 'Cannot message yourself' })
      payload.recipientId = recipientId
    }

    const message = await ChatMessage.create(payload)
    const populated = await ChatMessage.findById(message._id).populate('senderId', 'name displayName avatar')

    return res.status(201).json({ message: toMessagePayload(populated) })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
}
