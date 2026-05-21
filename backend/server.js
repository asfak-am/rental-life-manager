const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const path = require('path')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const { startRentReminderCron } = require('./services/rentService')

dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '')
const configuredClientOrigin = normalizeOrigin(process.env.CLIENT_URL || 'https://rental-life.vercel.app')
const allowedOrigins = new Set([
  configuredClientOrigin,
  'http://localhost:5173',
  'http://localhost:5174',
])

const isAllowedOrigin = (origin) => {
  if (!origin) return true

  const normalizedOrigin = normalizeOrigin(origin)
  if (allowedOrigins.has(normalizedOrigin)) return true

  // Allow Vercel preview deployments (e.g. branch-name-project.vercel.app).
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '12mb' }))

// Guard API traffic when Mongo is unavailable to avoid buffered query timeouts.
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please try again shortly.',
    })
  }
  return next()
})

// Routes
app.use('/api/auth',         require('./routes/authRoutes'))
app.use('/api/house',        require('./routes/houseRoutes'))
app.use('/api/expense',      require('./routes/expenseRoutes'))
app.use('/api/balance',      require('./routes/balanceRoutes'))
app.use('/api/task',         require('./routes/taskRoutes'))
app.use('/api/notifications',require('./routes/notificationRoutes'))
app.use('/api/help',         require('./routes/helpRoutes'))

app.get('/', (_, res) => res.json({ message: 'Rental Life API running' }))

app.use(require('./middleware/errorMiddleware'))

startRentReminderCron()

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()