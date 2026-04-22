const cron = require('node-cron')
const House = require('../models/House')
const User = require('../models/User')
const RentPayment = require('../models/RentPayment')
const Notification = require('../models/Notification')
const { sendMail } = require('../utils/mailer')

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const toMonthKey = (date = new Date()) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10)

const ensureMonthlyRentRecords = async (house, month = toMonthKey()) => {
  if (!MONTH_REGEX.test(month)) throw new Error('Invalid month format')
  if (!house || !house._id) return []

  const memberIds = house.members.map(member => String(member.userId))
  if (memberIds.length === 0) return []

  const totalRent = Number(house.monthlyRentAmount || 0)
  const perPerson = roundMoney(totalRent / memberIds.length)

  const existing = await RentPayment.find({ houseId: house._id, month })
  const existingMap = new Map(existing.map(item => [`${item.userId}`, item]))

  const toCreate = []
  memberIds.forEach(userId => {
    if (!existingMap.has(userId)) {
      toCreate.push({
        houseId: house._id,
        userId,
        month,
        amountDue: perPerson,
        status: 'unpaid',
      })
    }
  })

  if (toCreate.length > 0) {
    await RentPayment.insertMany(toCreate)
  }

  const staleRecords = existing.filter(item => !memberIds.includes(String(item.userId)) && item.status === 'unpaid')
  if (staleRecords.length > 0) {
    await RentPayment.deleteMany({ _id: { $in: staleRecords.map(item => item._id) } })
  }

  await RentPayment.updateMany(
    { houseId: house._id, month, status: 'unpaid', userId: { $in: memberIds } },
    { $set: { amountDue: perPerson } },
  )

  return RentPayment.find({ houseId: house._id, month })
}

const runRentRemindersForMonth = async ({ month = toMonthKey(), now = new Date(), houseIds = null } = {}) => {
  if (!MONTH_REGEX.test(month)) return { sent: 0 }

  const day = now.getDate()
  if (day < 25) return { sent: 0 }

  const houseQuery = houseIds?.length ? { _id: { $in: houseIds } } : {}
  const houses = await House.find(houseQuery)
  if (houses.length === 0) return { sent: 0 }

  let sent = 0
  const todayKey = getTodayKey(now)

  for (const house of houses) {
    const records = await ensureMonthlyRentRecords(house, month)
    const dueRecords = records.filter(record => record.status !== 'paid' && Number(record.amountDue) > 0)
    if (dueRecords.length === 0) continue

    const dueUserIds = dueRecords.map(record => record.userId)
    const users = await User.find({ _id: { $in: dueUserIds } })
    const userMap = new Map(users.map(user => [String(user._id), user]))

    for (const record of dueRecords) {
      const user = userMap.get(String(record.userId))
      if (!user) continue

      if (record.lastReminderAt && getTodayKey(record.lastReminderAt) === todayKey) {
        continue
      }

      const shouldNotify = user.notifications?.payment !== false
      if (shouldNotify) {
        await Notification.create({
          userId: user._id,
          houseId: house._id,
          type: 'payment',
          title: 'Monthly rent due',
          body: `Your ${month} rent payment is pending. Please pay LKR ${Number(record.amountDue).toLocaleString('en-LK')}.`,
          amount: record.amountDue,
          link: '/'
        })
      }

      await sendMail({
        to: user.email,
        subject: `Rent Reminder: ${house.name} (${month})`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2 style="margin:0 0 12px">Monthly rent payment reminder</h2>
            <p style="margin:0 0 12px">Your rent for <strong>${month}</strong> in <strong>${house.name}</strong> is still pending.</p>
            <p style="margin:0 0 12px">Amount due: <strong>LKR ${Number(record.amountDue).toLocaleString('en-LK')}</strong></p>
            <p style="margin:0">Please open Rental Life and pay your rent from the dashboard.</p>
          </div>
        `,
      })

      record.lastReminderAt = now
      await record.save()
      sent += 1
    }
  }

  return { sent }
}

const getRentStatusForUser = async ({ house, userId, month = toMonthKey(), now = new Date() }) => {
  const records = await ensureMonthlyRentRecords(house, month)
  const day = now.getDate()

  const myRecord = records.find(record => String(record.userId) === String(userId))
  const paidCount = records.filter(record => record.status === 'paid').length
  const memberUsers = await User.find({ _id: { $in: house.members.map(member => member.userId) } }).select('name displayName')
  const userMap = new Map(memberUsers.map(member => [String(member._id), member]))
  const recordMap = new Map(records.map(record => [String(record.userId), record]))

  const memberStatuses = house.members.map(member => {
    const memberId = String(member.userId)
    const memberUser = userMap.get(memberId)
    const memberRecord = recordMap.get(memberId)
    return {
      userId: memberId,
      name: memberUser?.displayName || memberUser?.name || 'Member',
      status: memberRecord?.status || 'unpaid',
      amountDue: Number(memberRecord?.amountDue || 0),
      paidAt: memberRecord?.paidAt || null,
    }
  })

  return {
    month,
    totalRentAmount: Number(house.monthlyRentAmount || 0),
    memberCount: house.members.length,
    perPersonRent: roundMoney(Number(house.monthlyRentAmount || 0) / Math.max(house.members.length, 1)),
    myRent: myRecord
      ? {
          status: myRecord.status,
          amountDue: Number(myRecord.amountDue || 0),
          paidAt: myRecord.paidAt || null,
        }
      : { status: 'unpaid', amountDue: 0, paidAt: null },
    paidCount,
    unpaidCount: Math.max(records.length - paidCount, 0),
    memberStatuses,
    payButtonVisible: day >= 20,
    earlyPayAllowed: true,
    warningVisible: day >= 25 && myRecord?.status !== 'paid',
  }
}

const startRentReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      await runRentRemindersForMonth({ now: new Date() })
    } catch (error) {
      console.error('Rent reminder cron failed:', error)
    }
  })
}

module.exports = {
  toMonthKey,
  ensureMonthlyRentRecords,
  getRentStatusForUser,
  runRentRemindersForMonth,
  startRentReminderCron,
}
