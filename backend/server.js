const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const path = require('path')
const connectDB = require('./config/db')
const { startRentReminderCron } = require('./services/rentService')

dotenv.config({ path: path.resolve(__dirname, '.env') })
connectDB()

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

// Routes
app.use('/api/auth',         require('./routes/authRoutes'))
app.use('/api/house',        require('./routes/houseRoutes'))
app.use('/api/expense',      require('./routes/expenseRoutes'))
app.use('/api/balance',      require('./routes/balanceRoutes'))
app.use('/api/task',         require('./routes/taskRoutes'))
app.use('/api/notifications',require('./routes/notificationRoutes'))
app.use('/api/chat',         require('./routes/chatRoutes'))

app.get('/', (_, res) => res.json({ message: 'Rental Life API running' }))

app.use(require('./middleware/errorMiddleware'))

startRentReminderCron()

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))