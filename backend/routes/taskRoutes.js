const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { addTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController')

const router = express.Router()

router.use(protect)
router.get('/', getTasks)
router.post('/add', addTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

module.exports = router
