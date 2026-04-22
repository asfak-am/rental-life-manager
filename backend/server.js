const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))