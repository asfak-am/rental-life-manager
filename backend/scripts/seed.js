// ─── scripts/seed.js ───────────────────────────────────────────────────────────
require('dotenv').config()
const mongoose = require('mongoose')

// Import models
const User = require('../models/User')
const House = require('../models/House')
const Expense = require('../models/Expense')
const Task = require('../models/Task')
const RentPayment = require('../models/RentPayment')
const Notification = require('../models/Notification')

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}

// Generate dates spanning 1 year from 12 months ago
const generateDateInRange = (monthsAgo, dayInMonth = null) => {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayInMonth || Math.floor(Math.random() * 28) + 1)
  return date
}

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB()

    // Check if --clean flag is provided to clear data
    const shouldClearData = process.argv.includes('--clean')

    if (shouldClearData) {
      console.log('🗑️  Clearing existing data...')
      await Promise.all([
        User.deleteMany({}),
        House.deleteMany({}),
        Expense.deleteMany({}),
        Task.deleteMany({}),
        RentPayment.deleteMany({}),
        Notification.deleteMany({}),
      ])
    } else {
      console.log('⚠️  Keeping existing data (use --clean flag to delete and reseed)')
    }

    console.log('Creating demo users...')
    // Upsert demo users and set plain password so model hook hashes exactly once.
    const demoUsers = [
      {
        name: 'Alex Johnson',
        email: 'alex@demo.com',
        displayName: 'Alex',
      },
      {
        name: 'Sarah Smith',
        email: 'sarah@demo.com',
        displayName: 'Sarah',
      },
      {
        name: 'Mike Brown',
        email: 'mike@demo.com',
        displayName: 'Mike',
      },
      {
        name: 'Emily Davis',
        email: 'emily@demo.com',
        displayName: 'Emily',
      },
    ]

    const users = []
    for (const demoUser of demoUsers) {
      let user = await User.findOne({ email: demoUser.email })
      if (!user) {
        user = new User({ email: demoUser.email })
      }

      user.name = demoUser.name
      user.displayName = demoUser.displayName
      user.password = 'password123'
      user.isVerified = true
      user.currency = 'USD'
      user.notifications = { expense: true, task: true, payment: true }

      await user.save()
      users.push(user)
    }

    console.log('Creating demo house...')
    // Create demo house
    const house = await House.create({
      name: 'Downtown Apartment',
      inviteCode: 'DEMO123ABC',
      monthlyRentAmount: 1500,
      members: [
        { userId: users[0]._id, role: 'admin', joinedAt: generateDateInRange(12) },
        { userId: users[1]._id, role: 'member', joinedAt: generateDateInRange(11) },
        { userId: users[2]._id, role: 'member', joinedAt: generateDateInRange(10) },
        { userId: users[3]._id, role: 'member', joinedAt: generateDateInRange(9) },
      ],
    })

    // Update users with houseId
    await User.updateMany(
      { _id: { $in: users.map(u => u._id) } },
      { houseId: house._id }
    )

    console.log('Creating demo expenses...')
    // Expense categories and realistic amounts
    const expenseCategories = [
      { category: 'Rent', amount: 375, monthly: true },
      { category: 'Utilities', amount: 45, monthly: true },
      { category: 'Water Bill', amount: 35, monthly: true },
      { category: 'Electricity Bill', amount: 55, monthly: true },
      { category: 'Food', amount: 25, monthly: false },
      { category: 'Food', amount: 35, monthly: false },
      { category: 'Entertainment', amount: 20, monthly: false },
      { category: 'Transport', amount: 15, monthly: false },
    ]

    const expenses = []

    // Create recurring monthly expenses (Rent, Utilities, Bills)
    for (let month = 0; month < 12; month++) {
      const monthDate = generateDateInRange(month, 1)
      const monthString = monthDate.toISOString().slice(0, 7) // YYYY-MM

      // Rent
      const rentExpense = await Expense.create({
        houseId: house._id,
        createdBy: users[0]._id,
        title: 'Monthly Rent',
        amount: 1500,
        paidBy: users[0]._id,
        category: 'Rent',
        billMonth: monthString,
        date: monthDate,
        recurring: true,
        recurrenceRule: 'monthly',
        splitType: 'equal',
        participants: users.map(u => ({
          userId: u._id,
          amountOwed: 1500 / 4,
          settled: Math.random() > 0.2,
          settledAt: Math.random() > 0.2 ? new Date(monthDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        })),
        auditTrail: [
          {
            action: 'created',
            by: users[0]._id,
            timestamp: monthDate,
          },
        ],
      })
      expenses.push(rentExpense)

      // Utilities
      const utilityPayer = users[Math.floor(Math.random() * users.length)]
      const utilityExpense = await Expense.create({
        houseId: house._id,
        createdBy: utilityPayer._id,
        title: 'Internet & Utilities',
        amount: 90,
        paidBy: utilityPayer._id,
        category: 'Utilities',
        billMonth: monthString,
        date: generateDateInRange(month, 5),
        recurring: true,
        recurrenceRule: 'monthly',
        splitType: 'equal',
        participants: users.map(u => ({
          userId: u._id,
          amountOwed: 90 / 4,
          settled: Math.random() > 0.3,
          settledAt: Math.random() > 0.3 ? new Date() : null,
        })),
      })
      expenses.push(utilityExpense)

      // Water Bill
      const waterPayer = users[Math.floor(Math.random() * users.length)]
      const waterExpense = await Expense.create({
        houseId: house._id,
        createdBy: waterPayer._id,
        title: 'Water Bill',
        amount: 35,
        paidBy: waterPayer._id,
        category: 'Water Bill',
        billMonth: monthString,
        date: generateDateInRange(month, 10),
        recurring: true,
        recurrenceRule: 'monthly',
        splitType: 'equal',
        participants: users.map(u => ({
          userId: u._id,
          amountOwed: 35 / 4,
          settled: Math.random() > 0.25,
          settledAt: Math.random() > 0.25 ? new Date() : null,
        })),
      })
      expenses.push(waterExpense)

      // Electricity Bill
      const electricPayer = users[Math.floor(Math.random() * users.length)]
      const electricExpense = await Expense.create({
        houseId: house._id,
        createdBy: electricPayer._id,
        title: 'Electricity Bill',
        amount: 55 + Math.floor(Math.random() * 30),
        paidBy: electricPayer._id,
        category: 'Electricity Bill',
        billMonth: monthString,
        date: generateDateInRange(month, 15),
        recurring: true,
        recurrenceRule: 'monthly',
        splitType: 'equal',
        participants: users.map(u => ({
          userId: u._id,
          amountOwed: (55 + Math.floor(Math.random() * 30)) / 4,
          settled: Math.random() > 0.25,
          settledAt: Math.random() > 0.25 ? new Date() : null,
        })),
      })
      expenses.push(electricExpense)
    }

    // Create random non-recurring expenses (groceries, entertainment, transport)
    for (let i = 0; i < 30; i++) {
      const monthsAgo = Math.floor(Math.random() * 12)
      const payer = users[Math.floor(Math.random() * users.length)]
      const category = ['Food', 'Entertainment', 'Transport', 'Other'][Math.floor(Math.random() * 4)]
      const amounts = {
        Food: 15 + Math.random() * 50,
        Entertainment: 10 + Math.random() * 40,
        Transport: 5 + Math.random() * 30,
        Other: 10 + Math.random() * 50,
      }

      await Expense.create({
        houseId: house._id,
        createdBy: payer._id,
        title:
          category === 'Food'
            ? ['Grocery Store', 'Restaurant', 'Coffee Shop'][Math.floor(Math.random() * 3)]
            : category === 'Entertainment'
              ? ['Movie', 'Concert', 'Game'][Math.floor(Math.random() * 3)]
              : category === 'Transport'
                ? ['Uber', 'Gas', 'Parking'][Math.floor(Math.random() * 3)]
                : 'Miscellaneous',
        amount: parseFloat(amounts[category].toFixed(2)),
        paidBy: payer._id,
        category,
        date: generateDateInRange(monthsAgo),
        splitType: Math.random() > 0.5 ? 'equal' : 'custom',
        participants:
          Math.random() > 0.3
            ? users.map(u => ({
                userId: u._id,
                amountOwed: parseFloat((amounts[category] / users.length).toFixed(2)),
                settled: false,
              }))
            : [
                {
                  userId: users[Math.floor(Math.random() * users.length)]._id,
                  amountOwed: amounts[category],
                  settled: false,
                },
              ],
      })
    }

    console.log('Creating demo rent payments...')
    // Create rent payments for 12 months
    for (let month = 0; month < 12; month++) {
      const paymentDate = generateDateInRange(month, 5)
      const monthString = paymentDate.toISOString().slice(0, 7)

      for (const user of users) {
        const isPaid = Math.random() > 0.3 // 70% chance of payment
        await RentPayment.create({
          houseId: house._id,
          userId: user._id,
          month: monthString,
          amountDue: 375,
          status: isPaid ? 'paid' : 'unpaid',
          paidAt: isPaid ? paymentDate : null,
          lastReminderAt: !isPaid ? new Date() : null,
        })
      }
    }

    console.log('Creating demo tasks...')
    // Create demo tasks
    const tasks = await Task.create([
      {
        houseId: house._id,
        title: 'Clean the kitchen',
        description: 'Deep clean kitchen including appliances',
        assignedTo: users[0]._id,
        createdBy: users[0]._id,
        status: 'completed',
        priority: 'high',
        dueDate: generateDateInRange(3),
        completedAt: generateDateInRange(2),
      },
      {
        houseId: house._id,
        title: 'Take out trash',
        description: 'Take out garbage and recycling',
        assignedTo: users[1]._id,
        createdBy: users[0]._id,
        status: 'completed',
        priority: 'medium',
        dueDate: generateDateInRange(2),
        completedAt: generateDateInRange(1),
      },
      {
        houseId: house._id,
        title: 'Fix bathroom sink',
        description: 'Repair the leaking sink in bathroom',
        assignedTo: users[2]._id,
        createdBy: users[1]._id,
        status: 'pending',
        priority: 'high',
        dueDate: generateDateInRange(1),
      },
      {
        houseId: house._id,
        title: 'Vacuum living room',
        description: 'Vacuum all carpets in living room',
        assignedTo: users[3]._id,
        createdBy: users[0]._id,
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        houseId: house._id,
        title: 'Buy household supplies',
        description: 'Get toilet paper, paper towels, and cleaning supplies',
        assignedTo: users[1]._id,
        createdBy: users[2]._id,
        status: 'pending',
        priority: 'low',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        houseId: house._id,
        title: 'Organize pantry',
        description: 'Organize and label pantry items',
        assignedTo: users[0]._id,
        createdBy: users[3]._id,
        status: 'completed',
        priority: 'low',
        dueDate: generateDateInRange(5),
        completedAt: generateDateInRange(4),
      },
    ])

    console.log('Creating demo notifications...')
    // Create demo notifications
    const notificationTexts = [
      { title: 'New Expense Added', body: 'Sarah added a new expense: Grocery Store ($32.50)' },
      { title: 'Payment Reminder', body: 'Remember to pay your share of rent: $375.00' },
      { title: 'Task Assigned', body: 'You have been assigned: Clean the kitchen' },
      { title: 'Task Completed', body: 'Alex completed task: Organize pantry' },
      { title: 'Expense Settled', body: 'Mike settled an expense of $45.00' },
      { title: 'New House Member', body: 'Emily joined the house: Downtown Apartment' },
      { title: 'Rent Payment Received', body: 'Sarah paid their rent share: $375.00' },
      { title: 'Expense Updated', body: 'Alex updated expense: Water Bill ($35.00)' },
    ]

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const notification = notificationTexts[Math.floor(Math.random() * notificationTexts.length)]
      const types = ['expense', 'payment', 'task', 'member']

      await Notification.create({
        userId: user._id,
        houseId: house._id,
        type: types[Math.floor(Math.random() * types.length)],
        title: notification.title,
        body: notification.body,
        read: Math.random() > 0.4,
        createdAt: generateDateInRange(Math.floor(Math.random() * 12)),
      })
    }

    console.log('✅ Database seeded successfully!')
    console.log(`
╔════════════════════════════════════════════════════╗
║          DEMO ACCOUNT CREDENTIALS                  ║
╠════════════════════════════════════════════════════╣
║ Email:    alex@demo.com                            ║
║ Password: password123                              ║
║                                                    ║
║ House Code: DEMO123ABC                             ║
║ House Name: Downtown Apartment                     ║
║ Monthly Rent: $1500 ($375 per person)              ║
║ Members: 4 (Alex, Sarah, Mike, Emily)              ║
║                                                    ║
║ Data Span: ~12 months of expenses & payments      ║
╚════════════════════════════════════════════════════╝
    `)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  }
}

seedDatabase()
